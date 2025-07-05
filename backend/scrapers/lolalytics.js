const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

// 1. JSON VERİ YÜKLEYİCİ

function safeRequireJson(relativePath, description = "Veri") {
  try {
    const fullPath = path.join(__dirname, relativePath);
    if (fs.existsSync(fullPath)) {
      return require(fullPath);
    }
  } catch (error) {
    console.warn(`${description} yüklenirken hata:`, error.message);
  }
  return null;
}

const itemData = safeRequireJson("../data/item.json", "Item.json");
const runesReforgedData = safeRequireJson(
  "../data/runesReforged.json",
  "Runes"
);

// 2. RUNE ID ANALİZİ & KATEGORİ AYIRMA

function findRuneCategory(runeId) {
  if (!runesReforgedData) return null;

  for (const tree of runesReforgedData) {
    const keystone = tree.slots?.[0]?.runes?.find(
      (r) => r.id.toString() === runeId
    );
    if (keystone) {
      return {
        treeKey: tree.key,
        treeId: tree.id,
        runeType: "keystone",
        treeName: tree.name,
      };
    }

    for (let i = 1; i < tree.slots.length; i++) {
      const found = tree.slots[i].runes?.find(
        (r) => r.id.toString() === runeId
      );
      if (found) {
        return {
          treeKey: tree.key,
          treeId: tree.id,
          runeType: "primary",
          treeName: tree.name,
        };
      }
    }
  }

  return null;
}

function categorizeRunes(runeIds) {
  const result = { primary: [], keystone: [], secondary: [] };
  if (!runeIds?.length) return result;

  let primaryTreeId = null;

  const keystoneInfo = findRuneCategory(runeIds[0]);
  if (keystoneInfo?.runeType === "keystone") {
    result.keystone.push(runeIds[0]);
    primaryTreeId = keystoneInfo.treeId;
    result.primary.push(primaryTreeId.toString());
  }

  const lastTwo = runeIds.slice(-2);
  const secondaryTreeId = lastTwo
    .map((id) => findRuneCategory(id))
    .find((info) => info && info.treeId !== primaryTreeId)?.treeId;

  if (secondaryTreeId) result.secondary.push(secondaryTreeId.toString());

  return result;
}

// 3. ITEM ANALİZİ: STARTING Mİ DEĞİL Mİ?

function isStartingItem(itemId) {
  if (!itemData || !itemData.data || !itemData.data[itemId]) {
    return false;
  }

  const item = itemData.data[itemId];
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

  // 1400 altındaki eşyalar
  if (goldCost <= 1400) {
    return true;
  }

  return false;
}

// 4. SCRAPING: EŞYA YATAY SIRALAMA YÖNTEMİ

async function categorizeItemsByPosition(page) {
  return await page.evaluate(() => {
    const buildContainer = document.querySelector(
      'div[class*="min-h-[294px]"]'
    );
    if (!buildContainer) return { startingItems: [], coreItems: [] };

    const itemImages = Array.from(
      buildContainer.querySelectorAll('img[src*="item64/"]')
    );
    const positions = itemImages
      .map((img) => {
        const match = img.src.match(/item64\/(\d+)\.webp/);
        if (!match) return null;
        const rect = img.getBoundingClientRect();
        const parent = buildContainer.getBoundingClientRect();
        return {
          id: match[1],
          x: rect.left - parent.left,
          y: rect.top - parent.top,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const firstRowY = positions[0]?.y || 0;
    const tolerance = 10;

    const startingItems = [];
    const coreItems = [];

    positions.forEach((item) => {
      Math.abs(item.y - firstRowY) <= tolerance
        ? startingItems.push(item.id)
        : coreItems.push(item.id);
    });

    return { startingItems, coreItems };
  });
}

// 5. ASIL SCRAPER METODU

async function scrapeLolalytics(championName) {
  let browser;
  const formattedName = championName.toLowerCase().replace(/[^a-z]/g, "");
  const url = `https://lolalytics.com/lol/${formattedName}/aram/build/`;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    console.log(`Sayfaya gidiliyor: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const mostCommonTab = await page.$('div[data-type="pick"]');
    if (mostCommonTab) {
      await mostCommonTab.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const buildData = await page.evaluate(() => {
      const site = "Lolalytics";
      const rawRunes = [];
      const spells = [];

      const container = document.querySelector('div[class*="min-h-[294px]"]');
      if (!container)
        return { site, rawRunes, spells, startingItems: [], coreItems: [] };

      const images = Array.from(container.querySelectorAll("img"));
      images
        .filter((img) => img.src.includes("rune68/"))
        .forEach((img) => {
          const match = img.src.match(/rune68\/(\d+)\.webp/);
          const isGray =
            img.style?.filter?.includes("grayscale") ||
            img.className?.includes("grayscale");
          if (match && !isGray) rawRunes.push(match[1]);
        });

      images
        .filter((img) => img.src.includes("spell64/"))
        .forEach((img) => {
          const match = img.src.match(/spell64\/(\d+)\.webp/);
          if (match) spells.push(match[1]);
        });

      return { site, rawRunes, spells };
    });

    buildData.runes = categorizeRunes(buildData.rawRunes);
    delete buildData.rawRunes;

    const itemCategories = await categorizeItemsByPosition(page);
    const allItems = [
      ...itemCategories.startingItems,
      ...itemCategories.coreItems,
    ];

    const startingItems = itemData
      ? allItems.filter(isStartingItem)
      : itemCategories.startingItems;

    const nonStartingItems = allItems.filter(
      (id) => !startingItems.includes(id)
    );

    buildData.startingItems = startingItems;
    buildData.coreItems = nonStartingItems.slice(0, 3);
    buildData.item4Options = nonStartingItems.slice(3, 5);
    buildData.item5Options = nonStartingItems.slice(5, 8);
    buildData.item6Options = nonStartingItems.slice(8, 11);

    console.log(`${championName} için rune'lar:`, buildData.runes);
    console.log(`${championName} için spells:`, buildData.spells);
    console.log(
      `${championName} için starting items:`,
      buildData.startingItems
    );

    return buildData;
  } catch (error) {
    console.error(`${championName} için scraping hatası:`, error.message);
    return { site: "Lolalytics", error: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

// 6. ARAM İÇİN ÖZEL FONKSİYON

async function aram(championName) {
  const build = await scrapeLolalytics(championName);
  return { [championName]: { lolalytics_aram: build } };
}

module.exports = { scrapeLolalytics, aram };
