import React, { useState, useEffect } from 'react';

interface DeployTabProps {
    targetUrl: string;
    setTargetUrl: (url: string) => void;
    deployStatus: 'idle' | 'deploying' | 'success' | 'error';
    deployLog: string[];
    onDeploy: () => void;
    onDeployTest: () => void;
    password?: string;
    setPassword?: (pass: string) => void;
}

export const DeployTab: React.FC<DeployTabProps> = ({ targetUrl, setTargetUrl, deployStatus, deployLog, onDeploy, onDeployTest, password, setPassword }) => {
    const [gitBranch, setGitBranch] = useState<string>('');

    useEffect(() => {
        fetch('http://localhost:3015/api/branch')
            .then(res => res.json())
            .then(data => { if (data.branch) setGitBranch(data.branch); })
            .catch(() => setGitBranch('main'));
    }, []);
    const handleDownloadScripts = async () => {
        const JSZip = (await import('https://esm.sh/jszip')).default;
        const zip = new JSZip();

        const deployPhp = `<?php
/**
 * Kråkefot Builder - Robust Deployment Proxy
 */
$expected_password = "${password || 'tryte-999-en-Roste-Draes'}"; 

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); die(json_encode(['error' => 'Method Not Allowed'])); }

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['password']) || $input['password'] !== $expected_password) {
    http_response_code(401); die(json_encode(['error' => 'Unauthorized']));
}

$filename = isset($input['filename']) ? $input['filename'] : '';
$content = isset($input['content']) ? $input['content'] : '';

// Security: Prevent directory traversal
if (strpos($filename, '..') !== false) { http_response_code(400); die(json_encode(['error' => 'Invalid filename'])); }

$target_path = __DIR__ . '/' . $filename;
$dir = dirname($target_path);
if (!is_dir($dir)) { mkdir($dir, 0755, true); }

if (file_put_contents($target_path, $content) !== false) {
    echo json_encode(['success' => true, 'file' => $filename]);
} else {
    http_response_code(500); echo json_encode(['error' => 'Failed to write']);
}
?>`;

        const mediaManagerPhp = `<?php
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

if (!is_dir($media_dir)) {
    if (!mkdir($media_dir, 0755, true)) {
         http_response_code(500);
         echo json_encode(array('error' => 'Failed to create media directory.'));
         exit();
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

$expected_password = "${password || 'tryte-999-en-Roste-Draes'}"; 

if ($password !== $expected_password) {
    http_response_code(401);
    echo json_encode(array('error' => 'Unauthorized'));
    exit();
}

if ($action === 'list') {
    $files = array();
    if (is_dir($media_dir)) {
        $dh = opendir($media_dir);
        if ($dh) {
            while (($file = readdir($dh)) !== false) {
                if ($file != "." && $file != ".." && !is_dir($media_dir . $file)) {
                    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                    $type = 'unknown';
                    if (in_array($ext, array('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'))) {
                        $type = 'image';
                    } elseif (in_array($ext, array('mp4', 'webm', 'mov'))) {
                        $type = 'video';
                    }

                    if ($type !== 'unknown' && strpos($file, 'metadata') === false) {
                        $files[] = array(
                            'name' => $file,
                            'url' => 'media/' . $file,
                            'type' => $type,
                            'size' => filesize($media_dir . $file),
                            'date' => filemtime($media_dir . $file)
                        );
                    }
                }
            }
            closedir($dh);
        } else {
            http_response_code(500);
            echo json_encode(array('error' => 'Failed to open media directory.'));
            exit();
        }
    }
    
    if (!empty($files) && is_array($files)) {
        usort($files, function($a, $b) {
            return $b['date'] - $a['date'];
        });
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
            if (!in_array($ext, array('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov'))) {
                $errors[] = $name . " has invalid extension.";
                continue;
            }

            $destination = $media_dir . $name;
            
            if (file_exists($destination)) {
                $info = pathinfo($destination);
                $name = $info['filename'] . '_' . time() . '.' . $info['extension'];
                $destination = $media_dir . $name;
            }

            if (move_uploaded_file($tmp_name, $destination)) {
                $uploaded_files[] = 'media/' . $name;
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
}

if ($action === 'delete') {
    $filename = isset($input['filename']) ? $input['filename'] : (isset($_POST['filename']) ? $_POST['filename'] : '');
    
    // Prevent directory traversal attacks
    if (empty($filename) || strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\\\') !== false) {
        http_response_code(400);
        echo json_encode(array('error' => 'Invalid filename'));
        exit();
    }

    $targetPath = $media_dir . $filename;
    $deleted_files = array();

    // Check if it's a responsive base name request
    if (preg_match('/^(.*)-(\\d+)\\.webp$/', $filename, $matches)) {
        $baseName = $matches[1];
        // Delete all matching responsive sizes
        $sizes = array(480, 960, 1920, 2880);
        foreach ($sizes as $size) {
            $path = $media_dir . $baseName . '-' . $size . '.webp';
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
                $deleted_files[] = $filename;
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

http_response_code(400);
echo json_encode(array('error' => 'Invalid action'));
?>`;

        zip.file('deploy.php', deployPhp);
        zip.file('media_manager.php', mediaManagerPhp);

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kraakefot_server_scripts.zip';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Target URL</label>
                    <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 outline-none focus:border-[var(--accent)] transition-colors" placeholder="https://kraakefot.com" />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Deploy Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword?.(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 outline-none focus:border-[var(--accent)] transition-colors" placeholder="•••••••••••••••••••••" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <button onClick={onDeploy} disabled={deployStatus === 'deploying'} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {deployStatus === 'deploying' ? 'Publishing...' : 'Deploy Live (Main)'}
                </button>
                <button 
                    onClick={onDeployTest} 
                    disabled={deployStatus === 'deploying'} 
                    className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 py-3 rounded-xl font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                >
                    Test Version ( {gitBranch ? `/v3/${gitBranch === 'main' ? 'main' : gitBranch}` : '/v3'} )
                </button>
            </div>

            <div className="flex justify-center">
                <button onClick={handleDownloadScripts} className="text-[10px] text-zinc-500 hover:text-zinc-300 underline decoration-zinc-700 hover:decoration-zinc-300 underline-offset-4 transition-all">
                    Download Server Scripts (deploy.php & media_manager.php)
                </button>
            </div>
            {deployLog.length > 0 && (
                <div className="bg-black rounded-xl p-4 border border-zinc-800 h-40 overflow-y-auto font-mono text-[10px]">
                    {deployLog.map((l, i) => <div key={i} className="text-emerald-400 mb-1">{l}</div>)}
                </div>
            )}
        </div>
    );
};
