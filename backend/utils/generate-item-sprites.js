const Spritesmith = require("spritesmith");
const fs = require("fs-extra");
const path = require("path");

async function generateItemSprites() {
  console.log("Sprite oluşturma süreci başlatılıyor...");

  const versionsResponse = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  if (!versionsResponse.ok) {
    throw new Error("Riot API versiyon bilgisi çekilemedi.");
  }
  const versions = await versionsResponse.json();
  const latestVersion = versions[0];
  console.log(`En güncel oyun versiyonu bulundu: ${latestVersion}`);

  const itemDataPath = path.join(__dirname, "../data/item.json");
  if (!fs.existsSync(itemDataPath)) {
    console.error(
      "HATA: `item.json` dosyası bulunamadı. Lütfen önce `utils/download-data-dragon.js` scriptini çalıştırın."
    );
    return;
  }
  const itemData = require(itemDataPath);

  const tempImageDir = path.join(__dirname, "../data/temp-item-images");

  const frontendAssetsDir = path.join(__dirname, "../../frontend/src/assets");

  await fs.ensureDir(tempImageDir);
  await fs.ensureDir(frontendAssetsDir);

  console.log(
    `Data Dragon'dan (${latestVersion}) item resimleri indiriliyor...`
  );

  const downloadPromises = Object.keys(itemData.data).map(async (itemId) => {
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${itemId}.png`;
    const imagePath = path.join(tempImageDir, `${itemId}.png`);

    try {
      const response = await fetch(imageUrl);
      if (!response.ok)
        throw new Error(`Sunucudan alınamadı (${response.status})`);

      const buffer = await response.arrayBuffer();
      await fs.writeFile(imagePath, Buffer.from(buffer));
    } catch (e) {
      console.warn(`Uyarı: ${itemId}.png indirilemedi. ${e.message}`);
    }
  });

  await Promise.all(downloadPromises);
  console.log("Tüm item resimleri başarıyla indirildi.");

  const imageFiles = (await fs.readdir(tempImageDir)).map((file) =>
    path.join(tempImageDir, file)
  );

  if (imageFiles.length === 0) {
    console.error("HATA: Sprite oluşturulacak resim bulunamadı.");
    return;
  }

  console.log(`${imageFiles.length} resimden sprite sheet oluşturuluyor...`);

  Spritesmith.run({ src: imageFiles, padding: 2 }, (err, result) => {
    if (err) {
      throw err;
    }

    const spriteSheetPath = path.join(frontendAssetsDir, "item-sprite.png");
    fs.writeFileSync(spriteSheetPath, result.image);
    console.log(`Sprite sheet başarıyla şuraya kaydedildi: ${spriteSheetPath}`);

    const spriteWidth = result.properties.width;
    const spriteHeight = result.properties.height;

    const originalItemSize = 64;

    const targetItemSize = 36;

    const scaleRatio = targetItemSize / originalItemSize;
    const scaledSpriteWidth = Math.round(spriteWidth * scaleRatio);
    const scaledSpriteHeight = Math.round(spriteHeight * scaleRatio);

    const coordinates = result.coordinates;

    let cssString = `.item-sprite { 
  background-image: url('./item-sprite.png'); 
  background-repeat: no-repeat; 
  display: inline-block; 
  width: ${targetItemSize}px; 
  height: ${targetItemSize}px; 
  background-size: ${scaledSpriteWidth}px ${scaledSpriteHeight}px;
  
}\n\n`;

    for (const file in coordinates) {
      const itemId = path.basename(file, ".png");
      const { x, y } = coordinates[file];

      const scaledX = Math.round(x * scaleRatio);
      const scaledY = Math.round(y * scaleRatio);

      cssString += `.item-${itemId} { background-position: -${scaledX}px -${scaledY}px; }\n`;
    }

    const cssPath = path.join(frontendAssetsDir, "item-sprite.css");
    fs.writeFileSync(cssPath, cssString);
    console.log(`Sprite CSS dosyası başarıyla şuraya kaydedildi: ${cssPath}`);
    console.log(`Orijinal sprite boyutları: ${spriteWidth}x${spriteHeight}px`);
    console.log(
      `Ölçeklenmiş sprite boyutları: ${scaledSpriteWidth}x${scaledSpriteHeight}px`
    );
    console.log(`Ölçekleme oranı: ${scaleRatio}`);

    fs.remove(tempImageDir);
    console.log("Geçici resim klasörü temizlendi.");
    console.log("\n✅ Sprite oluşturma işlemi başarıyla tamamlandı!");
  });
}

generateItemSprites().catch((error) => {
  console.error("Sprite oluşturma sırasında kritik bir hata oluştu:", error);
});
