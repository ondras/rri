import { listenAndServe, ServerRequest } from "https://deno.land/std/http/server.ts";
import { acceptWebSocket } from "https://deno.land/std/ws/mod.ts";
import Player from "./player.ts";

async function processRequest(req: ServerRequest) {
	try {
		let ws = await acceptWebSocket({
			conn: req.conn,
			headers: req.headers,
			bufReader: req.r,
			bufWriter: req.w
		});
		console.log("new websocket connection");
		new Player(ws);
	} catch (e) {
		console.error("failed to accept websocket", e);
		req.respond({body:"this is a websocket endpoint"});
	}
}

const port = Deno.args[0] || "8080";
console.log("websocket server is running on", port);
listenAndServe(`:${port}`, processRequest);
