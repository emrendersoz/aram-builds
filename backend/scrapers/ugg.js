// scrapers/ugg.js
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

// DATA FILES
const itemJson = require("../data/item.json");
const summonerJson = require("../data/summoner.json");
const runesJson = require("../data/runesReforged.json");

// --- START: NAME-TO-ID MAPPING ---

// Item Data (Mevcut kodunuz)
const itemEntries = Object.entries(itemJson.data);
const itemData = itemEntries.map(([id, item]) => ({
  id: parseInt(id),
  name: item.name,
}));

// Summoner Spell Name -> ID Map
// Örn: { "SummonerFlash": "4", "SummonerSnowball": "32" }
const spellNameToIdMap = Object.values(summonerJson.data).reduce(
  (acc, spell) => {
    acc[spell.id] = spell.key;
    return acc;
  },
  {}
);

// Rune Name -> ID Map
// Örn: { "Electrocute": 8112, "DarkHarvest": 8128, ... }
const runeNameToIdMap = {};
runesJson.forEach((path) => {
  path.slots.forEach((slot) => {
    slot.runes.forEach((rune) => {
      runeNameToIdMap[rune.key] = rune.id.toString();
    });
  });
});

// -- İSTEK ÜZERİNE SHARD'LAR DEVRE DIŞI BIRAKILDI --
// Stat Shard'ları (küçük rünler) manuel olarak ekliyoruz çünkü runesReforged.json'da yoklar.
// U.GG'den çekilen isimlere göre eşleştirme yapıyoruz.
/*
const manualShardMap = {
    'StatModsAdaptiveForce': '5008',
    'AdaptiveForce': '5008',
    'StatModsAttackSpeed': '5005',
    'AttackSpeed': '5005',
    'StatModsCDRScaling': '5007',
    'CDRScaling': '5007',
    'StatModsArmor': '5002',
    'Armor': '5002',
    'StatModsMagicRes': '5003',
    'MagicResist': '5003',
    'StatModsHealthScaling': '5001',
    'Health': '5001',
};
Object.assign(runeNameToIdMap, manualShardMap);
*/
// -- BİTİŞ --

// --- END: NAME-TO-ID MAPPING ---

async function scrapeUgg(championName) {
  const url = `https://u.gg/lol/champions/aram/${championName.toLowerCase()}-aram`;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // User agent ekle (bot detection'ı önlemek için)
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  try {
    console.log(`Sayfa açılıyor: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Sayfanın tamamen yüklenmesi için bekle
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Item çekme kısmı
    const itemElements = await page.$$(
      'div[style*="background-image"][style*="sprite/item"]'
    );
    console.log(
      `Toplam ${itemElements.length} item bulundu. Hover başlıyor...\n`
    );
    const itemResults = [];
    const unmatched = [];
    for (const [i, item] of itemElements.entries()) {
      try {
        await item.hover();
        await new Promise((resolve) => setTimeout(resolve, 300));
        const name = await page.evaluate(
          () =>
            document
              .querySelector("#tooltip-portal .tooltip-item .name")
              ?.textContent.trim() || null
        );
        if (name) {
          const normalize = (str) =>
            str
              .toLowerCase()
              .replace(/'/g, "'")
              .replace(/[^\w\s']/g, "")
              .trim();
          const match = itemData.find(
            (i) => normalize(i.name) === normalize(name)
          );
          if (match) {
            itemResults.push({ name, itemId: match.id });
            console.log(`✅ EŞLEŞTİ: ${name} → ${match.id}`);
          } else {
            unmatched.push(name);
            console.log(`⚠️  EŞLEŞEMEDİ: ${name}`);
          }
        } else {
          console.log(`⛔ Tooltip bulunamadı (#${i + 1})`);
        }
      } catch (err) {
        console.warn(`HATA (item ${i + 1}):`, err.message);
      }
    }
    console.log("\n=== Item Özet ===");
    console.log(`Toplam eşleşen: ${itemResults.length}`);
    if (unmatched.length > 0) {
      console.log("\n🔎 Eşleşemeyen item isimleri:");
      unmatched.forEach((name) => console.log(" - " + name));
    }

    // Rünleri çek
    console.log("\n=== Rünler Çekiliyor ===");
    const runesData = await scrapeRunes(page);

    // Summoner spell'leri çek
    console.log("\n=== Summoner Spells Çekiliyor ===");
    const spellsData = await scrapeSpells(page);

    // Item build'i kategorize et
    const buildData = categorizeBuild(itemResults);

    // Return ifadesi - runes ve spells eklendi
    return {
      site: "U.GG",
      ...buildData,
      runes: runesData,
      spells: spellsData,
    };
  } catch (err) {
    console.error("Scraping hatası:", err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

// Rünleri çeken fonksiyon
async function scrapeRunes(page) {
  try {
    const runesDataByName = await page.evaluate(() => {
      const results = {
        primary: new Set(),
        secondary: new Set(),
        keystone: new Set(),
        // -- İSTEK ÜZERİNE PERK VE SHARD'LAR DEVRE DIŞI BIRAKILDI --
        // perks: new Set(),
        // shards: new Set(),
        // -- BİTİŞ --
      };

      // Primary ve Secondary rune tree'leri çek
      const runeTreeImages = document.querySelectorAll(
        'img[src*="/lol/runes/"][alt*="The Rune Tree"]'
      );
      runeTreeImages.forEach((img, index) => {
        const src = img.src;
        const treeId = src.match(/\/(\d+)\.png$/)?.[1];
        if (treeId) {
          if (index === 0) {
            results.primary.add(treeId);
          } else if (index === 1) {
            results.secondary.add(treeId);
          }
        }
      });

      // Keystone rün çek (perk-active olan)
      const keystoneContainers = document.querySelectorAll(
        ".perk.keystone.perk-active"
      );
      keystoneContainers.forEach((container) => {
        const img = container.querySelector('img[alt*="The Keystone"]');
        if (img) {
          const src = img.src;
          const keystoneName = src.match(/\/([^\/]+)\.png$/)?.[1];
          if (keystoneName) {
            results.keystone.add(keystoneName);
          }
        }
      });

      // -- İSTEK ÜZERİNE PERK VE SHARD'LAR DEVRE DIŞI BIRAKILDI --
      /*
      // Diğer rünleri çek (perk-active olanlar, keystone olmayanlar)
      const perkContainers = document.querySelectorAll(
        ".perk.perk-active:not(.keystone)"
      );
      perkContainers.forEach((container) => {
        const img = container.querySelector('img[alt*="The Rune"]');
        if (img) {
          const src = img.src;
          const perkName = src.match(/\/([^\/]+)\.png$/)?.[1];
          if (perkName) {
            results.perks.add(perkName);
          }
        }
      });

      // Shard rünleri çek (shard-active olanlar)
      const shardContainers = document.querySelectorAll(".shard.shard-active");
      shardContainers.forEach((container) => {
        const img = container.querySelector('img[alt*="Shard"]');
        if (img) {
          const src = img.src;
          const shardName = src.match(/\/([^\/]+)\.webp$/)?.[1];
          if (shardName) {
            results.shards.add(shardName);
          }
        }
      });
      */
      // -- BİTİŞ --

      // Set'leri array'e çevir
      return {
        primary: Array.from(results.primary),
        secondary: Array.from(results.secondary),
        keystone: Array.from(results.keystone),
        // perks: Array.from(results.perks || []),
        // shards: Array.from(results.shards || []),
      };
    });

    // --- YENİ KISIM: İSİMLERİ ID'LERE ÇEVİR ---
    const mapToId = (name) => {
      const id = runeNameToIdMap[name];
      if (!id) console.warn(`⚠️ Eşleşemeyen Rün/Shard Adı: ${name}`);
      return id;
    };

    const runesData = {
      primary: runesDataByName.primary, // Zaten ID olarak geliyor
      secondary: runesDataByName.secondary, // Zaten ID olarak geliyor
      keystone: runesDataByName.keystone.map(mapToId).filter(Boolean),
      // -- İSTEK ÜZERİNE PERK VE SHARD'LAR DEVRE DIŞI BIRAKILDI --
      // perks: runesDataByName.perks.map(mapToId).filter(Boolean),
      // shards: runesDataByName.shards.map(mapToId).filter(Boolean),
      // -- BİTİŞ --
    };

    console.log("✅ Rünler başarıyla çekildi (ID'ler):");
    console.log(`  Primary: ${runesData.primary.join(", ")}`);
    console.log(`  Secondary: ${runesData.secondary.join(", ")}`);
    console.log(`  Keystone: ${runesData.keystone.join(", ")}`);
    // console.log(`  Perks: ${runesData.perks.join(", ")}`);
    // console.log(`  Shards: ${runesData.shards.join(", ")}`);

    return runesData;
  } catch (error) {
    console.error("Rün çekme hatası:", error);
    return {
      primary: [],
      secondary: [],
      keystone: [],
    };
  }
}

// Summoner spell'leri çeken fonksiyon
async function scrapeSpells(page) {
  try {
    const spellNames = await page.evaluate(() => {
      const results = new Set(); // Duplicates önlemek için Set kullanıldı

      // Summoner spell'leri çek
      const spellImages = document.querySelectorAll(
        'img[src*="/spell/"][alt*="Summoner Spell"]'
      );
      spellImages.forEach((img) => {
        const src = img.src;
        // Dosya adı .webp ile bitiyor, örn: SummonerFlash.webp
        const spellName = src.match(/\/([^\/]+)\.webp$/)?.[1];
        if (spellName) {
          results.add(spellName);
        }
      });

      return Array.from(results);
    });

    // --- YENİ KISIM: İSİMLERİ ID'LERE ÇEVİR ---
    const spellIds = spellNames
      .map((name) => {
        const id = spellNameToIdMap[name];
        if (!id) {
          console.warn(`⚠️ Eşleşemeyen Summoner Spell Adı: ${name}`);
        }
        return id;
      })
      .filter(Boolean); // Eşleşmeyenleri (null/undefined) temizle

    console.log("✅ Summoner Spells başarıyla çekildi (ID'ler):");
    console.log(`  Spells: ${spellIds.join(", ")}`);

    return spellIds;
  } catch (error) {
    console.error("Summoner spell çekme hatası:", error);
    return [];
  }
}

/**
 * Item'ın starting item olup olmadığını belirler (ARAM için optimize edilmiş)
 * @param {string} itemId - Item ID'si
 * @returns {boolean} - Starting item ise true
 */
function isStartingItem(itemId) {
  if (!itemJson || !itemJson.data || !itemJson.data[itemId]) {
    return false;
  }

  const item = itemJson.data[itemId];
  const goldCost = item.gold?.total || 0;

  // BOOTS KONTROLÜ - Hiçbir tamamlanmış boots starting item değildir
  const bootsIds = [
    "1001", // Boots
    "3006", // Berserker's Greaves
    "3020", // Sorcerer's Shoes
    "3047", // Plated Steelcaps
    "3111", // Mercury's Treads
    "3158", // Ionian Boots of Lucidity
    "3009", // Boots of Swiftness
    "3117", // Mobility Boots
  ];
  if (bootsIds.includes(itemId)) return false;

  // MYTHIC/LEGENDARY KONTROLÜ - Tamamlanmış büyük itemlar starting olamaz
  if (item.depth && item.depth >= 3) return false;

  // İsim bazlı kontrol - boots kelimesi geçenler
  const itemName = (item.name || "").toLowerCase();
  if (
    itemName.includes("boots") ||
    itemName.includes("greaves") ||
    itemName.includes("treads")
  ) {
    return false;
  }

  // ARAM'da başlangıç altını ~1400-1500 gold olduğu için fiyat aralığını optimize ediyoruz
  const knownAramStartingItems = [
    "1036",
    "1037",
    "1038",
    "1027",
    "1028",
    "1029",
    "1031",
    "1033",
    "1057",
    "1052",
    "1042",
    "1055",
    "1054",
    "1056",
    "3134",
    "3133",
    "3145",
    "3108",
    "3067",
    "3052",
    "3136",
    "3155",
    "3191",
    "3123",
    "3916",
    "4632",
    "1082",
    "2003",
    "2031",
    "1083",
  ];

  if (knownAramStartingItems.includes(itemId)) return true;

  if ((!item.from && goldCost <= 1300) || (item.from && goldCost <= 1300)) {
    return true;
  }

  return false;
}

// Item build'i kategorize et
function categorizeBuild(items) {
  if (!items || items.length === 0) {
    return {
      startingItems: [],
      coreItems: [],
      item4Options: [],
      item5Options: [],
      item6Options: [],
    };
  }

  const startingItems = [];
  const buildItems = [];

  // Starting item'ları ayır
  items.forEach((item) => {
    if (isStartingItem(item.itemId.toString())) {
      startingItems.push(item.itemId.toString());
    } else {
      buildItems.push(item.itemId.toString());
    }
  });

  // Kalan item'ları kategorize et
  const coreItems = buildItems.slice(0, 3);
  const item4Options = buildItems.slice(3, 5);
  const item5Options = buildItems.slice(5, 8);
  const item6Options = buildItems.slice(8, 11);

  return {
    startingItems,
    coreItems,
    item4Options,
    item5Options,
    item6Options,
  };
}

// Backward compatibility için aram fonksiyonu
async function aram(championName) {
  return await scrapeUgg(championName);
}

module.exports = { aram, scrapeUgg };
