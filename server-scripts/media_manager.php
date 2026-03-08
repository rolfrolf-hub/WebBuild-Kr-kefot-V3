<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$media_dir = dirname(__FILE__) . '/media/';
$image_dir = $media_dir . 'images/';
$video_dir = $media_dir . 'video/';
$audio_dir = $media_dir . 'audio/';
$zip_dir   = $media_dir . 'zip/';
$misc_dir  = $media_dir . 'misc/';

$dirs = [$media_dir, $image_dir, $video_dir, $audio_dir, $zip_dir, $misc_dir];
foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) {
            http_response_code(500);
            echo json_encode(array('error' => 'Failed to create media directory: ' . $dir));
            exit();
        }
    }
}

$input = json_decode(file_get_contents('php://input'), true);

if ($input && isset($input['password'])) {
    $password = $input['password'];
    $action = isset($input['action']) ? $input['action'] : 'list';
} else {
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : 'list');
}

$stored_pass = "tryte-999-en-Roste-Draes"; // This must match your frontend config

if ($password !== $stored_pass) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit();
}

if ($action === 'list') {
    $files = array();
    $directories_to_scan = [
        ['path' => $media_dir, 'prefix' => 'media/'],
        ['path' => $image_dir, 'prefix' => 'media/images/'],
        ['path' => $video_dir, 'prefix' => 'media/video/'],
        ['path' => $audio_dir, 'prefix' => 'media/audio/'],
        ['path' => $zip_dir,   'prefix' => 'media/zip/',  'forced_type' => 'zip'],
        ['path' => $misc_dir,  'prefix' => 'media/misc/', 'forced_type' => 'misc']
    ];

    foreach ($directories_to_scan as $scan_dir) {
        $current_dir = $scan_dir['path'];
        $url_prefix = $scan_dir['prefix'];
        $forced_type = isset($scan_dir['forced_type']) ? $scan_dir['forced_type'] : null;

        if (is_dir($current_dir)) {
            $dh = opendir($current_dir);
            if ($dh) {
                while (($file = readdir($dh)) !== false) {
                    if ($file != "." && $file != ".." && !is_dir($current_dir . $file)) {
                        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                        if ($forced_type) {
                            $type = $forced_type;
                        } else {
                            $type = 'unknown';
                            if (in_array($ext, array('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'))) {
                                $type = 'image';
                            } elseif (in_array($ext, array('mp4', 'webm', 'mov', 'm4v'))) {
                                $type = 'video';
                            } elseif (in_array($ext, array('mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'))) {
                                $type = 'audio';
                            }
                        }

                        if ($type !== 'unknown' && strpos($file, 'metadata') === false) {
                            $files[] = array(
                                'name' => $file,
                                'url' => $url_prefix . $file,
                                'type' => $type,
                                'size' => filesize($current_dir . $file),
                                'date' => filemtime($current_dir . $file),
                                'folder' => rtrim(str_replace('media/', '', $url_prefix), '/') ?: 'root'
                            );
                        }
                    }
                }
                closedir($dh);
            }
        }
    }

    if (!empty($files) && is_array($files)) {
        function sortByDateDesc($a, $b)
        {
            return $b['date'] - $a['date'];
        }
        usort($files, 'sortByDateDesc');
    }

    echo json_encode(array('files' => $files));
    exit();
}

if ($action === 'upload') {
    if (!isset($_FILES['files'])) {
        http_response_code(400);
        echo json_encode(array('error' => 'No files provided'));
        exit();
    }

    $uploaded_files = array();
    $errors = array();

    $files = $_FILES['files'];
    if (!is_array($files['name'])) {
        $files = array(
            'name' => array($files['name']),
            'type' => array($files['type']),
            'tmp_name' => array($files['tmp_name']),
            'error' => array($files['error']),
            'size' => array($files['size'])
        );
    }

    $count = count($files['name']);
    for ($i = 0; $i < $count; $i++) {
        if ($files['error'][$i] === UPLOAD_ERR_OK) {
            $tmp_name = $files['tmp_name'][$i];

            $name = basename($files['name'][$i]);
            $name = preg_replace("/[^a-zA-Z0-9\._-]/", "", $name);

            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            $allowed_exts = array(
                'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
                'mp4', 'webm', 'mov', 'm4v',
                'mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac',
                'zip',
                'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv',
                'rar', '7z', 'tar', 'gz'
            );
            if (!in_array($ext, $allowed_exts)) {
                $errors[] = $name . " has invalid extension.";
                continue;
            }

            // Determine target directory
            if (in_array($ext, array('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'))) {
                $target_dir = $image_dir;
                $relative_dir = 'images/';
            } elseif (in_array($ext, array('mp4', 'webm', 'mov', 'm4v'))) {
                $target_dir = $video_dir;
                $relative_dir = 'video/';
            } elseif (in_array($ext, array('mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'))) {
                $target_dir = $audio_dir;
                $relative_dir = 'audio/';
            } elseif ($ext === 'zip') {
                $target_dir = $zip_dir;
                $relative_dir = 'zip/';
            } else {
                $target_dir = $misc_dir;
                $relative_dir = 'misc/';
            }

            $destination = $target_dir . $name;

            if (file_exists($destination)) {
                $info = pathinfo($destination);
                $name = $info['filename'] . '_' . time() . '.' . $info['extension'];
                $destination = $target_dir . $name;
            }

            if (move_uploaded_file($tmp_name, $destination)) {
                $uploaded_files[] = 'media/' . $relative_dir . $name;
            } else {
                $errors[] = "Failed to move " . $name;
            }
        } else {
            $errors[] = "Error uploading " . $files['name'][$i];
        }
    }

    if (empty($uploaded_files) && !empty($errors)) {
        http_response_code(500);
        echo json_encode(array('error' => implode(', ', $errors)));
    } else {
        echo json_encode(array(
            'success' => true,
            'uploaded' => $uploaded_files,
            'errors' => $errors
        ));
    }
    exit();
    exit();
}

if ($action === 'delete') {
    $filename = isset($input['filename']) ? $input['filename'] : (isset($_POST['filename']) ? $_POST['filename'] : '');

    // Prevent directory traversal attacks, but allow specific subdirectories
    if (empty($filename) || strpos($filename, '..') !== false || strpos($filename, '\\') !== false) {
        http_response_code(400);
        echo json_encode(array('error' => 'Invalid filename'));
        exit();
    }

    // Strip "media/" if it accidentally was passed, we only want the relative part
    if (strpos($filename, 'media/') === 0) {
        $filename = substr($filename, 6);
    }

    $targetPath = $media_dir . $filename;
    $deleted_files = array();

    // Check if it's a responsive base name request
    if (preg_match('/^(.*)-(\d+)\.webp$/', basename($filename), $matches)) {
        $baseName = $matches[1];
        // Relpath to directory
        $dirPath = dirname($filename);
        if ($dirPath === '.')
            $dirPath = '';
        else
            $dirPath .= '/';

        // Delete all matching responsive sizes
        $sizes = array(480, 960, 1920);
        foreach ($sizes as $size) {
            $path = $media_dir . $dirPath . $baseName . '-' . $size . '.webp';
            if (file_exists($path)) {
                if (unlink($path)) {
                    $deleted_files[] = basename($path);
                }
            }
        }
    } else {
        // Delete single file
        if (file_exists($targetPath)) {
            if (unlink($targetPath)) {
                $deleted_files[] = basename($targetPath);
            } else {
                http_response_code(500);
                echo json_encode(array('error' => 'Failed to delete file. Check permissions.'));
                exit();
            }
        } else {
            http_response_code(404);
            echo json_encode(array('error' => 'File not found on server'));
            exit();
        }
    }

    echo json_encode(array(
        'success' => true,
        'deleted' => $deleted_files
    ));
    exit();
}

if ($action === 'deploy_php') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(array('error' => 'No file provided'));
        exit();
    }

    $tmp = $_FILES['file']['tmp_name'];
    $target = __FILE__; // Overwrite itself

    // Basic sanity check — must look like a PHP file
    $content = file_get_contents($tmp);
    if (strpos($content, '<?php') === false) {
        http_response_code(400);
        echo json_encode(array('error' => 'Invalid PHP file'));
        exit();
    }

    if (!copy($tmp, $target)) {
        http_response_code(500);
        echo json_encode(array('error' => 'Failed to write file. Check permissions.'));
        exit();
    }

    echo json_encode(array('success' => true, 'message' => 'media_manager.php updated successfully'));
    exit();
}

http_response_code(400);
echo json_encode(array('error' => 'Invalid action'));
?>