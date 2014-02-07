$(document).ready(function() {
  init();
});

function init() {
  initializeTabs();
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