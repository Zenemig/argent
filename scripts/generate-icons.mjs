import sharp from "sharp";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

// The icon path from Figma (viewBox 0 0 82 85)
const ICON_PATH = `<path fill-rule="evenodd" clip-rule="evenodd" d="M81.1191 84.3604H63.7197L57.7803 68.6406H23.0605L17.04 84.3604H0L33.96 0H47.2793L81.1191 84.3604ZM40.6025 15.3604C40.3273 15.3687 40.0359 15.5392 39.9307 15.8174C39.4722 17.0245 37.7109 19.5549 35.6709 22.4863C30.9986 29.1963 24.5999 38.386 24.5996 44.3652C24.5996 48.3028 26.0304 51.9123 28.3984 54.7021L28.3008 54.96H28.623C31.5554 58.2697 35.8344 60.3603 40.5938 60.3604C45.3533 60.3604 49.633 58.2699 52.5654 54.96H52.6113L52.5977 54.9229C55.0797 52.1039 56.5879 48.4077 56.5879 44.3652C56.5876 38.4826 50.3045 29.4545 45.7168 22.8623C43.5683 19.7758 41.713 17.1094 41.2627 15.833C41.1631 15.5523 40.9002 15.3641 40.6025 15.3604Z" fill="#D4D4D8"/>`;

const BG_COLOR = "#09090b";
const ICON_VB_W = 82;
const ICON_VB_H = 85;

function createIconSvg(size, iconScale) {
  // Scale the icon to fit within iconScale% of the canvas
  const available = size * iconScale;
  // Scale to fit height (icon is taller than wide)
  const scale = available / ICON_VB_H;
  const iconW = ICON_VB_W * scale;
  const iconH = ICON_VB_H * scale;
  const offsetX = (size - iconW) / 2;
  const offsetY = (size - iconH) / 2;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.187)}" fill="${BG_COLOR}"/>
  <g transform="translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})">
    ${ICON_PATH}
  </g>
</svg>`;
}

function createMaskableSvg(size) {
  // Maskable: icon must fit within inner 80% circle
  // Use 62% of canvas for the icon to stay well within safe zone
  const available = size * 0.62;
  const scale = available / ICON_VB_H;
  const iconW = ICON_VB_W * scale;
  const iconH = ICON_VB_H * scale;
  const offsetX = (size - iconW) / 2;
  const offsetY = (size - iconH) / 2;

  // No rounded corners for maskable — the OS applies its own mask
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BG_COLOR}"/>
  <g transform="translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})">
    ${ICON_PATH}
  </g>
</svg>`;
}

function createFaviconSvg() {
  // Favicon: no background, just the icon in silver for light/dark adaptability
  return `<svg width="32" height="32" viewBox="0 0 82 85" xmlns="http://www.w3.org/2000/svg">
  ${ICON_PATH}
</svg>`;
}

async function generate() {
  const icons = [
    { name: "icon-192.png", svg: createIconSvg(192, 0.75), size: 192 },
    { name: "icon-512.png", svg: createIconSvg(512, 0.78), size: 512 },
    { name: "icon-512-maskable.png", svg: createMaskableSvg(512), size: 512 },
    { name: "apple-touch-icon.png", svg: createIconSvg(180, 0.78), size: 180 },
  ];

  for (const { name, svg, size } of icons) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(resolve(outDir, name));
    console.log(`  ${name} (${size}x${size})`);
  }

  // Favicon as SVG (modern browsers support it)
  const faviconSvg = createFaviconSvg();
  const { writeFileSync } = await import("fs");
  writeFileSync(resolve(outDir, "favicon.svg"), faviconSvg);
  console.log("  favicon.svg");

  // Also generate 32x32 PNG favicon
  await sharp(Buffer.from(createIconSvg(32, 0.85)))
    .resize(32, 32)
    .png()
    .toFile(resolve(outDir, "favicon-32x32.png"));
  console.log("  favicon-32x32.png (32x32)");

  // Save the logo SVG (wordmark) to public
  const logoSvg = `<svg width="318" height="111" viewBox="0 0 318 111" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M78.3408 77.4336V26.4004H94.0605V31.5859C94.1007 31.5375 94.1401 31.4885 94.1807 31.4404C97.6206 27.2805 102.581 25.2003 109.061 25.2002C111.861 25.2002 114.381 25.6806 116.621 26.6406C118.597 27.4169 120.417 28.6603 122.081 30.3701C122.73 29.9015 123.404 29.4567 124.103 29.04C128.262 26.4802 132.943 25.2002 138.143 25.2002C142.462 25.2003 146.262 26.0408 149.542 27.7207C151.51 28.7045 153.228 29.9094 154.702 31.332V26.4004H170.302V43.9404C170.839 42.562 171.483 41.2348 172.234 39.96C174.954 35.4001 178.635 31.8001 183.274 29.1602C187.914 26.4403 193.074 25.0801 198.754 25.0801C204.354 25.0801 209.275 26.3599 213.515 28.9199C217.835 31.3999 221.195 34.8403 223.595 39.2402C224.134 40.1793 224.614 41.1468 225.036 42.1426V26.4004H240.756V31.8359C242.189 30.3652 243.827 29.1119 245.676 28.0801C249.196 26.1601 253.157 25.2002 257.557 25.2002C261.796 25.2003 265.596 26.2805 268.956 28.4404C271.178 29.816 273.083 31.4905 274.676 33.4609V26.4004H288.236V2.28027H303.956V26.4004H317.516V40.2002H303.956V84.3604H288.236V40.2002H278.482C279.33 42.557 279.756 45.0367 279.756 47.6406V84.3604H264.036V51.1201C264.036 47.6802 262.956 44.8806 260.796 42.7207C258.636 40.5608 255.836 39.4805 252.396 39.4805C250.157 39.4805 248.156 39.9601 246.396 40.9199C244.637 41.8799 243.236 43.2402 242.196 45C241.236 46.7599 240.756 48.8002 240.756 51.1201V84.3604H225.036V60.8438L184.088 60.9443C184.395 62.1398 184.803 63.2654 185.314 64.3203C186.674 66.8803 188.594 68.8803 191.074 70.3203C193.554 71.6803 196.434 72.3603 199.714 72.3604C202.674 72.3604 205.354 71.8799 207.754 70.9199C210.154 69.8799 212.234 68.3603 213.994 66.3604L223.234 75.6006C220.434 78.8805 216.994 81.3601 212.914 83.04C208.914 84.72 204.554 85.5605 199.834 85.5605C193.754 85.5605 188.355 84.2805 183.635 81.7207C178.915 79.0807 175.154 75.4799 172.354 70.9199C171.551 69.5735 170.868 68.1709 170.302 66.7129V81.3604C170.302 87.1204 168.942 92.1204 166.222 96.3604C163.582 100.68 159.902 104.04 155.182 106.44C150.462 108.84 145.022 110.04 138.862 110.04C132.702 110.04 127.262 108.921 122.542 106.681C117.822 104.521 114.062 101.44 111.262 97.4404L121.222 87.4805C123.462 90.1205 125.942 92.1205 128.662 93.4805C131.462 94.9205 134.822 95.6406 138.742 95.6406C143.622 95.6406 147.462 94.3999 150.262 91.9199C153.142 89.44 154.582 86.0005 154.582 81.6006V76.7881C153.108 78.2109 151.39 79.4166 149.422 80.4004C146.142 82.0003 142.382 82.8007 138.143 82.8008C132.943 82.8008 128.262 81.56 124.103 79.0801C119.943 76.5201 116.662 73.0406 114.262 68.6406C111.942 64.2406 110.782 59.3199 110.782 53.8799C110.782 49.6896 111.47 45.8314 112.847 42.3057C111.976 41.3739 110.916 40.6707 109.661 40.2002C108.461 39.7202 107.061 39.4805 105.461 39.4805C102.101 39.4805 99.3407 40.5607 97.1807 42.7207C95.1009 44.8007 94.0606 48.0005 94.0605 52.3203V84.3604H63.7197L57.7803 68.6406H23.0605L17.04 84.3604H0L33.96 0H47.2793L78.3408 77.4336ZM141.262 39.4805C138.382 39.4805 135.862 40.1205 133.702 41.4004C131.542 42.6004 129.862 44.3205 128.662 46.5605C127.462 48.7204 126.862 51.2002 126.862 54C126.862 56.72 127.462 59.2004 128.662 61.4404C129.862 63.6004 131.542 65.3206 133.702 66.6006C135.862 67.8805 138.382 68.5205 141.262 68.5205C144.142 68.5205 146.622 67.9207 148.702 66.7207C150.862 65.4407 152.542 63.7205 153.742 61.5605C154.942 59.3205 155.542 56.8 155.542 54C155.542 51.1202 154.942 48.6003 153.742 46.4404C152.542 44.2804 150.862 42.6004 148.702 41.4004C146.622 40.1204 144.142 39.4805 141.262 39.4805ZM40.6025 15.3604C40.3273 15.3687 40.0359 15.5392 39.9307 15.8174C39.4722 17.0245 37.7109 19.5549 35.6709 22.4863C30.9986 29.1963 24.5999 38.386 24.5996 44.3652C24.5996 53.1848 31.7742 60.3603 40.5938 60.3604C49.4133 60.3604 56.5879 53.1848 56.5879 44.3652C56.5876 38.4826 50.3045 29.4545 45.7168 22.8623C43.5683 19.7758 41.713 17.1094 41.2627 15.833C41.1631 15.5523 40.9002 15.3641 40.6025 15.3604ZM198.754 38.1602C195.634 38.1602 192.915 38.8805 190.595 40.3203C188.275 41.6803 186.474 43.6403 185.194 46.2002C184.746 47.1269 184.381 48.1209 184.101 49.1816L212.156 49.0996C211.84 47.7236 211.413 46.4769 210.874 45.3604C209.834 43.0404 208.274 41.2801 206.194 40.0801C204.194 38.8001 201.714 38.1602 198.754 38.1602Z" fill="#D4D4D8"/>
</svg>`;
  writeFileSync(resolve(outDir, "logo.svg"), logoSvg);
  console.log("  logo.svg (wordmark)");

  // Save the icon SVG
  const iconSvg = `<svg width="82" height="85" viewBox="0 0 82 85" fill="none" xmlns="http://www.w3.org/2000/svg">
${ICON_PATH}
</svg>`;
  writeFileSync(resolve(outDir, "icon.svg"), iconSvg);
  console.log("  icon.svg (standalone)");

  console.log("\nDone! All assets in public/icons/");
}

generate().catch(console.error);
