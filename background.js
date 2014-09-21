// chrome.tabs.onUpdated.addListener(function(id, info, tab){
//     chrome.pageAction.show(tab.id);
// });

// ---------------------------------------------------------------------
// options in local storage
function loadScript(script, callback) {
    var el = document.createElement('script');
    el.src = chrome.extension.getURL(script);
    el.addEventListener('load', callback, false);
    document.head.appendChild(el);
}
loadScript('common/dev.js', function () {
    loadScript('common/user_settings.js', function () {
        loadSettings(function () {
            updateAuto();
        });
    });
});
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
            var autoEnabledAndOn = window.USER_SETTINGS['last_auto_status']
                && window.USER_SETTINGS['button_functionality'] === 'advanced';
            callback(autoEnabledAndOn);
            break;
        default:
            break;
    }
    return true;
});

// app button
chrome.browserAction.onClicked.addListener(function(tab) {
    log('chrome.browserAction.onClicked. button_functionality. ', window.USER_SETTINGS['button_functionality']);
    if (window.USER_SETTINGS['button_functionality'] === 'advanced') {
        toggleAutoSetting();
    } else {
        turnAutoDisabled();
        chrome.tabs.sendMessage(tab.id, {msg: 'basic'});
    }
    trackEvent({'name': 'input', 'detail': 'mouse'});

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
    log('toggleAutoSetting');
    window.USER_SETTINGS['last_auto_status'] =
        window.USER_SETTINGS['last_auto_status']
        ? false : true;
    updateAuto();
}
function updateAuto() {
    log('updateAuto', window.USER_SETTINGS['last_auto_status']);
    if (window.USER_SETTINGS['last_auto_status']) {
        turnAutoOn();
        trackEvent({'name': 'option', 'detail': 'auto_status.on'});
    } else {
        turnAutoOff();
        trackEvent({'name': 'option', 'detail': 'auto_status.off'});
    }
}
function turnAutoOn() {
    log('turnAutoOn');
    chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 0]});
    chrome.browserAction.setBadgeText({text:"on"});
    updateSetting('last_auto_status', true);
}
function turnAutoOff() {
    log('turnAutoOff');
    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
    chrome.browserAction.setBadgeText({text:"off"});
    updateSetting('last_auto_status', false);
}
function turnAutoDisabled() {
    log('turnAutoDisabled');
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
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-1108382-9']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();

/**
 * Track a click on a button using the asynchronous tracking API.
 *
 * See http://code.google.com/apis/analytics/docs/tracking/asyncTracking.html
 * for information on how to use the asynchronous tracking API.
 */
function trackEvent(eventMeta) {
    log('trackEvent', eventMeta.name, eventMeta.detail);
    if (eventMeta.detail) {
        _gaq.push(['_trackEvent', eventMeta.name, eventMeta.detail, '']);
    } else {
        _gaq.push(['_trackEvent', eventMeta.name, '', '']);
    }
}
