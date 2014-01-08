// https://github.com/tutsplus/responsive-screenshots-casper/blob/master/casperscreen.js
var casper = require("casper").create(),
    url = casper.cli.args[0],
    saveDir = url.replace(/[^a-zA-Z0-9]/gi, '-').replace(/^https?-+/, '');

casper.start();
var filename = casper.cli.args[1],
    width = casper.cli.args[2],
    height = casper.cli.args[3];
//give some time for the page to load
casper.wait(5000, function() {
    //set the viewport to the desired height and width
    this.viewport(width, height);
    casper.thenOpen(url, function() {
        this.echo('Opening at ' + width + ' x ' + height);
        //Capture selector captures the whole body
        // this.captureSelector(filename, 'body');
        //capture snaps a defined selection of the page
        this.capture(
            filename,
            {top: 0,left: 0,width: width, height: height},
            {format: 'jpg',quality: 40}
        );
        this.echo('snapshot taken');
    });
});

casper.run(function() {
    this.echo('Finished captures for ' + url).exit();
});