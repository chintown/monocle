var PREFIX = 'monocle-';

var CONF_SIZE_MAGNIFIER = 300;
var CONF_WIDTH_COLLAPSED = 0;

var BORDER_WIDTH_SNAPSHOT = 3;

    // function uploadImage(img) {
    //     var xhr = new XMLHttpRequest(), formData = new FormData();
    //     formData.append("user_uploaded", img);
    //     xhr.open("POST", "http://foo.com/", true);
    //     xhr.send(formData);
    // }
    function drawLineAtTop(top) {
        var $line = dom('#line') || createLine();
        $line.style.top = top + 'px';
    }
    function createLine() {
        var $line = domNew('<div id="line"></div>');
        dom('body').appendChild($line);
        return $line;
    }
    function exportImage(canvas) {
        var $img = domNew('<img/>');
        $img.setAttribute('src', canvas.toDataURL("image/png"));
        dom('body').appendChild($img);
    }

// --

function setupSidebar() {
    var $viewport = domNew('<div id="' + PREFIX + 'viewport"></div>');
    var $snapshot = domNew('<div id="' + PREFIX + 'snapshot"></div>');
    var $thumbnail = domNew('<div id="' + PREFIX + 'thumbnail"></div>');
    var $magnifier = domNew('<div id="' + PREFIX + 'magnifier"></div>');
    
    $magnifier.style.width = CONF_SIZE_MAGNIFIER + 'px';
    $magnifier.style.height = CONF_SIZE_MAGNIFIER + 'px';
    $magnifier.style.left = -1 * (CONF_SIZE_MAGNIFIER + 15) + 'px';
    $magnifier.style.borderRadius = CONF_SIZE_MAGNIFIER + 'px';
    
    $viewport.appendChild($snapshot);
    $viewport.appendChild($thumbnail);
    $viewport.appendChild($magnifier);
    dom('body').appendChild($viewport);
    collapseViewport();
}

function cancelCollapseViewport() {
    log('cancelCollapseViewport')
    clearTimeout(window[PREFIX + 'Timer']);
}

function collapseViewport() {
    var $viewport = dom('#' + PREFIX + 'viewport');
    if ($viewport.classList.contains(PREFIX + 'mouseover')) {
        return;
    }

    cancelCollapseViewport();

    log('collapseViewport');
    $viewport.classList.add(PREFIX + 'collapsed');
    $viewport.style.right = (-1 * (SNAPSHOT_WIDTH - CONF_WIDTH_COLLAPSED)) + 'px';
}

function delayedCollapseViewport() {
    var $viewport = dom('#' + PREFIX + 'viewport');
    if ($viewport.classList.contains(PREFIX + 'mouseover')) {
        return;
    }

    cancelCollapseViewport();

    log('delayedCollapseViewport')
    // $viewport.addClass(PREFIX + 'collapsed');
    window[PREFIX + 'Timer'] = setTimeout(function () {
        if ($viewport.classList.contains(PREFIX + 'mouseover')) {
            return;
        }
        $viewport.classList.add(PREFIX + 'collapsed');
        $viewport.style.right = (-1 * (SNAPSHOT_WIDTH - CONF_WIDTH_COLLAPSED)) + 'px';
    }, CONF_DELAY_COLLAPSED)
}

function expandViewport() {
    var $viewport = dom('#' + PREFIX + 'viewport');
    if ($viewport.classList.contains(PREFIX + 'mouseover')) {
        return;
    }

    cancelCollapseViewport();

    log('expandViewport');
    $viewport.classList.remove(PREFIX + 'collapsed');
    $viewport.style.right = 0;
}

function setupJsSnapshot() {
    LAST_SCROLL_POSITION = window.scrollY;

    jsSnapshot();
}
function setupSnapshot() {
    LAST_SCROLL_POSITION = window.scrollY;

    window.SELECTED_SNAPSHOT_METHOD();
    // jsSnapshot();
    // serverSideSnapshot();
    // nativeSnapshot();
}
function imageSmoothingEnabled(ctx, state) {
    // http://stackoverflow.com/questions/22003687/disabling-imagesmoothingenabled-by-default-on-multiple-canvases
    ctx.mozImageSmoothingEnabled = state;
    ctx.oImageSmoothingEnabled = state;
    ctx.webkitImageSmoothingEnabled = state;
    ctx.imageSmoothingEnabled = state;
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
function resampleCanvas(fromCanvas, widthOfTarget) {
    // http://stackoverflow.com/questions/19262141/resize-image-with-javascript-canvas-smoothly
    // http://stackoverflow.com/questions/17861447/html5-canvas-drawimage-how-to-apply-antialiasing
    var ratio = 0.5, ratioMin = 0.3, thresholdMax = 500, thresholdMin = 100, ratioDiff = ratio - ratioMin;
    if (widthOfTarget < thresholdMax) {
        ratio = ((thresholdMax * ratioMin - (thresholdMin * ratioDiff)) + ratioDiff * widthOfTarget) / (thresholdMax - thresholdMin);
    }
    var canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
    canvas.width = fromCanvas.width;
    canvas.height = fromCanvas.height;

    var oc = document.createElement('canvas'),
        octx = oc.getContext('2d');
    oc.width = fromCanvas.width * ratio;
    oc.height = fromCanvas.height * ratio;

    octx.drawImage(fromCanvas, 0, 0, oc.width, oc.height);
    octx.drawImage(oc, 0, 0, oc.width * ratio, oc.height * ratio);
    ctx.drawImage(oc, 0, 0, oc.width * ratio, oc.height * ratio,
                      0, 0, canvas.width, canvas.height);
    return canvas;
}
function buildByCanvas(fromCanvas) {
    if (window.USER_SETTINGS['magnifier']) {
        var magnifierCanvas = copyCanvas(fromCanvas, CONTENT_WIDTH, CONTENT_HEIGHT);
        dom('#'+PREFIX+'magnifier').innerHTML = '';
        dom('#'+PREFIX+'magnifier').appendChild(magnifierCanvas)
    }

    var snapshotCanvas = copyCanvas(resampleCanvas(fromCanvas, SNAPSHOT_WIDTH), SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
    dom('#'+PREFIX+'snapshot').innerHTML = '';
    dom('#'+PREFIX+'snapshot').appendChild(snapshotCanvas);

    expandViewport();

    delete fromCanvas;

    delayedCollapseViewport()
}
function jsSnapshot() {
    var $viewport = dom('#' + PREFIX + 'viewport');
    $viewport.style.display = 'none';
    // http://html2canvas.hertzen.com/documentation.html
    html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        letterRendering: true,
        onrendered: function(canvas) {
            $viewport.style.display = 'block';
            buildByCanvas(canvas);
            window.scrollTo(0, window.LAST_SCROLL_POSITION);
        },
        width: CONTENT_WIDTH, //SNAPSHOT_WIDTH,
        height: CONTENT_HEIGHT, //SNAPSHOT_HEIGHT,
        background: '#eeeeee',
    });
}

// function serverSideSnapshot() {
//     var url = 'http://www.chintown.org/monocle/';
//     $.get(url, {
//         'w': VIEWPORT_WIDTH,
//         'h': CONTENT_HEIGHT,
//         'u': encodeURI(window.location.href),
//         'z': window.devicePixelRatio
//     }).done(function(data) {
//         var urlParam = window.location.href.replace(/[^a-zA-Z0-9]/gi, '-').replace(/^https?-+/, '');
//         var imgSrc = url + 'result.php?u=' + encodeURI(urlParam) + '.jpg';
//         log(data);log(imgSrc);
//         var img = new Image();
//         img.width = CONTENT_WIDTH;
//         img.height = CONTENT_HEIGHT;
//         img.addEventListener('load', function(e) {
//             // http://stackoverflow.com/questions/8517879/how-to-rotate-the-existing-content-of-html5-canvas
//             var thumbCanvas = document.createElement("canvas"),
//                 thumbCtx = thumbCanvas.getContext("2d");
//             thumbCanvas.width = SNAPSHOT_WIDTH;
//             thumbCanvas.height = SNAPSHOT_HEIGHT;
//             thumbCtx.drawImage(img, 0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
//             dom('#'+PREFIX+'snapshot').innerHTML = '';
//             dom('#'+PREFIX+'snapshot').appendChild(thumbCanvas);
//             expandViewport();

//             window.scrollTo(0, window.LAST_SCROLL_POSITION);
//         });
//         img.src = imgSrc;
//     });
// }

function nativeSnapshot() {
    beforeNativeSnapshoted();
    onNativePartialSnapshoted(); // trick to trigger the first time
}
function beforeNativeSnapshoted() {
    resetCanvas();

    window.SNAPSHOT_POSITIONS = getPartialSnapshotPositions();

    // keep status
    window.LAST_SCROLL_POSITION_FOR_NATIVE_SNAPSHOT = window.scrollY;
    window.RECOVERED_LIST = domAll('*').filter(function(node){
       return window.getComputedStyle(node).position === 'fixed';
    });
    window.RECOVERED_LIST.forEach(function(node) {
        node.classList.add('monocle-hidden');
    });
    window.BODY_OVERFLOW_STYLE = document.body.style.overflow;
    dom('#' + PREFIX + 'viewport').style.display = 'none';
    document.body.style.overflow = "hidden";
}
function afterNativeSnapshoted() {
    buildByCanvas(TEMP_CANVAS);
    // $('img').show(); // DEV

    // reset status
    window.scrollTo(0, window.LAST_SCROLL_POSITION_FOR_NATIVE_SNAPSHOT);
    window.RECOVERED_LIST.forEach(function (node) {
        node.classList.remove('monocle-hidden');
    });
    dom('#' + PREFIX + 'viewport').style.display = 'block';
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
    window.scrollTo(0, offsetY);

    // wait until scroll finished
    var handle = window.setInterval(function() {
        if (Math.abs(window.scrollY - offsetY) <= 2) {
            clearInterval(handle);
            nativePartialSnapshot(offsetY, onNativePartialSnapshoted);
        }
    }, 10); // delay helps broken snapshot
}
function resetCanvas() {
    dom('#'+PREFIX+'snapshot').innerHTML = '';
    dom('#'+PREFIX+'magnifier').innerHTML = '';

    TEMP_CANVAS = document.createElement("canvas"),
    TEMP_CTX = TEMP_CANVAS.getContext("2d");
    TEMP_CANVAS.width = CONTENT_WIDTH;
    TEMP_CANVAS.height = CONTENT_HEIGHT;

    PREV_DATAURL = '';
}
function nativePartialSnapshot(screenOffsetY, callback) {
    var img = new Image();
    img.width = VIEWPORT_WIDTH;
    img.height = VIEWPORT_HEIGHT;
    img.onload = function () {
        // img.style.border = "1px solid red";img.style.display = "none";$('body').prepend(img); // DEV
        TEMP_CTX.drawImage(img, 0, screenOffsetY, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        delete img;

        callback(); // delay helps broken snapshot
    }

    var trySnapshot = function snapshot() {
        chrome.runtime.sendMessage({msg: "snapshot"}, function(dataUrl) {
            console.assert(dataUrl !== null, 'empty snapshot');

            var isSucceeded = PREV_DATAURL !== dataUrl;
            log(screenOffsetY, 'isSucceeded', isSucceeded);
            PREV_DATAURL = dataUrl;
            if (isSucceeded) {
                img.src = dataUrl;
                delete dataUrl;
            } else {
                snapshot(); // duplication happened. try again
            }
        });
    }
    trySnapshot();
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

function loadGlobalMetric() {
    SNAPSHOT_WIDTH = THUMBNAIL_WIDTH = parseFloat(window.USER_SETTINGS['width_preview']);
    CONF_DELAY_COLLAPSED = parseFloat(window.USER_SETTINGS['delay_sec_auto_hide']) * 1000;
}

function refreshGlobalMetric() {
    SUPPRESS_CUSTOMIZED_SCROLL = false;
    VIEWPORT_WIDTH = window.innerWidth; //$('html').width();//window.innerWidth;// || document.body.clientWidth;
    VIEWPORT_HEIGHT = window.innerHeight;// || document.body.clientHeight;
    // visible content
    CONTENT_WIDTH = window.innerWidth; //$('html').width(); //visible width //document.body.scrollWidth;
    // if (window.innerWidth !== $('html').width()) {
    //     console.error(window.innerWidth, '!==', $('html').width());
    // }
    CONTENT_HEIGHT = document.body.scrollHeight; // whole height // $('html').height();
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

    // $('html').css({marginRight: SNAPSHOT_WIDTH});
    dom('#'+PREFIX+'viewport').style.width = (SNAPSHOT_WIDTH + BORDER_WIDTH_SNAPSHOT) + 'px';
    dom('#'+PREFIX+'snapshot').style.height = (SNAPSHOT_HEIGHT) + 'px';
    dom('#'+PREFIX+'thumbnail').style.height = (THUMBNAIL_HEIGHT) + 'px';
}
// http://stackoverflow.com/questions/1076231/how-to-get-height-of-the-highest-children-element-in-javascript-jquery
// http://ryanve.com/lab/dimensions/

function bindScrollEvent() {
    window.addEventListener('scroll', function(){
        dom('#' + PREFIX + 'magnifier').style.display = 'none';
        
        expandViewport();
        delayedCollapseViewport();

        trackLastScrollPosition();
        scrollByWindow(window.scrollY);
    });
}
function trackLastScrollPosition() {
    if (window.SCROLL_TIMEPOUT) {
      clearTimeout(window.SCROLL_TIMEPOUT);
    }
    window.SCROLL_TIMEPOUT = setTimeout(function () {
        LAST_SCROLL_POSITION = window.scrollY;
    }, 250, self);
}

var SCHEDULE_OF_POST_HOOK_RESIZING = -1;
function bindResizeEvent() {
    window.addEventListener('resize', function () {
        clearTimeout(SCHEDULE_OF_POST_HOOK_RESIZING);
        SCHEDULE_OF_POST_HOOK_RESIZING = setTimeout(postHookResizing, 500);
    });
}
function postHookResizing() {
    // collapseViewport();
    refreshGlobalMetric();
    setupJsSnapshot();
    window.PREVIOUS_METHOD = jsSnapshot;
}

function bindDragEvent() {
    var monocleTempMousemove;
    var $thumbnail = dom('#'+PREFIX+'thumbnail');
    $thumbnail.addEventListener('mousedown', function(initEvt) {
        var start = getMouseYOnVisibleWindow(initEvt);
        // var originTop = parseInt($thumbnail.css('top'), 10);
        var originTop = parseInt($thumbnail.style.transform.replace(/[^0-9\-.,]/g, '').split(',').pop(), 10);
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

        window.addEventListener('mousemove', monocleTempMousemove);
        document.addEventListener('mousedown', monocleTempMousedown);
    });
    window.addEventListener('mouseup', function() {
        window.removeEventListener('mousemove', monocleTempMousemove);
        document.removeEventListener('mousedown', monocleTempMousedown);
    });
}
function monocleTempMousedown(e){
    // disable text selection
    e.preventDefault();
}

function getProjectedOffset(fromOffset, fromRange, toRange, viewportRatio) {
    var ratio = 1.0 * fromOffset / fromRange;
    ratio -= 0.5 * viewportRatio; // center magnifier
    ratio = fixBound(ratio, 0, 1 - viewportRatio);
    var toOffset = ratio * toRange;
    return toOffset;
}

function bindJumpEvent() {
    dom('#'+PREFIX+'snapshot').addEventListener('click', function (evt) {
        var offsetY = getProjectedOffset(evt.offsetY, SNAPSHOT_HEIGHT, CONTENT_HEIGHT, 1.0 * THUMBNAIL_HEIGHT / SNAPSHOT_HEIGHT);
        window.scrollTo(0, offsetY);
    });
}

function bindHoverEvent() {
    var $viewport = dom('#' + PREFIX + 'viewport');

    domAll('#' + PREFIX + 'snapshot, ' + '#' + PREFIX + 'thumbnail').forEach(function(domEl) {
        domEl.addEventListener('mousemove', function (evt) {
            if (window.USER_SETTINGS['magnifier']) {
                var xToSnapshot = evt.pageX - offset(dom('#' + PREFIX + 'snapshot')).left;
                var yToSnapshot = evt.pageY - offset(dom('#' + PREFIX + 'snapshot')).top;
                // console.group(xToSnapshot,yToSnapshot)
                var offsetY = getProjectedOffset(yToSnapshot, SNAPSHOT_HEIGHT, CONTENT_HEIGHT, 1.0 * CONF_SIZE_MAGNIFIER / CONTENT_HEIGHT);
                var offsetX = getProjectedOffset(xToSnapshot, SNAPSHOT_WIDTH, CONTENT_WIDTH, 1.0 * CONF_SIZE_MAGNIFIER / CONTENT_WIDTH);
                // console.groupEnd(xToSnapshot, yToSnapshot)
                // $('#'+PREFIX+'magnifier canvas').css({
                //     'top': -1 * offsetY,
                //     'left': -1 * offsetX,
                //     'position': 'absolute'
                // });
                dom('#' + PREFIX + 'magnifier canvas').style.transform =
                    'translate(' + (-1 * offsetX) + 'px, ' + -1 * offsetY + 'px)';
            }
        });
    });
    domAll('#' + PREFIX + 'snapshot, ' + '#' + PREFIX + 'thumbnail').forEach(function(domEl) {
        domEl.addEventListener('mouseover', function (evt) {
            if ($viewport.classList.contains(PREFIX + 'collapsed')) {
                expandViewport();
            }
            $viewport.classList.add(PREFIX + 'mouseover');

            if (window.USER_SETTINGS['magnifier']) {
                dom('#' + PREFIX + 'magnifier').style.display = 'block';
            }
        });
    });
    domAll('#' + PREFIX + 'snapshot, ' + '#' + PREFIX + 'thumbnail').forEach(function(domEl) {
        domEl.addEventListener('mouseout', function (evt) {
            $viewport.classList.remove(PREFIX + 'mouseover')
            if (!$viewport.classList.contains(PREFIX + 'collapsed')) {
                delayedCollapseViewport();
            }

            if (window.USER_SETTINGS['magnifier']) {
                dom('#' + PREFIX + 'magnifier').style.display = 'none';
            }
        });
    });
}

function fixBound(input, min, max) {
    input = input < min ? min : input;
    input = input > max ? max : input;
    return input;

}

function getMouseYOnVisibleWindow(evt) {
    return evt.clientY; // evt.pageY - window.scrollY
}

function scrollByWindow(windowTop) {
    var scrollRatio = 1.0 * windowTop / (CONTENT_HEIGHT - VIEWPORT_HEIGHT);
    scrollRatio = fixBound(scrollRatio, 0, 1);
    // $('#'+PREFIX+'snapshot').css('top', 0 - (SNAPSHOT_PLAYGROUND * scrollRatio));
    // $('#'+PREFIX+'thumbnail').css('top', (THUMBNAIL_PLAYGROUND * scrollRatio));
    dom('#' + PREFIX + 'snapshot').style.transform = 'translateY(' + (0 - (SNAPSHOT_PLAYGROUND * scrollRatio)) + 'px)';
    dom('#' + PREFIX + 'thumbnail').style.transform = 'translateY(' + (THUMBNAIL_PLAYGROUND * scrollRatio) + 'px)';
}

function scrollByThumbnail(newTop) {
    var scrollRatio = 1.0 * newTop / THUMBNAIL_PLAYGROUND;
    window.scrollTo(0, (CONTENT_HEIGHT - VIEWPORT_HEIGHT) * scrollRatio);
}

function isArticle() {
    return domAll('article').length ||
        domAll('meta[property="og:type"][content="article"]').length ||
        domAll('meta[property^="article"]').length;
}

document.addEventListener('readystatechange', event => {
    if (event.target.readyState === 'complete') {
        chrome.runtime.sendMessage({
            msg: "land",
            url: window.location.href,
            isArticle: isArticle(),
        }, function (shouldAutoLoad) {
            if (shouldAutoLoad) {
                eventDispatcher('basic');
            }
        });
    }
});

function initialize() {
    loadGlobalMetric();
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

// function shiftViewport() {
//     var $html = dom('html')
//         ,clazz = PREFIX+'enabled';
//     if (!$html.classList.contains(clazz)) {
//         $html.classList.add(clazz);
//     }
// }

function eventDispatcher(action) {
    chrome.runtime.sendMessage({msg: "config"}, function(userSettings) {
        window.USER_SETTINGS = userSettings;

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
        var $viewport = dom('#'+PREFIX+'viewport');

        if (isChangingMethod || isNoToggle) {
            $viewport && $viewport.remove();
            $viewport = null;
        }

        if (!$viewport) {
            initialize();
            chrome.runtime.sendMessage({msg: "track", name: "functionality", detail: action}, function() {});
        } else if (!$viewport.classList.contains(PREFIX + 'collapsed')) {
            collapseViewport();
            // $('html').css({ marginRight: 0 });
            chrome.runtime.sendMessage({msg: "track", name: "functionality", detail: "hide"}, function() {});
        } else {
            expandViewport()
            // $('html').css({ marginRight: SNAPSHOT_WIDTH });
            chrome.runtime.sendMessage({msg: "track", name: "functionality", detail: "show"}, function() {});
        }
    });
}
