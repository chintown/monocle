var DEBUG = false;

// function uploadImage(img) {
//     var xhr = new XMLHttpRequest(), formData = new FormData();
//     formData.append("user_uploaded", img);
//     xhr.open("POST", "http://foo.com/", true);
//     xhr.send(formData);
// }
// function drawLineAtTop(top) {
//     var $line = $('#line').length === 0 ? createLine() : $('#line');
//     $line.css('top', top);
// }
// function createLine() {
//     var $line = $('<div id="line"></div>');
//     $line.css({
//         'width': '100%',
//         'height': '2px',
//         'backgroundColor': 'blue',
//         'position': 'fixed'
//     });
//     $('body').append($line);
//     return $line;
// }

// --

function setupSidebar() {
    var $viewport = $('<div></div>').attr('id', 'viewport');
    $viewport.css({
        position: 'fixed',
        top: 0,
        bottom: 0,
        right: 0,
        zIndex: 999999999
    });
    var $snapshot = $('<div></div>').attr('id', 'snapshot');
    $snapshot.css({
        position: 'absolute',
        width: '100%'
    });
    var $thumbnail = $('<div></div>').attr('id', 'thumbnail');
    $thumbnail.css({
        position: 'absolute',
        width: '100%',
        backgroundColor: 'rgba(0%, 0%, 0%, 0.2)'
    });

    $viewport.append($snapshot);
    $viewport.append($thumbnail);
    $viewport.hide();
    $('body').append($viewport);
}

function setupSnapshot() {
    var lastScrollPosition = $(window).scrollTop();
    // http://html2canvas.hertzen.com/documentation.html
    html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        letterRendering: true,
        onrendered: function(canvas) {
            var ctx = canvas.getContext('2d');
            ctx.scale(SCALE_RATIO, SCALE_RATIO);

            // http://stackoverflow.com/questions/8517879/how-to-rotate-the-existing-content-of-html5-canvas
            var thumbCanvas = document.createElement("canvas"),
                thumbCtx = thumbCanvas.getContext("2d");
            thumbCanvas.width = SNAPSHOT_WIDTH;
            thumbCanvas.height = SNAPSHOT_HEIGHT;
            thumbCtx.drawImage(canvas, 0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
            $('#snapshot').empty().append(thumbCanvas);
            $('#viewport').show();

            $(window).scrollTop(lastScrollPosition);
        },
        width: CONTENT_WIDTH, //SNAPSHOT_WIDTH,
        height: CONTENT_HEIGHT, //SNAPSHOT_HEIGHT,
        background: '#eeeeee',
    });
}

function nativeSnapshot() {
    chrome.runtime.sendMessage({msg: "snapshot"}, function(response) {
        debugger;
        var img = new Image();
        img.width = CONTENT_WIDTH;
        img.height = CONTENT_HEIGHT;
        img.src = response.imgSrc;

        var thumbCanvas = document.createElement("canvas"),
            thumbCtx = thumbCanvas.getContext("2d");
        thumbCanvas.width = SNAPSHOT_WIDTH;
        thumbCanvas.height = SNAPSHOT_HEIGHT;
        thumbCtx.drawImage(img, 0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
        $('#snapshot').empty().append(thumbCanvas);
        $('#viewport').show();
    });
}

function refreshGlobalMetric() {
    var bookmarkBarHeight = 15;
    SUPPRESS_CUSTOMIZED_SCROLL = false;
    VIEWPORT_WIDTH = $('html').width();//window.innerWidth;// || document.body.clientWidth;
    VIEWPORT_HEIGHT = window.innerHeight - bookmarkBarHeight;// || document.body.clientHeight;
    // visible content
    CONTENT_WIDTH = $('html').width();//document.body.scrollWidth;
    CONTENT_HEIGHT = $('html').height();//document.body.scrollHeight;
    SNAPSHOT_WIDTH = THUMBNAIL_WIDTH = 200;
    SNAPSHOT_HEIGHT = SNAPSHOT_WIDTH * CONTENT_HEIGHT / CONTENT_WIDTH;
    SNAPSHOT_PLAYGROUND = (SNAPSHOT_HEIGHT > VIEWPORT_HEIGHT)
                            ? SNAPSHOT_HEIGHT - VIEWPORT_HEIGHT
                            : 0;
    THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * VIEWPORT_HEIGHT / VIEWPORT_WIDTH;
    THUMBNAIL_PLAYGROUND = (SNAPSHOT_HEIGHT > VIEWPORT_HEIGHT)
                            ? VIEWPORT_HEIGHT - THUMBNAIL_HEIGHT
                            : SNAPSHOT_HEIGHT - THUMBNAIL_HEIGHT;
    SCALE_RATIO = 1.0 * THUMBNAIL_WIDTH / VIEWPORT_WIDTH;

    if (DEBUG) {
        console.table({
            field: ['ratio', 'width', 'height'],
            content: [CONTENT_WIDTH / CONTENT_HEIGHT, CONTENT_WIDTH, CONTENT_HEIGHT],
            snapshot: [SNAPSHOT_WIDTH / SNAPSHOT_HEIGHT, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT],

            viewport: [VIEWPORT_WIDTH / VIEWPORT_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT],
            thumbnail: [THUMBNAIL_WIDTH / THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT],

            scale: ['thumbnail', 'viewport', SCALE_RATIO]
        });

        console.table({
            'snapshot range': ['range', 'snapshot', 'viewport', 'diff'],
            '.': [SNAPSHOT_PLAYGROUND, SNAPSHOT_HEIGHT, VIEWPORT_HEIGHT, SNAPSHOT_HEIGHT - VIEWPORT_HEIGHT],
            'thumbnail range': ['range', 'viewport', 'thumbnail', 'diff'],
            '..': [THUMBNAIL_PLAYGROUND, VIEWPORT_HEIGHT, THUMBNAIL_HEIGHT, VIEWPORT_HEIGHT - THUMBNAIL_HEIGHT],
        });
    }

    $('#viewport').width(SNAPSHOT_WIDTH);
    $('#snapshot').height(SNAPSHOT_HEIGHT);
    $('#thumbnail').height(THUMBNAIL_HEIGHT);
}

function bindScrollEvent() {
    $(window).scroll(function(){
        scrollByWindow($(this).scrollTop());
    });
}

var SCHEDULE_OF_POST_HOOK_RESIZING = -1;
function bindResizeEvent() {
    $(window).resize(function () {
        clearTimeout(SCHEDULE_OF_POST_HOOK_RESIZING);
        SCHEDULE_OF_POST_HOOK_RESIZING = setTimeout(postHookResizing, 500);
    });
}
function postHookResizing() {
    $('#viewport').hide();
    refreshGlobalMetric();
    setupSnapshot();
}

function bindDragEvent() {
    var $thumbnail = $('#thumbnail');
    $thumbnail.mousedown(function(initEvt) {
        var start = getMouseYOnVisibleWindow(initEvt);
        var originTop = parseInt($thumbnail.css('top'), 10);
        if (DEBUG) {drawLineAtTop(originTop);}
        originTop = isNaN(originTop) ? 0 : originTop;
        $(window).mousemove(function(movingEvt) {
            var offset = (getMouseYOnVisibleWindow(movingEvt)) - start;
            var newTop = originTop + offset;
            newTop = fixBound(newTop, 0, THUMBNAIL_PLAYGROUND);
            scrollByThumbnail(newTop);

            // console.log({
            //     pageY: movingEvt.pageY,
            //     offset: offset,
            //     newTop: newTop
            // });

            // disable window moving
            movingEvt.stopPropagation();
            return false;
        });
        $(document).mousedown(function(e){
            // disable text selection
            e.preventDefault();
        });
    });
    $(window).mouseup(function() {
        $(window).unbind("mousemove");
        $(document).unbind("mousemove");
    });
}

function bindJumpEvent() {
    $('#snapshot').click(function (evt) {
        var landing = getMouseYOnVisibleWindow(evt);
        landing -= 0.5 * THUMBNAIL_HEIGHT;
        var updatedY = fixBound(landing, 0, THUMBNAIL_PLAYGROUND);
        scrollByThumbnail(updatedY);
    });
}

function fixBound(input, min, max) {
    input = input < min ? min : input;
    input = input > max ? max : input;
    return input;
}

function getMouseYOnVisibleWindow(evt) {
    return evt.clientY; // evt.pageY - $(window).scrollTop()
}

function scrollByWindow(windowTop) {
    var scrollRatio = 1.0 * windowTop / (CONTENT_HEIGHT - VIEWPORT_HEIGHT);
    scrollRatio = fixBound(scrollRatio, 0, 1);
    $('#snapshot').css('top', 0 - (SNAPSHOT_PLAYGROUND * scrollRatio));
    $('#thumbnail').css('top', (THUMBNAIL_PLAYGROUND * scrollRatio));
}

function scrollByThumbnail(newTop) {
    var scrollRatio = 1.0 * newTop / THUMBNAIL_PLAYGROUND;
    $(window).scrollTop((CONTENT_HEIGHT - VIEWPORT_HEIGHT) * scrollRatio);
}

$(document).ready(function () {
    // initialize();
});

function initialize() {
    setupSidebar();
    refreshGlobalMetric();
    setupSnapshot();
    //nativeSnapshot();
    bindScrollEvent();
    bindResizeEvent();
    bindDragEvent();
    bindJumpEvent();
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.msg) {
        case "toggle-extension":
            var $viewport = $('#viewport');
            if ($viewport.length === 0) {
                initialize();
            } else if ($viewport.is(":visible")) {
                $viewport.hide();
            } else {
                $viewport.show();
            }
            break;
    }
});