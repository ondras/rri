const V = "2.0";
function debug(msg, ...args) {
    console.debug(`[jsonrpc] ${msg}`, ...args);
}
function warn(msg, ...args) {
    console.warn(`[jsonrpc] ${msg}`, ...args);
}
function createErrorMessage(id, code, message, data) {
    let error = { code, message };
    if (data) {
        error.data = data;
    }
    return { id, error, jsonrpc: V };
}
function createResultMessage(id, result) {
    return { id, result, jsonrpc: V };
}
function createCallMessage(method, params, id) {
    let message = { method, params, jsonrpc: V };
    if (id) {
        message.id = id;
    }
    return message;
}
export default class JsonRpc {
    constructor(_io) {
        this._io = _io;
        this._interface = new Map();
        this._pendingPromises = new Map();
        _io.onData = (m) => this._onData(m);
    }
    expose(name, method) {
        this._interface.set(name, method);
    }
    async call(method, params) {
        let id = Math.random().toString();
        let message = createCallMessage(method, params, id);
        return new Promise((resolve, reject) => {
            this._pendingPromises.set(id, { resolve, reject });
            this._send(message);
        });
    }
    notify(method, params) {
        let message = createCallMessage(method, params);
        this._send(message);
    }
    _send(message) {
        const str = JSON.stringify(message);
        debug("sending", str);
        this._io.sendData(str);
    }
    _onData(str) {
        debug("received", str);
        let message;
        try {
            message = JSON.parse(str);
        }
        catch (e) {
            let reply = createErrorMessage(null, -32700, e.message);
            this._send(reply);
            return;
        }
        let reply;
        if (message instanceof Array) {
            let mapped = message.map(m => this._processMessage(m)).filter(m => m);
            reply = (mapped.length ? mapped : null);
        }
        else {
            reply = this._processMessage(message);
        }
        reply && this._send(reply);
    }
    _processMessage(message) {
        if ("method" in message) { // call
            const method = this._interface.get(message.method);
            if (!method) {
                return (message.id ? createErrorMessage(message.id, -32601, "method not found") : null);
            }
            try {
                const result = (message.params instanceof Array ? method(...message.params) : method(message.params));
                return (message.id ? createResultMessage(message.id, result) : null);
            }
            catch (e) {
                warn("caught", e);
                return (message.id ? createErrorMessage(message.id, -32000, e.message) : null);
            }
        }
        else if (message.id) { // result/error
            let promise = this._pendingPromises.get(message.id);
            if (!promise) {
                throw new Error(`Received a non-matching response id "${message.id}"`);
            }
            this._pendingPromises.delete(message.id);
            ("error" in message ? promise.reject(message.error) : promise.resolve(message.result));
        }
        else {
            throw new Error("Received a non-call non-id JSON-RPC message");
        }
        return null;
    }
}
