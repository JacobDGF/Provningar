// Downloads the CDN libraries the pages load into tests/vendor/ so that
// `npm test` can run offline and deterministically. Optional — without it the
// tests just let those requests reach the network.
//
//   npm run test:vendor

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CDN_FILES } from "./smoke.mjs";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "vendor");
fs.mkdirSync(dir, { recursive: true });

for (const [url, name] of Object.entries(CDN_FILES)) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`failed ${name}: ${res.status} ${url}`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(dir, name), Buffer.from(await res.arrayBuffer()));
  console.log(`vendored ${name}`);
}
