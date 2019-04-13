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
  var s = window.USER_SETTINGS;
  // document.getElementById('shortcut').value = s['keyboard_shortcut'];
  if (s['button_functionality'] === 'advanced') {

    document.getElementById('app_advanced').checked = true;
  } else {
    document.getElementById('app_basic').checked = true;
  }
  if (s['magnifier']) {
     document.getElementById('magnifier').checked = true;
  }
  if (s['width_preview']) {
    document.getElementById('width_preview').value = parseFloat(s['width_preview']);
  }
  if (typeof s['delay_sec_auto_hide'] !== 'undefined') {
    document.getElementById('delay_sec_auto_hide').value = parseFloat(s['delay_sec_auto_hide']);
  }
  if (typeof s['blacklist'] !== 'undefined' && s['blacklist'] !== '') {
    // console.log('loaded blacklist', s['blacklist'], "`" + s['blacklist'].join("\n") + "`")
    document.getElementById('blacklist').value = s['blacklist'].join("\n");
  }
  if (typeof s['whitelist'] !== 'undefined' && s['whitelist'] !== '') {
    // console.log('loaded whitelist', s['whitelist'], "`" + s['whitelist'].join("\n") + "`")
    document.getElementById('whitelist').value = s['whitelist'].join("\n");
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
  document.getElementById('app_advanced').addEventListener('change', function (e) {
    updateSetting('button_functionality', 'advanced');
    chrome.runtime.sendMessage({msg: "reload"});

    trackEvent({'name': 'option', 'detail': 'button_functionality.advanced'});
  });
  document.getElementById('app_basic').addEventListener('change', function (e) {
    updateSetting('button_functionality', 'basic');
    chrome.runtime.sendMessage({msg: "reload"});

    trackEvent({'name': 'option', 'detail': 'button_functionality.basic'});
  });
  document.getElementById('magnifier').addEventListener('change', function (e) {
     updateSetting('magnifier', e.target.checked);
     chrome.runtime.sendMessage({msg: "reload"});

     trackEvent({'name': 'option', 'detail': 'magnifier.'+e.target.checked});
  });
  var getWidthOfPreview = function (e) {
     var width = e.target.value;
     width = parseFloat(width);
     width = isNaN(width) ? 100 : width;
     width = width < 100 ? 100 : width;

     updateSetting('width_preview', width);
     chrome.runtime.sendMessage({msg: "reload"});

     trackEvent({'name': 'option', 'detail': 'width_preview.'+width});
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

    trackEvent({ 'name': 'option', 'detail': 'delay_sec_auto_hide.' + sec });
  };
  document.getElementById('delay_sec_auto_hide').addEventListener('keyup', getDelaySecAutoHide);
  document.getElementById('delay_sec_auto_hide').addEventListener('blur', getDelaySecAutoHide);
  document.getElementById('delay_sec_auto_hide').addEventListener('change', getDelaySecAutoHide);

  var warnning = ' // invalid and ignored';
  var getlist = function (e, identifier) {
    var listUrlPtns = e.target.value;    
    listUrlPtns = listUrlPtns.trim().split("\n");
    listUrlPtns = listUrlPtns.filter(function (listUrlPtns) { return listUrlPtns.trim() !== '';})
    // listUrlPtns = listUrlPtns.map(function(rawPtn) {
    //   var ptn = rawPtn;
    //   try {
    //     ptn = ptn.replace(/http(s)?:\.\./, '');
    //     ptn = ptn.replace(/\*/g, 'foo')
    //     ptn = 'http://' + ptn
    //     console.log(new URL(ptn));
    //   } catch (e) {
    //     rawPtn = rawPtn.replace(warnning, '') + warnning;
    //   }
    //   return rawPtn
    // });

    // console.log(listUrlPtns)
    // document.getElementById(identifier).value = listUrlPtns.join("\n");

    updateSetting(identifier, listUrlPtns);
    chrome.runtime.sendMessage({ msg: "reload" });

    trackEvent({ 'name': 'option', 'detail': identifier + '.' + listUrlPtns.length });
  };
  var getBlackList = function(e) { return getlist(e, 'blacklist') }
  var getWhiteList = function(e) { return getlist(e, 'whitelist') }
  document.getElementById('whitelist').addEventListener('blur', getWhiteList);
  document.getElementById('blacklist').addEventListener('blur', getBlackList);
}

function showBanner(msg) {
  document.querySelector('#banner').innerText = msg;
  document.querySelector('#banner').removeAttribute('hidden');
}

// ---------------------------------------------------------------------

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