var DEBUG = false;
var PREFIX = 'monocle-';

var CONF_SIZE_SNAPSHOT = 100;
var CONF_SIZE_MAGNIFIER = 300;

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
    var $magnifier = $('<div></div>').attr('id', PREFIX+'magnifier');
    $magnifier.css({
        position: 'absolute',
        width: CONF_SIZE_MAGNIFIER,
        height: CONF_SIZE_MAGNIFIER,
        top: 10,
        left: -1 * (CONF_SIZE_MAGNIFIER + 10),
        overflow: 'hidden',

        zIndex: 9999999999,
        border: '3px solid darkgrey',
        borderRadius: CONF_SIZE_MAGNIFIER,

        display: 'none'
    });

    $viewport.append($snapshot);
    $viewport.append($thumbnail);
    $viewport.append($magnifier);
    $viewport.hide();
    $('body').append($viewport);
}

function setupJsSnapshot() {
    LAST_SCROLL_POSITION = $(window).scrollTop();

    jsSnapshot();
}
function setupSnapshot() {
    LAST_SCROLL_POSITION = $(window).scrollTop();

    window.SELECTED_SNAPSHOT_METHOD();
    // jsSnapshot();
    // serverSideSnapshot();
    // nativeSnapshot();
}
function copyCanvas(fromCanvas, toWidth, toHeight) {
    // http://stackoverflow.com/questions/8517879/how-to-rotate-the-existing-content-of-html5-canvas
    var newCanvas = document.createElement("canvas"),
        newbCtx = newCanvas.getContext("2d");
    // newbCtx.scale(SCALE_RATIO, SCALE_RATIO);
    newCanvas.width = toWidth;
    newCanvas.height = toHeight;
    newbCtx.drawImage(fromCanvas, 0, 0, toWidth, toHeight);
    //exportImage(fromCanvas);
    return newCanvas;
}
function buildByCanvas(fromCanvas) {
    // _MAGNIFIER_
    var magnifierCanvas = copyCanvas(fromCanvas, CONTENT_WIDTH, CONTENT_HEIGHT);
    $('#'+PREFIX+'magnifier').empty().append(magnifierCanvas);

    var snapshotCanvas = copyCanvas(fromCanvas, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
    $('#'+PREFIX+'snapshot').empty().append(snapshotCanvas);

    $('#'+PREFIX+'viewport').show();

    delete fromCanvas;
}
function jsSnapshot() {
    // http://html2canvas.hertzen.com/documentation.html
    html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        letterRendering: true,
        onrendered: function(canvas) {
            buildByCanvas(canvas);
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

    window.SNAPSHOT_POSITIONS = getPartialSnapshotPositions();

    // keep status
    window.LAST_SCROLL_POSITION_FOR_NATIVE_SNAPSHOT = $(window).scrollTop();
    window.RECOVERED_LIST = $('*').filter(function(){
       return $(this).css('position') === 'fixed';
    });
    window.RECOVERED_LIST.addClass('monocle-hidden');
    window.BODY_OVERFLOW_STYLE = document.body.style.overflow;
    document.body.style.overflow = "hidden";
}
function afterNativeSnapshoted() {
    buildByCanvas(TEMP_CANVAS);
    // $('img').show(); // DEV

    // reset status
    $(window).scrollTop(window.LAST_SCROLL_POSITION_FOR_NATIVE_SNAPSHOT);
    window.RECOVERED_LIST.removeClass('monocle-hidden');
    document.body.style.overflow = window.BODY_OVERFLOW_STYLE;
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

    // wait until scroll finished
    var handle = window.setInterval(function() {
        if ($(window).scrollTop() === offsetY) {
            clearInterval(handle);
            nativePartialSnapshot(offsetY, onNativePartialSnapshoted);
        }
    }, 10);
}
function resetCanvas() {
    var thumbCanvas = document.createElement("canvas");
    thumbCanvas.setAttribute("id", "canvas-native");
    thumbCanvas.width = SNAPSHOT_WIDTH;
    thumbCanvas.height = SNAPSHOT_HEIGHT;
    $('#'+PREFIX+'snapshot').empty().append(thumbCanvas);

    // _MAGNIFIER_
    var magnifierCanvas = document.createElement("canvas");
    magnifierCanvas.setAttribute("id", "canvas-magnifier");
    magnifierCanvas.width = MAGNIFIER_WIDTH;
    magnifierCanvas.height = MAGNIFIER_HEIGHT;
    $('#'+PREFIX+'magnifier').empty().append(magnifierCanvas);
}
function nativePartialSnapshot(screenOffsetY, callback) {
    var snapshotOffsetY = SNAPSHOT_HEIGHT * screenOffsetY / CONTENT_HEIGHT;
    var magnifierOffsetY = MAGNIFIER_HEIGHT * screenOffsetY / CONTENT_HEIGHT; // _MAGNIFIER_
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

        // _MAGNIFIER_
        var ctx2 = $('#canvas-magnifier').get(0).getContext("2d");
        ctx2.drawImage(img, 0, magnifierOffsetY, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

        callback();
    });
}

function getPartialSnapshotPositions() {
    var arrangements = [],
        // pad the vertical scrolling to try to deal with
        // sticky headers, 250 is an arbitrary size
        scrollPad = 0, // no need
        yDelta = VIEWPORT_HEIGHT - (VIEWPORT_HEIGHT > scrollPad ? scrollPad : 0),
        yPos = CONTENT_HEIGHT - VIEWPORT_HEIGHT
        ;

    while (yPos > -yDelta) {
        arrangements.push([0, yPos < 0 ? 0 : yPos]); // x, y
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
    SNAPSHOT_WIDTH = THUMBNAIL_WIDTH = CONF_SIZE_SNAPSHOT;
    SNAPSHOT_HEIGHT = SNAPSHOT_WIDTH * CONTENT_HEIGHT / CONTENT_WIDTH;
    SNAPSHOT_PLAYGROUND = (SNAPSHOT_HEIGHT > VIEWPORT_HEIGHT)
                            ? SNAPSHOT_HEIGHT - VIEWPORT_HEIGHT
                            : 0;
    THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * VIEWPORT_HEIGHT / VIEWPORT_WIDTH;
    THUMBNAIL_PLAYGROUND = (SNAPSHOT_HEIGHT > VIEWPORT_HEIGHT)
                            ? VIEWPORT_HEIGHT - THUMBNAIL_HEIGHT
                            : SNAPSHOT_HEIGHT - THUMBNAIL_HEIGHT;
    SCALE_RATIO = 1.0 * THUMBNAIL_WIDTH / VIEWPORT_WIDTH;

    // _MAGNIFIER_
    MAGNIFIER_WIDTH = CONTENT_HEIGHT;
    MAGNIFIER_HEIGHT = CONTENT_HEIGHT;

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
    setupJsSnapshot();
    window.PREVIOUS_METHOD = jsSnapshot;
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

function getProjectedOffset(fromOffset, fromRange, toRange, viewportRatio) {
    var ratio = 1.0 * fromOffset / fromRange;
    ratio -= 0.5 * viewportRatio;
    ratio = fixBound(ratio, 0, 1 - viewportRatio);
    var toOffset = ratio * toRange;
    return toOffset;
}

function bindJumpEvent() {
    $('#'+PREFIX+'snapshot').click(function (evt) {
        var offsetY = getProjectedOffset(evt.offsetY, SNAPSHOT_HEIGHT, CONTENT_HEIGHT, 1.0 * THUMBNAIL_HEIGHT / SNAPSHOT_HEIGHT);
        $(window).scrollTop(offsetY);
    });
}

function bindHoverEvent() {
    $('#'+PREFIX+'snapshot').mousemove(function (evt) {
        var offsetY = getProjectedOffset(evt.offsetY, SNAPSHOT_HEIGHT, CONTENT_HEIGHT, 1.0 * CONF_SIZE_MAGNIFIER / CONTENT_HEIGHT);
        var offsetX = getProjectedOffset(evt.offsetX, SNAPSHOT_WIDTH, CONTENT_WIDTH, 1.0 * CONF_SIZE_MAGNIFIER / CONTENT_WIDTH);
        $('#'+PREFIX+'magnifier canvas').css({
            'top': -1 * offsetY,
            'left': -1 * offsetX,
            'position': 'absolute'
        });
    });
    $('#'+PREFIX+'snapshot').mouseover(function (evt) {
        $('#'+PREFIX+'magnifier').show();
    });
    $('#'+PREFIX+'snapshot').mouseout(function (evt) {
        $('#'+PREFIX+'magnifier').hide();
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
    chrome.runtime.sendMessage({msg: "land"}, function(isAutoEnabledAndOn) {
        if (isAutoEnabledAndOn) {
            eventDispatcher('basic');
        }
    });
});

function initialize() {
    setupSidebar();
    refreshGlobalMetric();
    setupSnapshot();
    bindScrollEvent();
    bindResizeEvent();
    bindDragEvent();
    bindJumpEvent();
    bindHoverEvent(); // _MAGNIFIER_
}

window.PREVIOUS_METHOD = window.SELECTED_SNAPSHOT_METHOD = null;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    eventDispatcher(request.msg);
});

function eventDispatcher(action) {
    switch(action) {
        case "basic":
        case "basic-no-toggle":
            window.SELECTED_SNAPSHOT_METHOD = jsSnapshot;
            break;
        case "refined":
            window.SELECTED_SNAPSHOT_METHOD = nativeSnapshot;
            break;
        default:
            break;
    }
    var isNoToggle  = action === 'basic-no-toggle';
    var isChangingMethod = (window.SELECTED_SNAPSHOT_METHOD != window.PREVIOUS_METHOD);
    window.PREVIOUS_METHOD = window.SELECTED_SNAPSHOT_METHOD;
    var $viewport = $('#'+PREFIX+'viewport');

    if (isChangingMethod || isNoToggle) {
        $viewport.remove();
        $viewport = [];
    }

    if ($viewport.length === 0) {
        initialize();
        chrome.runtime.sendMessage({msg: "track", name: "functionality", detail: action}, function() {});
    } else if ($viewport.is(":visible")) {
        $viewport.hide();
        chrome.runtime.sendMessage({msg: "track", name: "functionality", detail: "hide"}, function() {});
    } else {
        $viewport.show();
        chrome.runtime.sendMessage({msg: "track", name: "functionality", detail: "show"}, function() {});
    }
}