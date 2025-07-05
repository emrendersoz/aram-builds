const Spritesmith = require("spritesmith");
const fs = require("fs-extra");
const path = require("path");

async function generateSpellSprites() {
  console.log("Sihirdar Büyüsü sprite oluşturma süreci başlatılıyor...");

  const versionsResponse = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  if (!versionsResponse.ok) {
    throw new Error("Riot API versiyon bilgisi çekilemedi.");
  }
  const versions = await versionsResponse.json();
  const latestVersion = versions[0];
  console.log(`En güncel oyun versiyonu bulundu: ${latestVersion}`);

  const summonerData = require("../data/summoner.json");
  const tempImageDir = path.join(__dirname, "../data/temp-spell-images");
  const frontendAssetsDir = path.join(__dirname, "../../frontend/src/assets");

  await fs.ensureDir(tempImageDir);
  await fs.ensureDir(frontendAssetsDir);

  console.log(
    `Data Dragon'dan (${latestVersion}) sihirdar büyüsü resimleri indiriliyor...`
  );

  const downloadPromises = Object.values(summonerData.data).map(
    async (spell) => {
      const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${spell.image.full}`;

      const imagePath = path.join(tempImageDir, `${spell.key}.png`);

      try {
        const response = await fetch(imageUrl);
        if (!response.ok)
          throw new Error(`Sunucudan alınamadı (${response.status})`);

        const buffer = await response.arrayBuffer();
        await fs.writeFile(imagePath, Buffer.from(buffer));
      } catch (e) {
        console.warn(
          `Uyarı: Spell ${spell.key} (${spell.name}) indirilemedi. ${e.message}`
        );
      }
    }
  );

  await Promise.all(downloadPromises);
  console.log("Sihirdar Büyüsü resimleri indirildi.");

  const imageFiles = (await fs.readdir(tempImageDir)).map((file) =>
    path.join(tempImageDir, file)
  );

  if (imageFiles.length === 0) {
    console.error("HATA: Sprite oluşturulacak spell resmi bulunamadı.");
    return;
  }

  console.log(
    `${imageFiles.length} spell resimden sprite sheet oluşturuluyor...`
  );

  Spritesmith.run({ src: imageFiles, padding: 2 }, (err, result) => {
    if (err) throw err;

    const spriteSheetPath = path.join(frontendAssetsDir, "spell-sprite.png");
    fs.writeFileSync(spriteSheetPath, result.image);
    console.log(
      `Spell sprite sheet başarıyla şuraya kaydedildi: ${spriteSheetPath}`
    );

    const spriteWidth = result.properties.width;
    const spriteHeight = result.properties.height;

    const targetSpellSize = 36;

    const firstImageKey = Object.keys(result.coordinates)[0];
    const firstImageCoords = result.coordinates[firstImageKey];
    const originalSpellSize = firstImageCoords.width;

    const scaleX = (spriteWidth * targetSpellSize) / spriteWidth;
    const scaleY = (spriteHeight * targetSpellSize) / spriteHeight;

    const scaledSpriteWidth =
      (spriteWidth * targetSpellSize) / originalSpellSize;
    const scaledSpriteHeight =
      (spriteHeight * targetSpellSize) / originalSpellSize;

    let cssString = `.spell-sprite { 
  background-image: url('./spell-sprite.png'); 
  background-repeat: no-repeat; 
  display: inline-block; 
  width: ${targetSpellSize}px; 
  height: ${targetSpellSize}px; 
  background-size: ${scaledSpriteWidth}px ${scaledSpriteHeight}px;
  border-radius: 4px;
}\n\n`;

    for (const file in result.coordinates) {
      const id = path.basename(file, ".png");
      const { x, y } = result.coordinates[file];

      const scaledX = (x * targetSpellSize) / originalSpellSize;
      const scaledY = (y * targetSpellSize) / originalSpellSize;

      cssString += `.spell-${id} { background-position: -${scaledX}px -${scaledY}px; }\n`;
    }

    const cssPath = path.join(frontendAssetsDir, "spell-sprite.css");
    fs.writeFileSync(cssPath, cssString);
    console.log(
      `Spell sprite CSS dosyası başarıyla şuraya kaydedildi: ${cssPath}`
    );
    console.log(`Spell sprite boyutları: ${spriteWidth}x${spriteHeight}px`);
    console.log(
      `Orijinal spell boyutu: ${originalSpellSize}x${originalSpellSize}px`
    );
    console.log(
      `Ölçeklenmiş sprite boyutları: ${scaledSpriteWidth}x${scaledSpriteHeight}px`
    );

    fs.remove(tempImageDir);
    console.log("Geçici spell resim klasörü temizlendi.");
    console.log("✅ Sihirdar Büyüsü sprite oluşturma tamamlandı!");
  });
}

generateSpellSprites().catch((error) => {
  console.error(
    "Spell sprite oluşturma sırasında kritik bir hata oluştu:",
    error
  );
});
