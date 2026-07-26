const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const demoDirectory = path.resolve(__dirname, "generated");
const workspaceDirectory = path.join(demoDirectory, "ContextDeck Demo");
const projectAssetsDirectory = path.join(
  workspaceDirectory,
  "02 - Project Assets",
);
const logoPath = path.resolve(__dirname, "..", "..", "logo.png");

async function main() {
  fs.mkdirSync(projectAssetsDirectory, {recursive: true});

  await sharp({
    create: {
      width: 2560,
      height: 2160,
      channels: 3,
      background: "#060b16",
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg xmlns="http://www.w3.org/2000/svg" width="2560" height="2160">
            <defs>
              <radialGradient id="a" cx="34%" cy="20%" r="65%">
                <stop offset="0" stop-color="#0e7490" stop-opacity=".28"/>
                <stop offset=".55" stop-color="#172554" stop-opacity=".16"/>
                <stop offset="1" stop-color="#020617" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="b" cx="82%" cy="78%" r="58%">
                <stop offset="0" stop-color="#6d28d9" stop-opacity=".22"/>
                <stop offset=".7" stop-color="#020617" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="2560" height="2160" fill="url(#a)"/>
            <rect width="2560" height="2160" fill="url(#b)"/>
            <path d="M0 1680C520 1430 860 1480 1240 1685S2050 1940 2560 1640V2160H0Z"
                  fill="#0f172a" fill-opacity=".4"/>
          </svg>`),
      },
    ])
    .jpeg({quality: 92, chromaSubsampling: "4:4:4"})
    .toFile(path.join(demoDirectory, "neutral-desktop.jpg"));

  const logo = await sharp(logoPath)
    .resize(360, 360, {fit: "contain"})
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 4,
      background: "#050914",
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#06b6d4"/>
                <stop offset=".5" stop-color="#2563eb"/>
                <stop offset="1" stop-color="#7c3aed"/>
              </linearGradient>
              <radialGradient id="r">
                <stop offset="0" stop-color="#2563eb" stop-opacity=".34"/>
                <stop offset="1" stop-color="#020617" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="1200" height="800" fill="#050914"/>
            <circle cx="600" cy="350" r="460" fill="url(#r)"/>
            <rect x="55" y="55" width="1090" height="690" rx="46" fill="none"
                  stroke="url(#g)" stroke-width="4"/>
            <text x="600" y="640" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif"
                  font-size="70" font-weight="800" fill="white">ContextDeck</text>
            <text x="600" y="700" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif"
                  font-size="28" font-weight="600" letter-spacing="5" fill="#67e8f9">
              IMAGE SELECTION DEMO
            </text>
          </svg>`),
      },
      {input: logo, left: 420, top: 120},
    ])
    .png()
    .toFile(path.join(workspaceDirectory, "03 - Product Mockup.png"));

  fs.writeFileSync(
    path.join(workspaceDirectory, "01 - ContextDeck Notes.txt"),
    [
      "ContextDeck moderator demonstration",
      "",
      "Selecting this document activates the File profile.",
      "The profile and its actions remain fully configurable by the user.",
      "",
    ].join("\r\n"),
    "utf8",
  );
  fs.writeFileSync(
    path.join(projectAssetsDirectory, "README.txt"),
    "Selecting the Project Assets directory activates the Folder profile.\r\n",
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        wallpaper: path.join(demoDirectory, "neutral-desktop.jpg"),
        workspace: workspaceDirectory,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
