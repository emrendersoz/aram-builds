const Spritesmith = require("spritesmith");
const fs = require("fs-extra");
const path = require("path");

async function generateChampionSprites() {
  console.log("Şampiyon sprite oluşturma süreci başlatılıyor...");

  const versionsResponse = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  if (!versionsResponse.ok) {
    throw new Error("Riot API versiyon bilgisi çekilemedi.");
  }
  const versions = await versionsResponse.json();
  const latestVersion = versions[0];
  console.log(`En güncel oyun versiyonu bulundu: ${latestVersion}`);

  const championDataPath = path.join(__dirname, "../data/champion.json");
  if (!fs.existsSync(championDataPath)) {
    console.error(
      "HATA: `champion.json` dosyası bulunamadı. Lütfen önce `utils/download-data-dragon.js` benzeri bir script ile şampiyon verilerini indirin."
    );
    return;
  }
  const championData = require(championDataPath);
  const champions = championData.data;

  const tempImageDir = path.join(__dirname, "../data/temp-champion-images");
  const frontendAssetsDir = path.join(__dirname, "../../frontend/src/assets");
  await fs.ensureDir(tempImageDir);
  await fs.ensureDir(frontendAssetsDir);

  console.log(
    `Data Dragon'dan (${latestVersion}) şampiyon görselleri indiriliyor...`
  );

  const downloadPromises = Object.values(champions).map(async (champion) => {
    const championId = champion.id;
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${championId}.png`;
    const imagePath = path.join(tempImageDir, `${championId}.png`);

    try {
      const response = await fetch(imageUrl);
      if (!response.ok)
        throw new Error(`Sunucudan alınamadı (${response.status})`);

      const buffer = await response.arrayBuffer();
      await fs.writeFile(imagePath, Buffer.from(buffer));
    } catch (e) {
      console.warn(`Uyarı: ${championId}.png indirilemedi. ${e.message}`);
    }
  });

  await Promise.all(downloadPromises);
  console.log("Tüm şampiyon görselleri başarıyla indirildi.");

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

    const spriteSheetPath = path.join(frontendAssetsDir, "champion-sprite.png");
    fs.writeFileSync(spriteSheetPath, result.image);
    console.log(`Sprite sheet başarıyla şuraya kaydedildi: ${spriteSheetPath}`);

    const spriteWidth = result.properties.width;
    const spriteHeight = result.properties.height;

    const originalItemSize = 120;
    const targetItemSize = 56;

    const scaleRatio = targetItemSize / originalItemSize;
    const scaledSpriteWidth = Math.round(spriteWidth * scaleRatio);
    const scaledSpriteHeight = Math.round(spriteHeight * scaleRatio);

    const coordinates = result.coordinates;

    let cssString = `.champion-sprite { 
  background-image: url('./champion-sprite.png'); 
  background-repeat: no-repeat; 
  display: inline-block; 
  width: ${targetItemSize}px; 
  height: ${targetItemSize}px; 
  background-size: ${scaledSpriteWidth}px ${scaledSpriteHeight}px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}\n\n`;

    for (const file in coordinates) {
      const championId = path.basename(file, ".png");
      const { x, y } = coordinates[file];

      const scaledX = Math.round(x * scaleRatio);
      const scaledY = Math.round(y * scaleRatio);

      cssString += `.champion-${championId} { background-position: -${scaledX}px -${scaledY}px; }\n`;
    }

    const cssPath = path.join(frontendAssetsDir, "champion-sprite.css");
    fs.writeFileSync(cssPath, cssString);
    console.log(`Sprite CSS dosyası başarıyla şuraya kaydedildi: ${cssPath}`);
    console.log(`Orijinal sprite boyutları: ${spriteWidth}x${spriteHeight}px`);
    console.log(
      `Ölçeklenmiş sprite boyutları: ${scaledSpriteWidth}x${scaledSpriteHeight}px`
    );
    console.log(`Ölçekleme oranı: ${scaleRatio}`);

    fs.remove(tempImageDir);
    console.log("Geçici resim klasörü temizlendi.");
    console.log("\n✅ Şampiyon sprite oluşturma işlemi başarıyla tamamlandı!");
  });
}

generateChampionSprites().catch((error) => {
  console.error("Sprite oluşturma sırasında kritik bir hata oluştu:", error);
});
