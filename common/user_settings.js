var settingNames = [
  'keyboard_shortcut',
  'button_functionality',
  'magnifier',
  'last_auto_status',
  'width_preview',
  'delay_sec_auto_hide',
  'knob',
  'blacklist',
  'whitelist',
  'use_sync',
  'stamp',
];
function getLocalSettings() {
  log('getLocalSettings');
  return new Promise(function(resolve, reject) {
    chrome.storage.local.get(settingNames, function (settings) {
      if (!Object.keys(settings).length) {
        reject(new Error('local settings not found'));
      }
      resolve(settings);
    });
  });
}
function tryMigrateToSyncStorage() {
  log('tryMigrateToSyncStorage');
  if (window.SHOULD_MIGRATE) {
    window.SHOULD_MIGRATE = false;
    window.USER_SETTINGS.use_sync = true;
    window.USER_SETTINGS.stamp = +new Date();
    chrome.storage.local.set(window.USER_SETTINGS);
    chrome.storage.sync.set(window.USER_SETTINGS);
  }
}
(function setupStorage() {
  log('setupStorage');
  // window.StoragePromise = Promise.resolve(chrome.storage.local);
  // return;
  window.StoragePromise = new Promise(function (resolve, reject) {
    getLocalSettings()
      .then(function(settings) {
        if (!!settings.use_sync) {
          log('switch to chrome.storage.sync');
          window.SHOULD_SHOW_LOCAL = true;
          resolve(chrome.storage.sync);
        } else {
          log('try migrate to chrome.storage.sync');
          window.SHOULD_MIGRATE = true;
          resolve(chrome.storage.local);
        }
      })
      .catch(function(e) {
        if (e.message === 'local settings not found') {
          log('default to chrome.storage.sync');
          resolve(chrome.storage.sync);
        } else {
          reject(e);
        }
      });
  })
}());
function loadSettingsFromStorage(callback) {
  log('loadSettingsFromStorage');
  window.StoragePromise.then(function(storage) {
    storage.get(settingNames, function (settings) {
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
  isDirty = updateSettingIfMissing('delay_sec_auto_hide', 1) || isDirty;
  isDirty = updateSettingIfMissing('knob', true) || isDirty;
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
    window.USER_SETTINGS.stamp = +new Date();
    storage.set(window.USER_SETTINGS);
  });
}
function dumpSettings(context) {
  log('dumpSettings');
  log(window.USER_SETTINGS, context);
}
function clearSettings() {
  chrome.storage.local.clear(function () {
    var error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
    }
  });
}
function updateSettingsLocally(changes, namespace) {
  if ((+new Date()) - (+changes.stamp.newValue) < 100) {
    log('ignore onChange in local');
    return;
  }
  for (var key in changes) {
    var storageChange = changes[key];
    log('update setting "' + key + '": "' + storageChange.oldValue + '" -> "' + storageChange.newValue + '" in background only.')
    window.USER_SETTINGS[key] = storageChange.newValue;
  }
}

window.addEventListener('unload', tryMigrateToSyncStorage);
chrome.storage.onChanged.addListener(updateSettingsLocally);