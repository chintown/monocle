var DEBUG = false;
var PREFIX = 'monocle-';

    function uploadImage(img) {
        var xhr = new XMLHttpRequest(), formData = new FormData();
        formData.append("user_uploaded", img);
        xhr.open("POST", "http://foo.com/", true);
        xhr.send(formData);
    }
    function drawLineAtTop(top) {
        var $line = $('#line').length === 0 ? createLine() : $('#line');
        $line.css('top', top);
    }
    function createLine() {
        var $line = $('<div id="line"></div>');
        $line.css({
            'width': '100%',
            'height': '2px',
            'backgroundColor': 'blue',
            'position': 'fixed'
        });
        $('body').append($line);
        return $line;
    }
    function exportImage(canvas) {
        var $img = $('<img/>').attr('src', canvas.toDataURL("image/png"));
        $('body').append($img);
    }

// --

function setupSidebar() {
    var $viewport = $('<div></div>').attr('id', PREFIX+'viewport');
    $viewport.css({
        position: 'fixed',
        top: 0,
        bottom: 0,
        right: 0,
        zIndex: 9999999999
    });
    var $snapshot = $('<div></div>').attr('id', PREFIX+'snapshot');
    $snapshot.css({
        position: 'absolute',
        width: '100%'
    });
    var $thumbnail = $('<div></div>').attr('id', PREFIX+'thumbnail');
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
    LAST_SCROLL_POSITION = $(window).scrollTop();

    window.SELECTED_SNAPSHOT_METHOD();
    // jsSnapshot();
    // serverSideSnapshot();
    // nativeSnapshot();
}
function jsSnapshot() {
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
            //exportImage(canvas);
            $('#'+PREFIX+'snapshot').empty().append(thumbCanvas);
            $('#'+PREFIX+'viewport').show();

            $(window).scrollTop(window.LAST_SCROLL_POSITION);
        },
        width: CONTENT_WIDTH, //SNAPSHOT_WIDTH,
        height: CONTENT_HEIGHT, //SNAPSHOT_HEIGHT,
        background: '#eeeeee',
    });
}

function serverSideSnapshot() {
    var url = 'http://www.chintown.org/monocle/';
    $.get(url, {
        'w': VIEWPORT_WIDTH,
        'h': CONTENT_HEIGHT,
        'u': encodeURI(window.location.href),
        'z': window.devicePixelRatio
    }).done(function(data) {
        var urlParam = window.location.href.replace(/[^a-zA-Z0-9]/gi, '-').replace(/^https?-+/, '');
        var imgSrc = url + 'result.php?u=' + encodeURI(urlParam) + '.jpg';
        if (DEBUG) { console.log(data);console.log(imgSrc); }
        var img = new Image();
        img.width = CONTENT_WIDTH;
        img.height = CONTENT_HEIGHT;
        img.addEventListener('load', function(e) {
            // http://stackoverflow.com/questions/8517879/how-to-rotate-the-existing-content-of-html5-canvas
            var thumbCanvas = document.createElement("canvas"),
                thumbCtx = thumbCanvas.getContext("2d");
            thumbCanvas.width = SNAPSHOT_WIDTH;
            thumbCanvas.height = SNAPSHOT_HEIGHT;
            thumbCtx.drawImage(img, 0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
            $('#'+PREFIX+'snapshot').empty().append(thumbCanvas);
            $('#'+PREFIX+'viewport').show();

            $(window).scrollTop(window.LAST_SCROLL_POSITION);
        });
        img.src = imgSrc;
    });
}

function nativeSnapshot() {
    beforeNativeSnapshoted();
    onNativePartialSnapshoted(); // trick to trigger the first time
}
function beforeNativeSnapshoted() {
    resetCanvas();
    window.LAST_SCROLL_POSITION_FOR_NATIVE_SNAPSHOT = $(window).scrollTop();
    window.SNAPSHOT_POSITIONS = getPartialSnapshotPositions();
    window.RECOVERED_LIST = $('*').filter(function(){
       return $(this).css('position') === 'fixed';
    });
    window.RECOVERED_LIST.addClass('monocle-hidden');
}
function afterNativeSnapshoted() {
    $('#'+PREFIX+'viewport').show();
    window.RECOVERED_LIST.removeClass('monocle-hidden');
    $(window).scrollTop(window.LAST_SCROLL_POSITION_FOR_NATIVE_SNAPSHOT);
}
function onNativePartialSnapshoted() {
    var arrangements = window.SNAPSHOT_POSITIONS;
    var shouldStop = arrangements.length === 0;
    if (shouldStop) {
        afterNativeSnapshoted();
        return;
    }
    var position = window.SNAPSHOT_POSITIONS.shift();
    var offsetY = position[1];
    $(window).scrollTop(offsetY);
    window.setTimeout(function() {
        nativePartialSnapshot(offsetY, onNativePartialSnapshoted);
    }, 10);
}
function resetCanvas() {
    var thumbCanvas = document.createElement("canvas");
    thumbCanvas.setAttribute("id", "canvas-native");
    thumbCanvas.width = SNAPSHOT_WIDTH;
    thumbCanvas.height = SNAPSHOT_HEIGHT;
    $('#'+PREFIX+'snapshot').empty().append(thumbCanvas);
}
function nativePartialSnapshot(screenOffsetY, callback) {
    var snapshotOffsetY = SNAPSHOT_HEIGHT * screenOffsetY / CONTENT_HEIGHT;
    if (DEBUG) {
        console.table({
            field: ['position'],
            content: [screenOffsetY],
            snapshot: [snapshotOffsetY],
        });
        ////$('#'+PREFIX+'viewport').show();
    }

    chrome.runtime.sendMessage({msg: "snapshot"}, function(dataUrl) {
        console.assert(dataUrl !== null, 'empty snapshot');
        var img = new Image();
        img.width = VIEWPORT_WIDTH;
        img.height = CONTENT_HEIGHT;
        img.src = dataUrl;

        var ctx = $('#canvas-native').get(0).getContext("2d");
        ctx.drawImage(img, 0, snapshotOffsetY, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);

        callback();
    });
}

function getPartialSnapshotPositions() {
    var arrangements = [],
        // pad the vertical scrolling to try to deal with
        // sticky headers, 250 is an arbitrary size
        scrollPad = 200,
        yDelta = VIEWPORT_HEIGHT - (VIEWPORT_HEIGHT > scrollPad ? scrollPad : 0),
        yPos = CONTENT_HEIGHT - VIEWPORT_HEIGHT
        ;

    while (yPos > -yDelta) {
        arrangements.push([0, yPos < 0 ? 0 : yPos]);
        yPos -= yDelta;
    }
    if (DEBUG) {console.table(arrangements);}
    return arrangements;
}

function refreshGlobalMetric() {
    SUPPRESS_CUSTOMIZED_SCROLL = false;
    VIEWPORT_WIDTH = $('html').width();//window.innerWidth;// || document.body.clientWidth;
    VIEWPORT_HEIGHT = window.innerHeight;// || document.body.clientHeight;
    // visible content
    CONTENT_WIDTH = $('html').width(); //visible width //document.body.scrollWidth;
    CONTENT_HEIGHT = document.body.scrollHeight; // whole height // $('html').height();
    SNAPSHOT_WIDTH = THUMBNAIL_WIDTH = 100;
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

    $('#'+PREFIX+'viewport').width(SNAPSHOT_WIDTH);
    $('#'+PREFIX+'snapshot').height(SNAPSHOT_HEIGHT);
    $('#'+PREFIX+'thumbnail').height(THUMBNAIL_HEIGHT);
}
// http://stackoverflow.com/questions/1076231/how-to-get-height-of-the-highest-children-element-in-javascript-jquery
// http://ryanve.com/lab/dimensions/

function bindScrollEvent() {
    $(window).scroll(function(){
        trackLastScrollPosition();
        scrollByWindow($(this).scrollTop());
    });
}
function trackLastScrollPosition() {
    if (window.SCROLL_TIMEPOUT) {
      clearTimeout(window.SCROLL_TIMEPOUT);
    }
    window.SCROLL_TIMEPOUT = setTimeout(function () {
        LAST_SCROLL_POSITION = $(window).scrollTop();
    }, 250, self);
}

var SCHEDULE_OF_POST_HOOK_RESIZING = -1;
function bindResizeEvent() {
    $(window).resize(function () {
        clearTimeout(SCHEDULE_OF_POST_HOOK_RESIZING);
        SCHEDULE_OF_POST_HOOK_RESIZING = setTimeout(postHookResizing, 500);
    });
}
function postHookResizing() {
    $('#'+PREFIX+'viewport').hide();
    refreshGlobalMetric();
    setupSnapshot();
}

function bindDragEvent() {
    var monocleTempMousemove;
    var $thumbnail = $('#'+PREFIX+'thumbnail');
    $thumbnail.mousedown(function(initEvt) {
        var start = getMouseYOnVisibleWindow(initEvt);
        var originTop = parseInt($thumbnail.css('top'), 10);
        if (DEBUG) {drawLineAtTop(originTop);}
        originTop = isNaN(originTop) ? 0 : originTop;

        monocleTempMousemove = function (movingEvt) {
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
        };

        $(window).mousemove(monocleTempMousemove);
        $(document).mousedown(monocleTempMousedown);
    });
    $(window).mouseup(function() {
        $(window).unbind("mousemove", monocleTempMousemove);
        $(document).unbind("mousedown", monocleTempMousedown);
    });
}
function monocleTempMousedown(e){
    // disable text selection
    e.preventDefault();
}

function bindJumpEvent() {
    $('#'+PREFIX+'snapshot').click(function (evt) {
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
    $('#'+PREFIX+'snapshot').css('top', 0 - (SNAPSHOT_PLAYGROUND * scrollRatio));
    $('#'+PREFIX+'thumbnail').css('top', (THUMBNAIL_PLAYGROUND * scrollRatio));
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
    bindScrollEvent();
    bindResizeEvent();
    bindDragEvent();
    bindJumpEvent();
}

window.PREVIOUS_METHOD = window.SELECTED_SNAPSHOT_METHOD = null;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.msg) {
        case "basic":
            window.SELECTED_SNAPSHOT_METHOD = jsSnapshot;
            break;
        case "refined":
            window.SELECTED_SNAPSHOT_METHOD = nativeSnapshot;
            break;
    }
    var isChangingMethod = (window.SELECTED_SNAPSHOT_METHOD != window.PREVIOUS_METHOD);
    window.PREVIOUS_METHOD = window.SELECTED_SNAPSHOT_METHOD;
    var $viewport = $('#'+PREFIX+'viewport');

    if (isChangingMethod) {
        $viewport.remove();
        $viewport = [];
    }

    if ($viewport.length === 0) {
        initialize();
    } else if ($viewport.is(":visible")) {
        $viewport.hide();
    } else {
        $viewport.show();
    }
});