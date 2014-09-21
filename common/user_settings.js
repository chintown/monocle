function loadSettings(callback) {
  log('loadSettings');
  var expectedNames = [
    'keyboard_shortcut',
    'button_functionality',
    'magnifier',
    'last_auto_status'
  ]
  chrome.storage.local.get(expectedNames, function(settings) {
    window.USER_SETTINGS = settings || {};

    initSettings();

    callback();
  });
}
function initSettings() {
  log('initSettings');
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
  log('updateSetting', name, value);
  window.USER_SETTINGS[name] = value;
  saveSettings();
}
function saveSettings() {
  log('saveSettings');
  dumpSettings('saved');
  chrome.storage.local.set(window.USER_SETTINGS);
}
function putDefaultSetting(name, value) {
  log('putDefaultSetting', name, value);
  if (!window.USER_SETTINGS[name]) {
    window.USER_SETTINGS[name] = value;
    return true;
  }
  return false;
}
function dumpSettings(context) {
  log('dumpSettings');
  console.log(window.USER_SETTINGS, context);
}