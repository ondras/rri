import Player from "./player.ts";


async function handleReq(req: Request) {
	if (req.headers.get("upgrade") != "websocket") {
		console.error("failed to accept websocket for url", req.url);
		return new Response("this is a websocket endpoint");
	}

	console.log("new websocket connection");
	const { socket, response } = Deno.upgradeWebSocket(req);
	new Player(socket);

	return response;
}

addEventListener("fetch", event => {
	event.respondWith(handleReq(event.request));
});
