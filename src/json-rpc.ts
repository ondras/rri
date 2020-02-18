type V = "2.0";
type Params = unknown[] | object;

interface ErrorObject {
	code: number;
	message: string;
	data?: unknown;
}

interface CallMessage {
	method: string;
	params: Params;
	id?: string;
	jsonrpc: V;
}

interface ResultMessage {
	result: unknown;
	id: string;
	jsonrpc: V;
}

interface ErrorMessage {
	error: ErrorObject;
	id: string | null;
	jsonrpc: V;
}

interface Options {
	log: boolean;
}

type Message = CallMessage | ResultMessage | ErrorMessage;

export interface IO {
	onData(str: string): void;
	sendData(m: string): void;
}

const V = "2.0";

function debug(msg: string, ...args: unknown[]) {
	console.debug(`[jsonrpc] ${msg}`, ...args);
}

function warn(msg: string, ...args: unknown[]) {
	console.warn(`[jsonrpc] ${msg}`, ...args);
}

function createErrorMessage(id: string | null, code: number, message: string, data?: unknown): ErrorMessage {
	let error = {code, message } as ErrorObject;
	if (data) { error.data = data; }
	return {id, error, jsonrpc:V};
}

function createResultMessage(id: string, result: unknown): ResultMessage {
	return {id, result, jsonrpc:V};
}

function createCallMessage(method: string, params: Params, id?: string): CallMessage {
	let message = {method, params, jsonrpc:V} as CallMessage;
	if (id) { message.id = id; }
	return message;
}

export default class JsonRpc {
	_interface = new Map<string, Function>();
	_pendingPromises = new Map<string, {resolve:Function, reject:Function}>();
	_options: Options = {
		log: false
	}

	constructor(readonly _io: IO, options: Partial<Options> = {}) {
		Object.assign(this._options, options);
		_io.onData = (m:string) => this._onData(m);
	}

	expose(name: string, method: Function) {
		this._interface.set(name, method);
	}

	async call(method: string, params: Params): Promise<any> {
		let id = Math.random().toString();
		let message = createCallMessage(method, params, id);
		return new Promise((resolve, reject) => {
			this._pendingPromises.set(id, {resolve, reject})
			this._send(message);
		});
	}

	notify(method: string, params: Params) {
		let message = createCallMessage(method, params);
		this._send(message);
	}

	_send(message: Message | Message[]) {
		const str = JSON.stringify(message);
		this._options.log && debug("sending", str);
		this._io.sendData(str);
	}

	_onData(str: string) {
		this._options.log && debug("received", str);

		let message: Message | Message[];
		try {
			message = JSON.parse(str);
		} catch (e) {
			let reply = createErrorMessage(null, -32700, e.message);
			this._send(reply);
			return;
		}

		let reply: Message | Message[] | null;
		if (message instanceof Array) {
			let mapped = message.map(m => this._processMessage(m)).filter(m => m) as Message[];
			reply = (mapped.length ? mapped : null);
		} else {
			reply = this._processMessage(message);
		}

		reply && this._send(reply);
	}

	_processMessage(message: Message): Message | null {
		if ("method" in message) { // call
			const method = this._interface.get(message.method);
			if (!method) {
				return (message.id ? createErrorMessage(message.id, -32601, "method not found") : null);
			}

			try {
				const result = (message.params instanceof Array ? method(...message.params) : method(message.params));
				return (message.id ? createResultMessage(message.id, result) : null);
			} catch (e) {
				this._options.log && warn("caught", e);
				return (message.id ? createErrorMessage(message.id, -32000, e.message) : null);
			}

		} else if (message.id) { // result/error

			let promise = this._pendingPromises.get(message.id);
			if (!promise) { throw new Error(`Received a non-matching response id "${message.id}"`); }
			this._pendingPromises.delete(message.id);
			("error" in message ? promise.reject(message.error) : promise.resolve(message.result));

		} else {
			throw new Error("Received a non-call non-id JSON-RPC message");
		}

		return null;
	}
}
