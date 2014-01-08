// http://acuriousanimal.com/blog/2012/09/15/taking-web-page-screenshots/
// https://github.com/ariya/phantomjs/wiki/API-Reference-WebPage#wiki-webpage-render
var page = require('webpage').create(),
    system = require('system'),
    address, output, size;

if (system.args.length < 3 || system.args.length > 6) {
    console.log('Usage: rasterize.js URL filename width height zoom');
    phantom.exit(1);
} else {
    address = system.args[1];
    output = system.args[2];
    page.viewportSize = { width: system.args[3], height: system.args[4] };
    if (system.args.length > 5) {
        page.zoomFactor = system.args[5];
    }
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
        } else {
            window.setTimeout(function () {
                page.render(output, { format: "jpg", quality: 50 });
                phantom.exit();
            }, 200);
        }
    });
}