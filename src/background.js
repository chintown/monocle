// chrome.tabs.onUpdated.addListener(function(id, info, tab){
//     chrome.pageAction.show(tab.id);
// });

// ---------------------------------------------------------------------
// options in local storage
loadSettingsFromStorage(function () {
    updateAutoMark();
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
                updateAutoMark();
            });
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

    if (window.USER_SETTINGS['button_functionality'] === 'advanced') {
        var isOn = toggleAutoSetting();
        if (isOn) {
            chrome.tabs.sendMessage(tab.id, {msg: 'basic-no-toggle'});
        }
    } else {
        chrome.tabs.sendMessage(tab.id, {msg: 'basic'});
    }
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
function toggleAutoSetting() {
    log('toggleAutoSetting. from ', window.USER_SETTINGS['last_auto_status']);
    window.USER_SETTINGS['last_auto_status'] =
        !window.USER_SETTINGS['last_auto_status'];
    updateSetting('last_auto_status', window.USER_SETTINGS['last_auto_status']);
    updateAutoMark();

    var trackValue = window.USER_SETTINGS['last_auto_status'] ? 'on' : 'off';
    trackEvent({'name': 'option', 'detail': 'auto_status', 'label': trackValue});

    return window.USER_SETTINGS['last_auto_status'];
}
function updateAutoMark() {
    log('updateAutoMark', window.USER_SETTINGS['button_functionality'], window.USER_SETTINGS['last_auto_status']);
    if (window.USER_SETTINGS['button_functionality'] === 'basic') {
        turnAutoMarkHide();
    } else if (window.USER_SETTINGS['last_auto_status']) {
        turnAutoMarkOn();
    } else {
        turnAutoMarkOff();
    }
}
function turnAutoMarkOn() {
    log('turnAutoMarkOn');
    chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 0]});
    chrome.browserAction.setBadgeText({text:"on"});
}
function turnAutoMarkOff() {
    log('turnAutoMarkOff');
    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
    chrome.browserAction.setBadgeText({text:"off"});
}
function turnAutoMarkHide() {
    log('turnAutoMarkHide');
    chrome.browserAction.setBadgeText({text:""});
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