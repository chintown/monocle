<?php
    // http://www.chintown.org/monocle/?w=800&h=1200&u=xxx
    $w = $_GET['w'];
    $h = $_GET['h'];
    $z = $_GET['z'];
    $url = urldecode($_GET['u']);
    $path = 'export PATH=/usr/bin/';
    $cmd = $path."casperjs /home/chintown/src/chrome/monocle/tools/rasterize_casper.js '$url' $w $h $z";
    echo $cmd;
    exec($cmd, $result);
    var_dump($result);