// chrome.tabs.onUpdated.addListener(function(id, info, tab){
//     chrome.pageAction.show(tab.id);
// });

// ---------------------------------------------------------------------
// options in local storage
loadSettingsFromStorage(function () {
    updateMark();
    chrome.storage.onChanged.addListener(updateSettingsLocally);
});

// ---------------------------------------------------------------------
// dispatching auto on
function isInList(identifier, url) {
    var result = {};
    log('check whether', url, 'is in', identifier)
    window.USER_SETTINGS[identifier].map(function (rawPtn) {
        log('[coded pattern]', rawPtn)
        var ptn = rawPtn.replace(/([.+?{}\/])/g, '\\$1').replace(/\*+/g, '.*');
        log('[regex pattern]', ptn)
        ptn = new RegExp(ptn, 'g')
        var isMatched = !!url.match(ptn)
        result[isMatched] = result[isMatched] ? result[isMatched].concat(rawPtn) : [rawPtn];
    })
    var isInList = result.true && result.true.length
    log(result, isInList ? 'In ' + identifier : 'not in ' + identifier + ' ....');
    return isInList;
}

// ---------------------------------------------------------------------

// interface for content page
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    log('chrome.runtime.onMessage. msg, sender. ', request.msg, sender);
    switch(request.msg) {
        case "snapshot":
            cbSnapshot(callback);
            break;
        case "track":
            trackEvent(request);
            break;
        case "land":
            // var autoEnabledAndOn = window.USER_SETTINGS['last_auto_status']
            //     && window.USER_SETTINGS['button_functionality'] === 'advanced';
            // callback(autoEnabledAndOn);
            var shouldAutoLoad = 
                (window.USER_SETTINGS['button_functionality'] === 'basic' && isInList('whitelist', request.url))
                || (window.USER_SETTINGS['button_functionality'] === 'advanced' && !isInList('blacklist', request.url))
                || (window.USER_SETTINGS['button_functionality'] === 'conditional' && (isInList('whitelist', request.url) || request.isArticle && !isInList('blacklist', request.url)))
            callback(shouldAutoLoad);
            break;
        case "reload":
            loadSettingsFromStorage(function () {
                updateMark();
            });
            break;
        case "mark":
            updateMark(request.isActivated);
            break;
        case "config":
            callback(window.USER_SETTINGS);
            break;
        default:
            break;
    }
    return true;
});

// app button
chrome.browserAction.onClicked.addListener(function(tab) {
    log('chrome.browserAction.onClicked. button_functionality. ', window.USER_SETTINGS['button_functionality']);

    trackEvent({'name': 'input', 'detail': 'mouse'});

    chrome.tabs.sendMessage(tab.id, {msg: 'basic'});
});

// keyboard shortcut
chrome.commands.onCommand.addListener(function(command) {
    log('chrome.browserAction.onClicked. command. ', command);
    switch(command) {
        case "basic-snapshot":
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {msg: 'basic'});
            });
            break;
        case "refined-snapshot":
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {msg: 'refined'});
            });
            break;
        default:
            break;
    }
    trackEvent({'name': 'input', 'detail': 'keyboard'});
});

// ---------------------------------------------------------------------
// change status of app button
function updateMark(state) {
    log('updateMark', window.USER_SETTINGS['button_functionality'], window.USER_SETTINGS['last_auto_status']);
    switch (window.USER_SETTINGS['button_functionality']) {
        case 'basic':
            setMarkLabel('M');
            break;
        case 'advanced':
            setMarkLabel('A');
            break;
        case 'conditional':
            setMarkLabel('C');
            break;
        default:
            setMarkLabel('');
            break
    }
    setMarkState(state);
}
function setMarkLabel(label) {
    chrome.browserAction.setBadgeText({text:label});
}
function setMarkState(state) {
    chrome.browserAction.setBadgeBackgroundColor({
        color: (!!state ? [255, 0, 0, 0] : [190, 190, 190, 230])
    });
}

// ---------------------------------------------------------------------
// native snapshot
function cbSnapshot(callback) {
    chrome.tabs.captureVisibleTab(null, function(dataUrl) {
        callback(dataUrl);
    });
}

// ---------------------------------------------------------------------
// google analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga'); // analytics_debug.js
ga('create', 'UA-1108382-9', 'auto');

// https://www.shanebart.com/chrome-ext-analytics/
// https://stackoverflow.com/questions/16135000/how-do-you-integrate-universal-analytics-in-to-chrome-extensions/22152353#22152353
// https://developers.google.com/analytics/devguides/collection/analyticsjs/tasks#disabling
ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200

/**
 * Track a click on a button using the asynchronous tracking API.
 *
 * See http://code.google.com/apis/analytics/docs/tracking/asyncTracking.html
 * for information on how to use the asynchronous tracking API.
 */
function trackEvent(eventMeta) {
    log('trackEvent', eventMeta.name, eventMeta.detail);
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
    // name - > Event Category | detail - > Event Action
    ga('send', 'event', eventMeta.name, eventMeta.detail || 'default');
}

ga('send', 'pageview');