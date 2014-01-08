<?php
    $url = urldecode($_GET['u']);
    header("Content-Type:  image/jpeg");
    $file = '/tmp/monocle_' . $url;
    if (file_exists($file)) {
        echo file_get_contents($file);
    }