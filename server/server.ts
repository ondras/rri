import Player from "./player.ts";


async function handleReq(req: Request) {
	let upgrade = req.headers.get("upgrade") || "";
	if (upgrade.toLowerCase() != "websocket") {
		console.error("failed to accept websocket for url", req.url);
		return new Response("this is a websocket endpoint");
	}

	console.log("new websocket connection");
	const { socket, response } = Deno.upgradeWebSocket(req);
	new Player(socket);

	return response;
}

async function handleConn(conn: Deno.Conn) {
	const httpConn = Deno.serveHttp(conn);
	try {
		for await (const requestEvent of httpConn) {
			await requestEvent.respondWith(handleReq(requestEvent.request));
		}
	} catch (e) {}
}

const port = Number(Deno.args[0] || "8080");
console.log("http server is running on", port);

const server = Deno.listen({ port });
for await (const conn of server) {
	handleConn(conn);
}
