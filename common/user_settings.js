function tryMigrateToSyncStorage() {
  log('tryMigrateToSyncStorage');
  if (window.SHOULD_MIGRATE) {
    window.SHOULD_MIGRATE = false;
    window.USER_SETTINGS.useSync = true;
    chrome.storage.local.set(window.USER_SETTINGS);
    chrome.storage.sync.set(window.USER_SETTINGS);
  }
}
(function setupStorage() {
  log('setupStorage');
  window.StoragePromise = new Promise(function (resolve, reject) {
    chrome.storage.local.get(['useSync'], function (settings) {
      if (!!settings.useSync) {
        log('switch to chrome.storage.sync');
        resolve(chrome.storage.sync);
      } else {
        window.SHOULD_MIGRATE = true;
        resolve(chrome.storage.local);
      }
    });
  })

}());
function loadSettingsFromStorage(callback) {
  log('loadSettingsFromStorage');
  var expectedNames = [
    'keyboard_shortcut',
    'button_functionality',
    'magnifier',
    'last_auto_status',
    'width_preview',
    'delay_sec_auto_hide',
    'blacklist',
    'whitelist',
  ]
  window.StoragePromise.then(function(storage) {
    storage.get(expectedNames, function (settings) {
      window.USER_SETTINGS = settings || {};
      completeSettings();

      log('loadSettingsFromStorage', 'END');
      callback();
    });
  });
}
function completeSettings() {
  log('completeSettings');
  var isDirty = false;
  isDirty = updateSettingIfMissing('keyboard_shortcut', 'a') || isDirty;
  isDirty = updateSettingIfMissing('button_functionality', 'basic') || isDirty;
  isDirty = updateSettingIfMissing('magnifier', true) || isDirty;
  isDirty = updateSettingIfMissing('last_auto_status', true) || isDirty;
  isDirty = updateSettingIfMissing('width_preview', 100) || isDirty;
  isDirty = updateSettingIfMissing('delay_sec_auto_hide', 3) || isDirty;
  isDirty = updateSettingIfMissing('blacklist', []) || isDirty;
  isDirty = updateSettingIfMissing('whitelist', []) || isDirty;
  if (isDirty) {
    saveSettingsToStorage();
  }
}
function updateSetting(name, value) {
  log('updateSetting', name, value);
  window.USER_SETTINGS[name] = value;
  saveSettingsToStorage();
}
function updateSettingIfMissing(name, value) {
  if (!window.USER_SETTINGS.hasOwnProperty(name)) {
    log('updateSetting(new setting)', name, value);
    updateSetting(name, value)
    return true;
  }
  return false;
}

function saveSettingsToStorage() {
  log('saveSettingsToStorage');
  dumpSettings('saved');
  window.StoragePromise.then(function (storage) {
    storage.set(window.USER_SETTINGS)
    storage.getBytesInUse(function () {
      console.warn(arguments)
    });
  });
}

function dumpSettings(context) {
  log('dumpSettings');
  log(window.USER_SETTINGS, context);
}

window.addEventListener('unload', tryMigrateToSyncStorage);