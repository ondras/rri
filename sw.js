const CACHE_NAME = "offline";
const urlsToCache = [".", "app/app.css", "app/app.bundle.js", "img/icon.svg"];

async function precache() {
	const cache = await caches.open(CACHE_NAME);
	return cache.addAll(urlsToCache);
};

async function respondTo(request) {
	let f = fetch(request);
	const cached = await caches.match(request);

	if (cached) { // try updating the cache first
		try {
			let response = await f;
			let cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
			return response;
		} catch (e) { // offline
			return cached;
		}
	} else { // not cached, forward to network
		return f;
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
