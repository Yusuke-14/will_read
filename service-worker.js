// キャッシュ名を分けておくと、将来更新したいときに切り替えやすい
const CACHE_NAME = "want-to-read-app-v1";

// PWAで最低限使う静的ファイルだけを保存する
// localStorage の本データはここでは扱わない
const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon-192.svg",
  "./icon-512.svg"
];

// 初回インストール時に、必要ファイルをまとめてキャッシュする
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL_FILES);
    })
  );
});

// 古いキャッシュが残っていたら削除する
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }

          return Promise.resolve();
        })
      );
    })
  );
});

// 同じドメインの GET リクエストだけを対象にする
// まずキャッシュを見て、無ければネットワークへ取りに行くシンプルな方式
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request);
    })
  );
});
