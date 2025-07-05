const Spritesmith = require("spritesmith");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

async function generateRuneSprites() {
  console.log("Rün sprite oluşturma süreci başlatılıyor...");

  const runeData = require("../data/runesReforged.json");
  const tempImageDir = path.join(__dirname, "../data/temp-rune-images");
  const frontendAssetsDir = path.join(__dirname, "../../frontend/src/assets");

  await fs.ensureDir(tempImageDir);
  await fs.ensureDir(frontendAssetsDir);

  const keystoneIds = new Set();
  runeData.forEach((runePath) => {
    if (runePath.slots[0]) {
      runePath.slots[0].runes.forEach((rune) =>
        keystoneIds.add(String(rune.id))
      );
    }
  });

  const allRunes = [];
  runeData.forEach((runePath) => {
    allRunes.push({ id: runePath.id, icon: runePath.icon });
    runePath.slots.forEach((slot) => {
      slot.runes.forEach((rune) =>
        allRunes.push({ id: rune.id, icon: rune.icon })
      );
    });
  });

  const processPromises = allRunes.map(async (rune) => {
    try {
      const imageUrl = `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
      const imagePath = path.join(tempImageDir, `${rune.id}.png`);

      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("İndirilemedi");

      const buffer = await response.arrayBuffer();

      const targetSize = keystoneIds.has(String(rune.id)) ? 52 : 24;

      await sharp(buffer).resize(targetSize, targetSize).toFile(imagePath);
    } catch (e) {}
  });

  await Promise.all(processPromises);
  console.log("Tüm rün resimleri indirilip standart boyutlara getirildi.");

  const imageFiles = (await fs.readdir(tempImageDir)).map((file) =>
    path.join(tempImageDir, file)
  );
  Spritesmith.run({ src: imageFiles, padding: 2 }, (err, result) => {
    if (err) throw err;

    const spriteSheetFilename = "rune-sprite.png";
    const cssFilename = "rune-sprite.css";

    fs.writeFileSync(
      path.join(frontendAssetsDir, spriteSheetFilename),
      result.image
    );

    const { width: sheetWidth, height: sheetHeight } = result.properties;

    let cssString = `.rune-sprite {
  background-image: url('${spriteSheetFilename}');
  background-repeat: no-repeat;
  display: inline-block;
  background-size: ${sheetWidth}px ${sheetHeight}px;
}\n\n`;

    for (const file in result.coordinates) {
      const id = path.basename(file, ".png");
      const { x, y } = result.coordinates[file];
      const size = keystoneIds.has(id) ? 52 : 24;

      cssString += `.rune-${id} {
  background-position: -${x}px -${y}px;
  width: ${size}px;
  height: ${size}px;
}\n`;
    }

    fs.writeFileSync(path.join(frontendAssetsDir, cssFilename), cssString);
    fs.remove(tempImageDir);
    console.log(
      "✅ Yeniden boyutlandırılmış resimlerden sprite sheet ve CSS başarıyla oluşturuldu!"
    );
  });
}

generateRuneSprites().catch((error) => console.error("Kritik hata:", error));
