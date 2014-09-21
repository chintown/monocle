function loadSettingsFromStorage(callback) {
  log('loadSettingsFromStorage');
  var expectedNames = [
    'keyboard_shortcut',
    'button_functionality',
    'magnifier',
    'last_auto_status'
  ]
  chrome.storage.local.get(expectedNames, function(settings) {
    window.USER_SETTINGS = settings || {};
    completeSettings();

  log('loadSettingsFromStorage', 'END');
    callback();
  });
}
function completeSettings() {
  log('completeSettings');
  var isDirty = false;
  isDirty = updateSettingIfMissing('keyboard_shortcut', 'a') || isDirty;
  isDirty = updateSettingIfMissing('button_functionality', 'basic') || isDirty;
  isDirty = updateSettingIfMissing('magnifier', false) || isDirty;
  isDirty = updateSettingIfMissing('last_auto_status', false) || isDirty;
  if (isDirty) {
    saveSettingsToStorage();
  }
}
function updateSetting(name, value) {
  log('updateSetting', name, value);
  window.USER_SETTINGS[name] = value;
  saveSettingsToStorage();

  chrome.runtime.sendMessage({msg: "reload", detail: window.USER_SETTINGS});
}
function updateSettingIfMissing(name, value) {
  log('updateSettingIfMissing', name, value);
  if (!window.USER_SETTINGS.hasOwnProperty(name)) {
    window.USER_SETTINGS[name] = value;
    return true;
  }
  return false;
}

function saveSettingsToStorage() {
  log('saveSettingsToStorage');
  dumpSettings('saved');
  chrome.storage.local.set(window.USER_SETTINGS);
}

function dumpSettings(context) {
  log('dumpSettings');
  log(window.USER_SETTINGS, context);
}