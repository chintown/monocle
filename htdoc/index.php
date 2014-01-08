<?php
    // http://www.chintown.org/monocle/?w=800&h=1200&u=xxx
    $w = $_GET['w'];
    $h = $_GET['h'];
    $url = urldecode($_GET['u']);
    $path = 'export PATH=/usr/bin/:/usr/local/bin/:/Users/chintown/opt/;';
    $cmd = $path."casperjs /Users/chintown/src/chrome/monocle/tools/rasterize_casper.js '$url' /tmp/foo.jpg $w $h";
    echo $cmd;
    exec($cmd, $result);
    var_dump($result);