import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function list(dir, prefix = "") {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "sw.js") continue;
    if (entry.isDirectory())
      result.push(
        ...(await list(`${dir}/${entry.name}`, `${prefix}${entry.name}/`)),
      );
    else result.push(`${prefix}${entry.name}`);
  }
  return result;
}
const files = await list("dist");
const hash = createHash("sha256");
for (const file of files) hash.update(await readFile(`dist/${file}`));
const version = hash.digest("hex").slice(0, 12);
await writeFile(
  "dist/sw.js",
  `
const CACHE = 'kish-${version}';
const FILES = ${JSON.stringify(files.map((f) => "./" + f))};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kish-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('./index.html', self.registration.scope))));
  } else {
    event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request)));
  }
});
`,
);
console.log(
  `Offline app generated: ${files.length} assets, version ${version}`,
);
