function domSelf(selector, context) {
    return context.matches(selector)
        ? context
        : undefined;
}
function dom(selector, context, shouldIncludeSelf) {
    var scope = (context || document);
    return (shouldIncludeSelf && domSelf(selector, scope))
            || scope.querySelector(selector);
}
function domAll(selector, context) {
    return [].slice.call((context || document).querySelectorAll(selector));
}
function domNew(input) {
    var container = document.createElement('div');
    container.innerHTML = input;
    return container.children[0];
}
function offset(el) {
    var rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft
    }
}