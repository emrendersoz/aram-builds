// Gerekli kütüphaneleri import et
const Spritesmith = require("spritesmith"); // Sprite sheet oluşturmak için
const fs = require("fs-extra"); // Gelişmiş dosya işlemleri için
const path = require("path"); // Dosya yollarıyla çalışmak için

/**
 * Bu script, Riot Data Dragon'dan tüm item resimlerini indirir,
 * bu resimleri tek bir sprite sheet'te birleştirir ve
 * bu sprite sheet'i kullanmak için gerekli CSS kodunu oluşturur.
 * Sonuçlar direkt olarak frontend/src/assets klasörüne kaydedilir.
 */
async function generateItemSprites() {
  console.log("Sprite oluşturma süreci başlatılıyor...");

  // --- 1. Gerekli Veri ve Dosya Yollarının Tanımlanması ---

  // Riot API'sinden en güncel oyun versiyonunu çekiyoruz.
  // Bu, her zaman en yeni item resimlerini indirmemizi sağlar.
  const versionsResponse = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  if (!versionsResponse.ok) {
    throw new Error("Riot API versiyon bilgisi çekilemedi.");
  }
  const versions = await versionsResponse.json();
  const latestVersion = versions[0];
  console.log(`En güncel oyun versiyonu bulundu: ${latestVersion}`);

  // Daha önce indirdiğimiz item.json dosyasını okuyoruz.
  const itemDataPath = path.join(__dirname, "../data/item.json");
  if (!fs.existsSync(itemDataPath)) {
    console.error(
      "HATA: `item.json` dosyası bulunamadı. Lütfen önce `utils/download-data-dragon.js` scriptini çalıştırın."
    );
    return;
  }
  const itemData = require(itemDataPath);

  // Resimleri geçici olarak saklayacağımız klasörün yolu.
  const tempImageDir = path.join(__dirname, "../data/temp-item-images");

  // Oluşturulacak sprite sheet ve CSS dosyasının frontend'deki konumu.
  const frontendAssetsDir = path.join(__dirname, "../../frontend/src/assets");

  // Gerekli klasörlerin mevcut olduğundan emin oluyoruz, yoksa oluşturuyoruz.
  await fs.ensureDir(tempImageDir);
  await fs.ensureDir(frontendAssetsDir);

  // --- 2. Tüm Item Resimlerini İndirme ---

  console.log(
    `Data Dragon'dan (${latestVersion}) item resimleri indiriliyor...`
  );

  // Tüm indirme işlemlerini bir diziye atıp Promise.all ile paralel olarak çalıştırıyoruz.
  // Bu, işlemi önemli ölçüde hızlandırır.
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
      // Bazı item'ların resmi olmayabilir veya hata oluşabilir, bu durumda uyarı verip devam ediyoruz.
      console.warn(`Uyarı: ${itemId}.png indirilemedi. ${e.message}`);
    }
  });

  await Promise.all(downloadPromises);
  console.log("Tüm item resimleri başarıyla indirildi.");

  // --- 3. Spritesmith ile Sprite Sheet Oluşturma ---

  // Geçici klasördeki tüm resim dosyalarının yollarını alıyoruz.
  const imageFiles = (await fs.readdir(tempImageDir)).map((file) =>
    path.join(tempImageDir, file)
  );

  if (imageFiles.length === 0) {
    console.error("HATA: Sprite oluşturulacak resim bulunamadı.");
    return;
  }

  console.log(`${imageFiles.length} resimden sprite sheet oluşturuluyor...`);

  // Spritesmith'i çalıştırıyoruz.
  Spritesmith.run({ src: imageFiles, padding: 2 }, (err, result) => {
    if (err) {
      throw err;
    }

    // --- 4. Sprite Sheet ve CSS Dosyasını Kaydetme ---

    // Oluşturulan birleşik resmi (sprite sheet) frontend klasörüne kaydediyoruz.
    const spriteSheetPath = path.join(frontendAssetsDir, "item-sprite.png");
    fs.writeFileSync(spriteSheetPath, result.image);
    console.log(`Sprite sheet başarıyla şuraya kaydedildi: ${spriteSheetPath}`);

    // Sprite sheet'in toplam boyutlarını alıyoruz
    const spriteWidth = result.properties.width;
    const spriteHeight = result.properties.height;

    // Orijinal item boyutu (Data Dragon'dan gelen resimler genelde 64x64)
    const originalItemSize = 64;
    // Hedef boyut (frontend'de göstermek istediğimiz boyut)
    const targetItemSize = 36;

    // Ölçekleme oranını hesaplıyoruz
    const scaleRatio = targetItemSize / originalItemSize;
    const scaledSpriteWidth = Math.round(spriteWidth * scaleRatio);
    const scaledSpriteHeight = Math.round(spriteHeight * scaleRatio);

    // Her resmin koordinatlarını kullanarak CSS kodunu oluşturuyoruz.
    const coordinates = result.coordinates;

    // CSS string'ini ölçeklenmiş background-size ile oluşturuyoruz
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

      // Koordinatları da ölçeklendiriyoruz
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

    // --- 5. Temizlik ---

    // Geçici olarak indirdiğimiz tekil resimlerin bulunduğu klasörü siliyoruz.
    fs.remove(tempImageDir);
    console.log("Geçici resim klasörü temizlendi.");
    console.log("\n✅ Sprite oluşturma işlemi başarıyla tamamlandı!");
  });
}

// Script'i çalıştır ve olası hataları yakala
generateItemSprites().catch((error) => {
  console.error("Sprite oluşturma sırasında kritik bir hata oluştu:", error);
});
