const CACHE_NAME = "offline";

async function precache() {
	const urlsToCache = [".", "app/app.css"];
	const cache = await caches.open(CACHE_NAME);
	return cache.addAll(urlsToCache);
};

async function respondTo(request) {
	const cache = await caches.open(CACHE_NAME);
	try {
		let response = await fetch(request);
		await cache.put(request, response.clone());
		return response;
	} catch (e) {
		const response = await cache.match(request);
		return response || e;
	}
};

async function onInstall(e) {
	self.skipWaiting();
	e.waitUntil(precache());
}

async function onFetch(e) {
	e.respondWith(respondTo(e.request));
}

self.addEventListener("install", onInstall);
self.addEventListener("fetch", onFetch);
