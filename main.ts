// "The World in One Day" — Saturday 21 November 2026 (news-image-20261121).
//
// A Node 22 program using only the standard library. It takes the finished
// front page, entry.png, which sits beside this file in the repository, and
// writes it into the grader's output directory as entry.png. Nothing is
// generated or fetched at run time — no network, no randomness — so every
// run produces byte-identical output.
//
// Run it outside the grader's container with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const targetPath = join(outDir, "entry.png");

// Load the finished front page and check it is a whole image under the limit.
const bytes = readFileSync(sourcePath);
if (bytes.length === 0) {
  throw new Error("entry.png is empty, refusing to write an empty output");
}
if (bytes.length > 1024 * 1024) {
  throw new Error(
    `entry.png is ${bytes.length} bytes, over the 1 MiB limit`,
  );
}
if (
  bytes[0] !== 0x89 ||
  bytes[1] !== 0x50 ||
  bytes[2] !== 0x4e ||
  bytes[3] !== 0x47 ||
  bytes[4] !== 0x0d ||
  bytes[5] !== 0x0a ||
  bytes[6] !== 0x1a ||
  bytes[7] !== 0x0a
) {
  throw new Error("entry.png does not start with the PNG signature");
}
if (
  bytes[12] !== 0x49 ||
  bytes[13] !== 0x48 ||
  bytes[14] !== 0x44 ||
  bytes[15] !== 0x52
) {
  throw new Error("entry.png has no IHDR chunk, not a valid PNG");
}
// IHDR: width and height are big-endian uint32s at offsets 16 and 20.
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width === 0 || height === 0) {
  throw new Error(`entry.png has invalid dimensions ${width}x${height}`);
}
if (width > 1024 || height > 1024) {
  throw new Error(
    `entry.png is ${width}x${height}, over the 1024x1024 limit`,
  );
}
const sourceHash = createHash("sha256").update(bytes).digest("hex");

mkdirSync(outDir, { recursive: true });
writeFileSync(targetPath, bytes);

// Read the copy back and prove it landed whole: same length, same sha256,
// and still starting with the PNG signature.
const written = readFileSync(targetPath);
if (written.length !== bytes.length) {
  throw new Error(
    `entry.png copy is incomplete: wrote ${written.length} bytes, ` +
      `expected ${bytes.length}`,
  );
}
const writtenHash = createHash("sha256").update(written).digest("hex");
if (writtenHash !== sourceHash) {
  throw new Error("entry.png copy failed the sha256 integrity check");
}
if (
  written[0] !== 0x89 ||
  written[1] !== 0x50 ||
  written[2] !== 0x4e ||
  written[3] !== 0x47
) {
  throw new Error("entry.png does not start with the PNG signature");
}

console.log(
  `wrote ${targetPath} (${written.length} bytes, ${width}x${height}, sha256 ${writtenHash})`,
);
