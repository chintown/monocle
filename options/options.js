$(document).ready(function() {
  init();
});

function init() {
  initializeTabs();
  loadSettings(function () {
    updateUiWithSettings();
    bindUiWithSettings();
  });
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

function updateUiWithSettings() {
  var s = window.USER_SETTINGS;
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