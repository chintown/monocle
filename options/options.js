$(document).ready(function() {
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

function initializeTabs() {
  log('initializeTabs');
  $('ul.menu li:first').addClass('tabActive').show();
  $('#options > div').hide();
  $('#basics').show();

  $("ul.menu").on("click", "li", function() {
    $('ul.menu li').removeClass('tabActive');
    $(this).addClass('tabActive');
    $('#options > div').hide();

    // Fade in the correct DIV.
    var activeTab = $($(this).find('a').attr('href')).fadeIn();
    return false;
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