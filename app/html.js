export function node(name, attrs = {}, content) {
    let node = document.createElement(name);
    Object.assign(node, attrs);
    content && (node.textContent = content);
    return node;
}
