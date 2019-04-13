console.log('dev stamp', 3);

function domSelf(selector, context) {
    return context.matches(selector)
        ? context
        : undefined;
}

function dom(selector, context, shouldIncludeSelf) {
    var scope = (context || document);
    return scope.querySelector(selector) 
            || (shouldIncludeSelf && domSelf(selector, scope));
}
function domAll(selector, context) {
    return (context || document).querySelectorAll(selector);
}
function domNew(input) {
    var container = document.createElement('div');
    container.innerHTML = input;
    return container.children[0];
}