<?php
// Simple script to test parsing
$error = false;
try {
   eval('?>' . file_get_contents('server-scripts/media_manager.php'));
} catch (ParseError $e) {
    echo "Parse error: " . $e->getMessage() . "\n";
    $error = true;
}
if (!$error) {
    echo "No syntax errors found.\n";
}
