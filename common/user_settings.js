function loadSettings(callback) {
  var expectedNames = [
    'keyboard_shortcut',
    'button_functionality',
    'magnifier',
    'last_auto_status'
  ]
  chrome.storage.local.get(expectedNames, function(settings) {
    window.USER_SETTINGS = settings || {};

    initSettings();
    dumpSettings('loaded');

    callback();
  });
}
function initSettings() {
  var isDirty = false;
  isDirty = putDefaultSetting('keyboard_shortcut', 'a') || isDirty;
  isDirty = putDefaultSetting('button_functionality', 'basic') || isDirty;
  isDirty = putDefaultSetting('magnifier', false) || isDirty;
  isDirty = putDefaultSetting('last_auto_status', false) || isDirty;
  if (isDirty) {
    saveSettings();
  }
}
function updateSetting(name, value) {
  window.USER_SETTINGS[name] = value;
  saveSettings();
}
function saveSettings() {
  dumpSettings('saved');
  chrome.storage.local.set(window.USER_SETTINGS);
}
function putDefaultSetting(name, value) {
  if (!window.USER_SETTINGS[name]) {
    window.USER_SETTINGS[name] = value;
    return true;
  }
  return false;
}
function dumpSettings(context) {
  console.log(window.USER_SETTINGS, context);
}