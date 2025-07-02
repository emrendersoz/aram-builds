const fs = require("fs-extra");
const path = require("path");
const { scrapeMetasrc } = require("./scrapers/metasrc");
const { scrapeLolalytics } = require("./scrapers/lolalytics");
const { scrapeMurderbridge } = require("./scrapers/murderbridge");
const { scrapeMobalytics } = require("./scrapers/mobalytics");
const { scrapeUgg } = require("./scrapers/ugg");
const { scrapeUggStats } = require("./scrapers/uggstats");
const { scrapeUggSkills } = require("./scrapers/uggskills");

/**
 * Şampiyon adını çoğu web sitesinin kullandığı genel URL formatına dönüştürür.
 * (birleşik, küçük harf, özel karaktersiz)
 * Örnekler: MissFortune -> missfortune, DrMundo -> drmundo
 * @param {string} championName - champion.json'dan gelen orijinal şampiyon adı.
 * @returns {string} Genel URL için temizlenmiş şampiyon adı.
 */
function normalizeChampionNameForUrl(championName) {
  const specialCases = {
    MonkeyKing: "wukong",
  };
  if (specialCases[championName]) {
    return specialCases[championName];
  }
  return championName
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "");
}

/**
 * Şampiyon adını MetaSRC sitesinin kullandığı özel URL formatına dönüştürür.
 * (tireli, küçük harf)
 * Örnekler: MissFortune -> miss-fortune, DrMundo -> dr-mundo
 * @param {string} championName - champion.json'dan gelen orijinal şampiyon adı.
 * @returns {string} MetaSRC URL'si için temizlenmiş şampiyon adı.
 */
function normalizeForMetasrc(championName) {
  const specialCases = {
    MonkeyKing: "wukong",
  };
  if (specialCases[championName]) {
    return specialCases[championName];
  }
  // CamelCase (örn: MissFortune) isimlendirmeyi tireli (örn: miss-fortune) hale getirir.
  const hyphenated = championName
    .replace(/([a-z])([A-Z])/g, "$1-$2") // Küçük harfi takip eden büyük harf arasına tire koy
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\./g, "");

  return hyphenated;
}

async function runAllScrapers() {
  console.log("--- Tam scrape süreci başlatılıyor ---");

  const championData = require("./data/champion.json");
  const champions = Object.keys(championData.data);

  console.log(
    `${champions.length} şampiyon için veri çekme işlemi başlatılıyor...`
  );

  const allBuilds = {};
  const allStats = {};
  const allSkills = {};

  for (const championName of champions) {
    // Genel kullanım için şampiyon adını normalleştir (missfortune)
    const normalizedName = normalizeChampionNameForUrl(championName);
    // MetaSRC'ye özel şampiyon adını normalleştir (miss-fortune)
    const metasrcName = normalizeForMetasrc(championName);

    console.log(
      `\nVeri çekiliyor: ${championName} (Genel: ${normalizedName}, MetaSRC: ${metasrcName})`
    );
    const buildsForChampion = {};

    // --- U.GG, Lolalytics, Mobalytics vb. (Genel formatı kullananlar) ---
    try {
      const uggStatsData = await scrapeUggStats(normalizedName);
      if (uggStatsData && !uggStatsData.error) {
        allStats[championName] = uggStatsData;
        console.log(`- Başarılı: U.GG Stats verisi alındı.`);
      }
    } catch (error) {
      console.error(
        `- HATA: U.GG Stats için (${championName}): ${error.message}`
      );
    }

    try {
      const uggSkillsData = await scrapeUggSkills(normalizedName);
      if (uggSkillsData && !uggSkillsData.error) {
        allSkills[championName] = uggSkillsData;
        console.log(`- Başarılı: U.GG Skills verisi alındı.`);
      }
    } catch (error) {
      console.error(
        `- HATA: U.GG Skills için (${championName}): ${error.message}`
      );
    }

    try {
      const uggData = await scrapeUgg(normalizedName);
      if (uggData && !uggData.error) {
        buildsForChampion.ugg_aram = uggData;
        console.log(`- Başarılı: U.GG (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(`- HATA: U.GG için (${championName}): ${error.message}`);
    }

    try {
      const lolalyticsData = await scrapeLolalytics(normalizedName);
      if (lolalyticsData && !lolalyticsData.error) {
        buildsForChampion.lolalytics_aram = lolalyticsData;
        console.log(`- Başarılı: Lolalytics (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(
        `- HATA: Lolalytics için (${championName}): ${error.message}`
      );
    }

    try {
      const murderbridgeData = await scrapeMurderbridge(normalizedName);
      if (murderbridgeData && !murderbridgeData.error) {
        buildsForChampion.murderbridge_aram = murderbridgeData;
        console.log(`- Başarılı: Murderbridge (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(
        `- HATA: Murderbridge için (${championName}): ${error.message}`
      );
    }

    try {
      const mobalyticsData = await scrapeMobalytics(normalizedName);
      if (mobalyticsData && !mobalyticsData.error) {
        buildsForChampion.mobalytics_aram = mobalyticsData;
        console.log(`- Başarılı: Mobalytics (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(
        `- HATA: Mobalytics için (${championName}): ${error.message}`
      );
    }

    // --- MetaSRC Scraper (Özel formatı kullanan) ---
    try {
      // MetaSRC için özel olarak formatlanmış adı kullan
      const metasrcData = await scrapeMetasrc(metasrcName);
      if (metasrcData && !metasrcData.error) {
        buildsForChampion.metasrc_aram = metasrcData;
        console.log(`- Başarılı: MetaSRC (ARAM) verisi alındı.`);
      }
    } catch (error) {
      console.error(`- HATA: MetaSRC için (${championName}): ${error.message}`);
    }

    allBuilds[championName] = buildsForChampion;
  }

  // Dosyaları kaydetme işlemleri...
  const buildsOutputPath = path.join(__dirname, "./data/builds.json");
  await fs.writeJson(buildsOutputPath, allBuilds, { spaces: 2 });
  const statsOutputPath = path.join(__dirname, "./data/stats.json");
  await fs.writeJson(statsOutputPath, allStats, { spaces: 2 });
  const skillsOutputPath = path.join(__dirname, "./data/skills.json");
  await fs.writeJson(skillsOutputPath, allSkills, { spaces: 2 });

  console.log(`\n--- Scrape süreci tamamlandı ---`);
  console.log(`Builds verisi şuraya kaydedildi: ${buildsOutputPath}`);
  console.log(`Stats verisi şuraya kaydedildi: ${statsOutputPath}`);
  console.log(`Skills verisi şuraya kaydedildi: ${skillsOutputPath}`);
}

if (require.main === module) {
  runAllScrapers();
}

module.exports = { runAllScrapers };
