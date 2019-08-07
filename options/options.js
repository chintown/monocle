document.addEventListener("DOMContentLoaded", function () {
  init();
});

function init() {
  log('init');
  initializeTabs();
  loadSettingsFromStorage(function () {
    updateUiWithSettings();
    bindUiWithSettings();
    trackEvent({'name': 'option', 'detail': 'enter'});
  });
}

function resetTabs() {
  domAll('ul.menu a').forEach(node => {
    node.parentNode.classList.remove('tabActive');
  });
  domAll('#options > div').forEach(node => {
    node.setAttribute('hidden', 'true');
  });
}

function switchTab(hash) {
  resetTabs()
  hash = hash || '#basics';
  dom('.menu a[href="' + hash + '"').parentNode.classList.add('tabActive');
  dom(hash).removeAttribute('hidden');
}

function initializeTabs() {
  log('initializeTabs');
  var hash = window.location.hash;
  switchTab(hash);

  dom("ul.menu").addEventListener('click', function(e) {
    if (e.target === e.currentTarget) {
      return;
    }
    hash = dom('a', e.target, true).getAttribute('href');
    window.location.hash = hash;
    switchTab(hash);
  });
}

function updateUiWithSettings() {
  log('updateUiWithSettings');
  var setting = window.USER_SETTINGS;
  // document.getElementById('shortcut').value = s['keyboard_shortcut'];
  if (setting['button_functionality'] === 'conditional') {
    document.getElementById('app_conditional').checked = true;
  } else if (setting['button_functionality'] === 'advanced') {
    document.getElementById('app_advanced').checked = true;
  } else {
    document.getElementById('app_basic').checked = true;
  }
  if (setting['magnifier']) {
     document.getElementById('magnifier').checked = true;
  }
  if (setting['width_preview']) {
    document.getElementById('width_preview').value = parseFloat(setting['width_preview']);
  }
  if (typeof setting['delay_sec_auto_hide'] !== 'undefined') {
    document.getElementById('delay_sec_auto_hide').value = parseFloat(setting['delay_sec_auto_hide']);
  }
  if (setting['knob']) {
    document.getElementById('knob').checked = true;
  }
  if (typeof setting['blacklist'] !== 'undefined' && setting['blacklist'] !== '') {
    // console.log('loaded blacklist', s['blacklist'], "`" + s['blacklist'].join("\n") + "`")
    document.getElementById('blacklist').value = setting['blacklist'].join("\n");
  }
  if (typeof setting['whitelist'] !== 'undefined' && setting['whitelist'] !== '') {
    // console.log('loaded whitelist', s['whitelist'], "`" + s['whitelist'].join("\n") + "`")
    document.getElementById('whitelist').value = setting['whitelist'].join("\n");
  }
  if (window.SHOULD_SHOW_LOCAL) {
    getLocalSettings()
      .then(function(settings) {
        var domDump = document.querySelector('#local_storage');
        var strDump = JSON.stringify(settings, null, 2);
        domDump.innerHTML = strDump;
        domDump.closest('.option-section').classList.remove('hidden');
      });
  }
}
function bindUiWithSettings() {
  log('bindUiWithSettings');
  // document.getElementById('shortcut').addEventListener('blur', function (e) {
  //   updateSetting('keyboard_shortcut', e.target.value);

  //   trackEvent({'name': 'option', 'detail': 'keyboard_shortcut.'+e.target.value});
  // });
  document.getElementById('app_conditional').addEventListener('change', function (e) {
    updateSetting('button_functionality', 'conditional');
    chrome.runtime.sendMessage({msg: "reload"});

    trackEvent({'name': 'option', 'detail': 'button_functionality', 'label': 'conditional'});
  });
  document.getElementById('app_advanced').addEventListener('change', function (e) {
    updateSetting('button_functionality', 'advanced');
    chrome.runtime.sendMessage({msg: "reload"});

    trackEvent({'name': 'option', 'detail': 'button_functionality', 'label': 'advanced'});
  });
  document.getElementById('app_basic').addEventListener('change', function (e) {
    updateSetting('button_functionality', 'basic');
    chrome.runtime.sendMessage({msg: "reload"});

    trackEvent({'name': 'option', 'detail': 'button_functionality', 'label': 'basic'});
  });
  document.getElementById('magnifier').addEventListener('change', function (e) {
     updateSetting('magnifier', e.target.checked);
     chrome.runtime.sendMessage({msg: "reload"});

     trackEvent({'name': 'option', 'detail': 'magnifier', 'label': ''+e.target.checked});
  });
  var getWidthOfPreview = function (e) {
     var width = e.target.value;
     width = parseFloat(width);
     width = isNaN(width) ? 100 : width;
     width = width < 100 ? 100 : width;

     updateSetting('width_preview', width);
     chrome.runtime.sendMessage({msg: "reload"});

     trackEvent({'name': 'option', 'detail': 'width_preview', 'value': width});
  };
  document.getElementById('width_preview').addEventListener('keyup', getWidthOfPreview);
  document.getElementById('width_preview').addEventListener('blur', getWidthOfPreview);
  document.getElementById('width_preview').addEventListener('change', getWidthOfPreview);

  var getDelaySecAutoHide = function (e) {
    var sec = e.target.value;
    sec = parseFloat(sec);
    sec = isNaN(sec) ? 3 : sec;

    updateSetting('delay_sec_auto_hide', sec);
    chrome.runtime.sendMessage({ msg: "reload" });

    trackEvent({ 'name': 'option', 'detail': 'delay_sec_auto_hide', 'value': sec });
  };
  document.getElementById('delay_sec_auto_hide').addEventListener('keyup', getDelaySecAutoHide);
  document.getElementById('delay_sec_auto_hide').addEventListener('blur', getDelaySecAutoHide);
  document.getElementById('delay_sec_auto_hide').addEventListener('change', getDelaySecAutoHide);

  document.getElementById('knob').addEventListener('change', function (e) {
     updateSetting('knob', e.target.checked);
     chrome.runtime.sendMessage({msg: "reload"});

     trackEvent({'name': 'option', 'detail': 'knob', 'label': ''+e.target.checked});
  });

  var getList = function (e, identifier) {
    var listUrlPatterns = e.target.value;    
    listUrlPatterns = listUrlPatterns.trim().split("\n");
    listUrlPatterns = listUrlPatterns.filter(function (listUrlPtns) { return listUrlPtns.trim() !== '';})
    updateSetting(identifier, listUrlPatterns);
    chrome.runtime.sendMessage({ msg: "reload" });

    trackEvent({ 'name': 'option', 'detail': identifier, 'value': listUrlPatterns.length });
  };
  var getBlackList = function(e) { return getList(e, 'blacklist') }
  var getWhiteList = function(e) { return getList(e, 'whitelist') }
  document.getElementById('whitelist').addEventListener('blur', getWhiteList);
  document.getElementById('blacklist').addEventListener('blur', getBlackList);
}

function showBanner(msg) {
  document.querySelector('#banner').innerText = msg;
  document.querySelector('#banner').removeAttribute('hidden');
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
    ga('send', 'event', eventMeta.name, eventMeta.detail || 'default', eventMeta.label, eventMeta.value);
}