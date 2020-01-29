import { serve, ServerRequest } from "https://deno.land/std/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket
} from "https://deno.land/std/ws/mod.ts";

import Player from "./app/player.ts";

async function initClient(ws: WebSocket) {
	console.log("socket connected!");
	new Player(ws);

	try {
		for await (const ev of ws.receive()) {
			if (typeof ev === "string") { // text message
				console.log("ws:Text", ev);
				await ws.send(ev);
			} else if (ev instanceof Uint8Array) { // binary message
				console.log("ws:Binary", ev);
			} else if (isWebSocketPingEvent(ev)) { // ping
				const [, body] = ev;
				console.log("ws:Ping", body);
			} else if (isWebSocketCloseEvent(ev)) { // close
				const { code, reason } = ev;
				console.log("ws:Close", code, reason);
			}
		}
	} catch (e) {
		console.error("failed to receive frame", e);
		await ws.close(1000).catch(console.error);
	}
}

async function processUpgradeRequest(req: ServerRequest) {
	try {
		let ws = await acceptWebSocket({
			conn: req.conn,
			headers: req.headers,
			bufReader: req.r,
			bufWriter: req.w
		});
		initClient(ws);
	} catch (e) {
		console.error("failed to accept websocket", e);
	}
}

const port = Deno.args[0] || "8080";
console.log("websocket server is running on", port);
for await (const req of serve(`:${port}`)) {
	processUpgradeRequest(req);
}
