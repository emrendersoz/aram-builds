const fs = require("fs-extra");
const path = require("path");
const { scrapeMetasrc } = require("./scrapers/metasrc");
const { scrapeLolalytics } = require("./scrapers/lolalytics");
const { scrapeMurderbridge } = require("./scrapers/murderbridge");
const { scrapeMobalytics } = require("./scrapers/mobalytics");
const { scrapeUgg } = require("./scrapers/ugg");

// Diğer scraper'lar gelecekte buraya eklenecek.

async function runAllScrapers() {
  console.log("--- Tam scrape süreci başlatılıyor ---");

  const championData = require("./data/champion.json");
  const champions = Object.keys(championData.data);

  const allBuilds = {};

  // Hızlı test için şimdilik sadece birkaç şampiyon kullanalım.
  // Zed'i de ekleyerek test edelim!
  const testChampions = ["Zed"];

  for (const championName of testChampions) {
    // Tam sürüm için 'champions' listesini kullanacağız
    console.log(`\nVeri çekiliyor: ${championName}`);
    const buildsForChampion = {};

    // --- U.GG Scraper --- (Yeni eklenen)
    try {
      const uggData = await scrapeUgg(championName);
      if (uggData && !uggData.error) {
        buildsForChampion.ugg_aram = uggData;
        console.log(`- Başarılı: U.GG (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(`- U.GG için kritik hata: ${error.message}`);
    }

    // --- MetaSRC Scraper ---
    try {
      const metasrcData = await scrapeMetasrc(championName);
      if (metasrcData && !metasrcData.error) {
        buildsForChampion.metasrc_aram = metasrcData;
        console.log(`- Başarılı: MetaSRC (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(`- MetaSRC için kritik hata: ${error.message}`);
    }

    // --- Lolalytics Scraper ---
    try {
      const lolalyticsData = await scrapeLolalytics(championName);
      if (lolalyticsData && !lolalyticsData.error) {
        buildsForChampion.lolalytics_aram = lolalyticsData;
        console.log(`- Başarılı: Lolalytics (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(`- Lolalytics için kritik hata: ${error.message}`);
    }

    // --- Murderbridge Scraper ---
    try {
      const murderbridgeData = await scrapeMurderbridge(championName);
      if (murderbridgeData && !murderbridgeData.error) {
        buildsForChampion.murderbridge_aram = murderbridgeData;
        console.log(`- Başarılı: Murderbridge (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(`- Murderbridge için kritik hata: ${error.message}`);
    }

    // --- Mobalytics Scraper ---
    try {
      const mobalyticsData = await scrapeMobalytics(championName);
      if (mobalyticsData && !mobalyticsData.error) {
        buildsForChampion.mobalytics_aram = mobalyticsData;
        console.log(`- Başarılı: Mobalytics (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(`- Mobalytics için kritik hata: ${error.message}`);
    }

    allBuilds[championName] = buildsForChampion;
  }

  const outputPath = path.join(__dirname, "./data/builds.json");
  await fs.writeJson(outputPath, allBuilds, { spaces: 2 });

  console.log(
    `\n--- Scrape süreci tamamlandı. Veriler şuraya kaydedildi: ${outputPath} ---`
  );
}

// Bu script direkt çalıştırılırsa fonksiyonu çağır.
if (require.main === module) {
  runAllScrapers();
}

module.exports = { runAllScrapers };
