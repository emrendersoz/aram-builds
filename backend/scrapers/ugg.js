const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

const itemJson = require("../data/item.json");
const summonerJson = require("../data/summoner.json");
const runesJson = require("../data/runesReforged.json");

const itemEntries = Object.entries(itemJson.data);
const itemData = itemEntries.map(([id, item]) => ({
  id: parseInt(id),
  name: item.name,
}));

const spellNameToIdMap = Object.values(summonerJson.data).reduce(
  (acc, spell) => {
    acc[spell.id] = spell.key;
    return acc;
  },
  {}
);

const runeNameToIdMap = {};
runesJson.forEach((path) => {
  path.slots.forEach((slot) => {
    slot.runes.forEach((rune) => {
      runeNameToIdMap[rune.key] = rune.id.toString();
    });
  });
});

// U.GG'nin farklı isimlendirdiği rune'lar için manuel mapping
const uggRuneNameMap = {
  // Precision
  LethalTempoTemp: "8008",
  FleetFootwork: "8021",
  Overheal: "9101",
  Triumph: "9111",
  PresenceOfMind: "8009",
  LegendAlacrity: "9104",
  LegendTenacity: "9105",
  LegendBloodline: "9103",
  CoupDeGrace: "8014",
  CutDown: "8017",
  LastStand: "8299",

  // Domination
  CheapShot: "8126",
  TasteOfBlood: "8139",
  SuddenImpact: "8143",
  ZombieWard: "8136",
  GhostPoro: "8120",
  EyeballCollection: "8138",
  RavenousHunter: "8135",
  IngeniousHunter: "8134",
  RelentlessHunter: "8105",
  UltimateHunter: "8106",
  TreasureHunter: "8135",

  // Sorcery
  NullifyingOrb: "8224",
  ManaflowBand: "8226",
  NimbusCloak: "8275",
  Transcendence: "8210",
  Celerity: "8234",
  AbsoluteFocus: "8233",
  Scorch: "8237",
  Waterwalking: "8232",
  GatheringStorm: "8236",

  // Resolve
  VeteranAftershock: "8439",
  Aftershock: "8439",
  FontOfLife: "8463",
  BonePlating: "8473",
  Demolish: "8446",
  Conditioning: "8429",
  SecondWind: "8444",
  Overgrowth: "8451",
  Revitalize: "8453",
  Unflinching: "8242",

  // Inspiration
  HextechFlashtraption: "8306",
  MagicalFootwear: "8304",
  PerfectTiming: "8313",
  FuturesMarket: "8321",
  MinionDematerializer: "8316",
  BiscuitDelivery: "8345",
  CosmicInsight: "8347",
  ApproachVelocity: "8410",
  TimeWarpTonic: "8352",
};

Object.assign(runeNameToIdMap, uggRuneNameMap);

async function scrapeUgg(championName) {
  const url = `https://u.gg/lol/champions/aram/${championName.toLowerCase()}-aram`;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  try {
    console.log(`Sayfa açılıyor: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await new Promise((resolve) => setTimeout(resolve, 5000));

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
        await page.evaluate((el) => {
          el.scrollIntoView({ behavior: "instant", block: "center" });
        }, item);

        await page.mouse.move(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 100));

        await item.hover();
        await page
          .waitForSelector("#tooltip-portal .tooltip-item", {
            timeout: 2000,
          })
          .catch(() => null);

        let name = null;
        let retries = 3;

        while (!name && retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));

          name = await page.evaluate(() => {
            const tooltip = document.querySelector(
              "#tooltip-portal .tooltip-item .name"
            );
            return tooltip?.textContent.trim() || null;
          });

          if (!name) {
            console.log(`Retry ${4 - retries}/3 for item #${i + 1}`);
            retries--;
          }
        }
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

    console.log("\n=== Rünler Çekiliyor ===");
    const runesData = await scrapeRunes(page);

    console.log("\n=== Summoner Spells Çekiliyor ===");
    const spellsData = await scrapeSpells(page);

    const buildData = categorizeBuild(itemResults);

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

async function scrapeRunes(page) {
  try {
    const runesDataByName = await page.evaluate(() => {
      const results = {
        primary: new Set(),
        secondary: new Set(),
        keystone: new Set(),
      };

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

      return {
        primary: Array.from(results.primary),
        secondary: Array.from(results.secondary),
        keystone: Array.from(results.keystone),
      };
    });

    const mapToId = (name) => {
      const id = runeNameToIdMap[name];
      if (!id) console.warn(`⚠️ Eşleşemeyen Rün/Shard Adı: ${name}`);
      return id;
    };

    const runesData = {
      primary: runesDataByName.primary,
      secondary: runesDataByName.secondary,
      keystone: runesDataByName.keystone.map(mapToId).filter(Boolean),
    };

    console.log("✅ Rünler başarıyla çekildi (ID'ler):");
    console.log(`  Primary: ${runesData.primary.join(", ")}`);
    console.log(`  Secondary: ${runesData.secondary.join(", ")}`);
    console.log(`  Keystone: ${runesData.keystone.join(", ")}`);

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

async function scrapeSpells(page) {
  try {
    const spellNames = await page.evaluate(() => {
      const results = new Set();

      const spellImages = document.querySelectorAll(
        'img[src*="/spell/"][alt*="Summoner Spell"]'
      );
      spellImages.forEach((img) => {
        const src = img.src;
        const spellName = src.match(/\/([^\/]+)\.webp$/)?.[1];
        if (spellName) {
          results.add(spellName);
        }
      });

      return Array.from(results);
    });

    const spellIds = spellNames
      .map((name) => {
        const id = spellNameToIdMap[name];
        if (!id) {
          console.warn(`⚠️ Eşleşemeyen Summoner Spell Adı: ${name}`);
        }
        return id;
      })
      .filter(Boolean);

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
  // itemJson.data kullanın, itemData.data değil
  if (!itemJson || !itemJson.data || !itemJson.data[itemId]) {
    return false;
  }

  const item = itemJson.data[itemId];
  const goldCost = item.gold?.total || 0;
  const itemName = (item.name || "").toLowerCase();

  // Özel durum: Boots item'ı 300 gold ise starting sayılır
  if (itemName === "boots" && goldCost === 300) {
    return true;
  }

  // Tüm boots türlerini dışla
  if (
    itemName.includes("boots") ||
    itemName.includes("greaves") ||
    itemName.includes("treads") ||
    itemName.includes("shoes")
  ) {
    return false;
  }

  // 1400 altındaki eşyalar (BF Sword 1300 gold, Health Potion gibi)
  if (goldCost <= 1400) {
    return true;
  }

  return false;
}

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

  items.forEach((item) => {
    if (isStartingItem(item.itemId.toString())) {
      startingItems.push(item.itemId.toString());
    } else {
      buildItems.push(item.itemId.toString());
    }
  });

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

async function aram(championName) {
  return await scrapeUgg(championName);
}

module.exports = { aram, scrapeUgg };
