// Generates the favicon asset set from public/favicon.svg.
//
//   node scripts/gen-favicon.mjs   (or: npm run gen:favicon)
//
// Outputs (committed to public/):
//   favicon.ico          — multi-resolution (16/32/48/256), PNG-compressed entries
//   apple-touch-icon.png — 180×180, logo on an ink background
//   icon-192.png         — 192×192 maskable
//   icon-512.png         — 512×512 maskable
//
// Uses sharp to rasterize the SVG; the ICO is packed with a small inline
// encoder so no extra dependency is required.

import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public');
const svg = readFileSync(join(pub, 'favicon.svg'));

/** Rasterize the transparent logo at `size`px. */
const renderLogo = (size) =>
    sharp(svg, {density: 600})
        .resize(size, size, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
        .png()
        .toBuffer();

/** Logo centered on a solid background with padding (apple-touch / maskable). */
const onBackground = async (size, pad, bg) => {
    const inner = Math.round(size * (1 - pad * 2));
    const logo = await renderLogo(inner);
    return sharp({create: {width: size, height: size, channels: 4, background: bg}})
        .composite([{input: logo, gravity: 'center'}])
        .png()
        .toBuffer();
};

/** Pack PNG buffers into a multi-image .ico (PNG-in-ICO, supported since Vista). */
const buildIco = (images) => {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);              // reserved
    header.writeUInt16LE(1, 2);              // type: 1 = icon
    header.writeUInt16LE(images.length, 4);  // image count

    const entries = [];
    const blobs = [];
    let offset = 6 + images.length * 16;
    for (const {size, buffer} of images) {
        const entry = Buffer.alloc(16);
        entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 means 256)
        entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 means 256)
        entry.writeUInt8(0, 2);                       // palette size
        entry.writeUInt8(0, 3);                       // reserved
        entry.writeUInt16LE(1, 4);                    // color planes
        entry.writeUInt16LE(32, 6);                   // bits per pixel
        entry.writeUInt32LE(buffer.length, 8);        // data size
        entry.writeUInt32LE(offset, 12);              // data offset
        offset += buffer.length;
        entries.push(entry);
        blobs.push(buffer);
    }
    return Buffer.concat([header, ...entries, ...blobs]);
};

const ink = {r: 23, g: 20, b: 31, alpha: 1}; // matches the dark canvas / theme-color

const main = async () => {
    const icoSizes = [16, 32, 48, 256];
    const icoImages = await Promise.all(
        icoSizes.map(async (size) => ({size, buffer: await renderLogo(size)})),
    );
    writeFileSync(join(pub, 'favicon.ico'), buildIco(icoImages));
    writeFileSync(join(pub, 'apple-touch-icon.png'), await onBackground(180, 0.16, ink));
    writeFileSync(join(pub, 'icon-192.png'), await onBackground(192, 0.16, ink));
    writeFileSync(join(pub, 'icon-512.png'), await onBackground(512, 0.16, ink));
    console.log('✓ favicon assets written to public/ (favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png)');
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
