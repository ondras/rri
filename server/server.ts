import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import Player from "./player.ts";


async function handleReq(req: Request) {
	try {
		const { socket, response } = Deno.upgradeWebSocket(req);
		console.log("new websocket connection");
		new Player(socket);
		return response;
	} catch {
		console.error("failed to accept websocket for url", req.url);
		return Response.redirect("https://ondras.github.io/rri/");
	}
}

const port = Number(Deno.args[0] || "80");
serve(handleReq, {port})
console.log("http server is running on", port);
