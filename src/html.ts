export function node(name: string, attrs = {}, content?: string) {
	let node = document.createElement(name);
	Object.assign(node, attrs);
	content && (node.textContent = content);
	return node;
}
