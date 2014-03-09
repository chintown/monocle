$(document).ready(function() {
  init();
});

function init() {
  initializeTabs();
  loadSettings();
}

function initializeTabs() {
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

function loadSettings() {
  var expectedNames = [
    'keyboard_shortcut',
    'button_functionality',
    'magnifier'
  ]
  chrome.storage.local.get(expectedNames, function(settings) {
    window.SETTINGS = settings || {};

    initSettings();
    dumpSettings();
    updateUiWithSettings();
    bindUiWithSettings();
  });
}
function initSettings() {
  setDefaultValue('keyboard_shortcut', 'a');
  setDefaultValue('button_functionality', 'basic');
  setDefaultValue('magnifier', false);
  saveSettings();
}
function updateSetting(name, value) {
  window.SETTINGS[name] = value;
  saveSettings();
}
function saveSettings() {
  dumpSettings();
  chrome.storage.local.set(window.SETTINGS);
}
function setDefaultValue(name, value) {
  if (!window.SETTINGS[name]) {
    window.SETTINGS[name] = value;
  }
}
function dumpSettings() {
  console.log(window.SETTINGS);
}
function updateUiWithSettings() {
  var s = window.SETTINGS;
  document.getElementById('shortcut').value = s['keyboard_shortcut'];
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
  document.getElementById('shortcut').addEventListener('blur', function (e) {
    updateSetting('keyboard_shortcut', e.target.value);
  });
  document.getElementById('app_advanced').addEventListener('change', function (e) {
    updateSetting('button_functionality', 'advanced');
  });
  document.getElementById('app_basic').addEventListener('change', function (e) {
    updateSetting('button_functionality', 'basic');
  });
  document.getElementById('magnifier').addEventListener('change', function (e) {
    updateSetting('magnifier', e.target.checked);
  });
}