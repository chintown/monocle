// chrome.tabs.onUpdated.addListener(function(id, info, tab){
//     chrome.pageAction.show(tab.id);
// });

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.msg) {
        case "snapshot":
            cbSnapshot();
        break;
    }
    return true;
});

function cbSnapshot() {
    chrome.tabs.captureVisibleTab(
        null,
        {},
        function(dataUrl) {
            sendResponse({
                imgSrc: dataUrl
            });
        }
    );
}

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, {msg: 'toggle-extension'});
});

chrome.commands.onCommand.addListener(function(command) {
    switch(command) {
        case "toggle-extension":
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {msg: 'toggle-extension'});
            });
            break;
    }
});