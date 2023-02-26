import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import Player from "./player.ts";


async function handleReq(req: Request, conn: ConnInfo) {
	console.log("new http request", conn.remoteAddr, req.url);
	try {
		const { socket, response } = Deno.upgradeWebSocket(req);
		console.log("accepted websocket upgrade")
		new Player(socket);
		return response;
	} catch {
		console.error("failed to accept websocket, redirecting away");
		return Response.redirect("https://ondras.github.io/rri/");
	}
}

const port = Number(Deno.args[0] || "80");
serve(handleReq, {port})
