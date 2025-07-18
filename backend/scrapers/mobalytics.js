const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

// JSON veri yükleyici

let runesReforgedData = [];
try {
  const runesPath = path.join(__dirname, "../data/runesReforged.json");
  if (fs.existsSync(runesPath)) {
    runesReforgedData = require(runesPath);
  } else {
    console.error(
      "HATA: runesReforged.json dosyası bulunamadı. Rün ayrıştırma çalışmayacak."
    );
  }
} catch (error) {
  console.error("runesReforged.json dosyası yüklenirken hata:", error.message);
}

let itemData = null;
try {
  const itemPath = path.join(__dirname, "../data/item.json");
  if (fs.existsSync(itemPath)) {
    itemData = require(itemPath);
  }
} catch (error) {
  console.warn("Item.json dosyası yüklenirken hata:", error.message);
}

/**
 * Item'ın starting item olup olmadığını belirler (ARAM için optimize edilmiş)
 * @param {string} itemId - Item ID'si
 * @returns {boolean} - Starting item ise true
 */

// Starting item kontrolü

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
/**
 * Mobalytics sitesinden veri çeker
 * @param {string} championName - Champion adı
 * @returns {Object} - Scraping sonucu
 */

// Mobalytics Scraper

async function scrapeMobalytics(championName) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  const formattedName =
    championName.toLowerCase() === "wukong"
      ? "monkeyking"
      : championName.toLowerCase();
  const url = `https://mobalytics.gg/lol/champions/${formattedName}/aram-builds`;
  console.log(`Scraping için sayfaya gidiliyor: ${url}`);

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const buildData = await page.evaluate((runesData) => {
      const site = "Mobalytics";

      const runes = {
        primary: [],
        secondary: [],
        keystone: [],
      };

      const spells = [];
      // --> DEĞİŞİKLİK: skills dizisi kaldırıldı.
      const mainBuildItems = [];

      const pathIds = new Set(runesData.map((p) => String(p.id)));
      const keystoneIds = new Set(
        runesData.flatMap((p) => p.slots[0].runes.map((r) => String(r.id)))
      );

      // 1. Sadece ana build item'larını al
      const itemContainer = document.querySelector(".m-l9l2ov");
      if (itemContainer) {
        const itemImages = itemContainer.querySelectorAll(
          'img[src*="/game-items/"]'
        );
        itemImages.forEach((img) => {
          const itemMatch = img.src.match(/\/game-items\/(\d+)\.png/);
          if (itemMatch && !mainBuildItems.includes(itemMatch[1])) {
            mainBuildItems.push(itemMatch[1]);
          }
        });
      }

      // 2. Rünleri ve Büyüleri al
      const generalContainers = document.querySelectorAll(
        ".m-owe8v3, .m-144y21y"
      );

      generalContainers.forEach((container) => {
        const allImages = container.querySelectorAll("img");
        allImages.forEach((img) => {
          const src = img.src || "";
          const alt = img.alt || "";

          // RÜNLERİ AYRIŞTIRMA
          if (src.includes("/perks/")) {
            const runeMatch = src.match(/\/perks\/(\d+)\.(png|svg)/);
            if (runeMatch) {
              const runeId = runeMatch[1];
              if (keystoneIds.has(runeId) && runes.keystone.length === 0) {
                runes.keystone.push(runeId);
              } else if (pathIds.has(runeId)) {
                if (runes.primary.length === 0) {
                  runes.primary.push(runeId);
                } else if (
                  runes.secondary.length === 0 &&
                  runes.primary[0] !== runeId
                ) {
                  runes.secondary.push(runeId);
                }
              }
            }
          }
          // BÜYÜLERİ (SUMMONER SPELLS) AYRIŞTIRMA
          else if (src.includes("/summoner-spells/")) {
            if (alt && !spells.includes(alt)) {
              spells.push(alt);
            }
          }
        });
      });

      return {
        site,
        runes,
        spells,
        mainBuildItems,
      };
    }, runesReforgedData);

    // Item kategorilendirmesi
    let startingItems = [];
    let coreItems = [];

    if (itemData && buildData.mainBuildItems) {
      startingItems = buildData.mainBuildItems.filter(isStartingItem);
      coreItems = buildData.mainBuildItems.filter((id) => !isStartingItem(id));
    } else {
      startingItems = buildData.mainBuildItems.slice(0, 2);
      coreItems = buildData.mainBuildItems.slice(2);
    }

    buildData.startingItems = startingItems;
    buildData.coreItems = coreItems;

    delete buildData.mainBuildItems;

    console.log(`${championName} için bulunan runes:`, buildData.runes);
    console.log(`${championName} için bulunan spells:`, buildData.spells);

    console.log(
      `${championName} için bulunan starting items:`,
      buildData.startingItems
    );
    console.log(
      `${championName} için bulunan core items:`,
      buildData.coreItems
    );

    await browser.close();
    return buildData;
  } catch (error) {
    console.error(
      `${championName} için Mobalytics'den veri çekilirken hata:`,
      error.message
    );
    await browser.close();
    return { site: "Mobalytics", error: `Veri çekilemedi: ${error.message}` };
  }
}

async function aram(championName) {
  return await scrapeMobalytics(championName);
}

module.exports = { scrapeMobalytics, aram };
