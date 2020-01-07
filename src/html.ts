export function node<T extends keyof HTMLElementTagNameMap>(name: T, attrs = {}, content?: string): HTMLElementTagNameMap[T] {
	let node = document.createElement(name);
	Object.assign(node, attrs);
	content && (node.textContent = content);
	return node;
}
