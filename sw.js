const OFFLINE_VERSION = 1;
const cacheName = "offline";
const OFFLINE_URL = "./offline.html";

self.addEventListener("fetch", function (event) {
	event.respondWith(
		caches.open("offline").then(function (cache) {
			return cache.match(event.request).then(function (response) {
				return (
					response ||
					fetch(event.request).then(function (response) {
						cache.put(event.request, response.clone());
						return response;
					})
				);
			});
		})
	);
});
self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			caches.open(cacheName).then(function (cache) {
				return cache.addAll([
					"./index.html",
				]);
			});
		})()
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			if ("navigationPreload" in self.registration) {
				await self.registration.navigationPreload.enable();
			}
		})()
	);

	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	if (event.request.mode === "navigate") {
		event.respondWith(
			(async () => {
				try {
					const preloadResponse = await event.preloadResponse;
					if (preloadResponse) {
						return preloadResponse;
					}

					const networkResponse = await fetch(event.request);
					return networkResponse;
				} catch (error) {
					console.log("Fetch failed; returning offline page instead.", error);

					const cache = await caches.open(cacheName);
					const cachedResponse = await cache.match(OFFLINE_URL);
					return cachedResponse;
				}
			})()
		);
	}
});
