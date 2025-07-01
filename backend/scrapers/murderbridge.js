const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

// item.json dosyasını yükle
let itemData = null;
try {
  const itemPath = path.join(__dirname, "../data/item.json");
  if (fs.existsSync(itemPath)) {
    itemData = require(itemPath);
  }
} catch (error) {
  console.warn("Item.json dosyası yüklenirken hata:", error.message);
}

// runesReforged.json dosyasını yükle
let runeTreeData = null;
try {
  const runePath = path.join(__dirname, "../data/runesReforged.json");
  if (fs.existsSync(runePath)) {
    runeTreeData = require(runePath);
  }
} catch (error) {
  console.warn("RunesReforged.json dosyası yüklenirken hata:", error.message);
}

// Rune ID'den tree ID bulur
function findRuneTreeId(runeId) {
  if (!runeId || !runeTreeData) return null;
  for (const tree of runeTreeData) {
    for (const slot of tree.slots) {
      if (slot.runes.some((r) => r.id.toString() === runeId.toString())) {
        return tree.id.toString();
      }
    }
  }
  return null;
}

// Starting item olup olmadığını kontrol eder
function isStartingItem(itemId) {
  if (!itemData || !itemData.data || !itemData.data[itemId]) return false;
  const item = itemData.data[itemId];
  const goldCost = item.gold?.total || 0;

  const bootsIds = [
    "1001",
    "3006",
    "3020",
    "3047",
    "3111",
    "3158",
    "3009",
    "3117",
    "3115",
  ];
  if (bootsIds.includes(itemId)) return false;

  const itemName = (item.name || "").toLowerCase();
  if (
    itemName.includes("boots") ||
    itemName.includes("greaves") ||
    itemName.includes("treads")
  ) {
    return false;
  }

  if (item.depth && item.depth >= 3) return false;

  if (goldCost <= 500) return true;
  if (item.from && item.from.length === 1 && goldCost <= 1300) return true;
  if (!item.from && goldCost <= 1300 && goldCost >= 300) return true;

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
    "3340",
    "3363",
    "3364",
  ];

  return knownAramStartingItems.includes(itemId);
}

async function scrapeMurderbridge(championName) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  });

  const url = `https://www.murderbridge.com/Champion/${championName}/`;
  console.log(`Scraping için sayfaya gidiliyor: ${url}`);

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const buildData = await page.evaluate(() => {
      const site = "Murderbridge";
      const rawRunes = [];
      const spells = [];
      const allItems = [];

      // Aktif (gri olmayan) rune ID'lerini topla
      const runeImgs = document.querySelectorAll(".runes-panel img.rune-image");
      runeImgs.forEach((img) => {
        const alt = img.getAttribute("alt") || "";
        const style = img.getAttribute("style") || "";
        const classList = img.className || "";

        const isGrayscale =
          style.includes("grayscale") ||
          classList.includes("grayscale") ||
          style.includes("opacity: 0.3") ||
          classList.includes("opacity-30");

        const match = alt.match(/rune-(\d+)/);
        if (match && !isGrayscale) {
          rawRunes.push(match[1]);
        }
      });

      const spellDivs = document.querySelectorAll("div.image-square");
      spellDivs.forEach((div) => {
        const style = div.getAttribute("style") || "";
        const urlMatch = style.match(
          /background-image:\s*url\(['"](.*?)['"]?\)/
        );
        if (urlMatch) {
          const url = urlMatch[1];
          const spellMatch = url.match(/\/spell\/([^\/]+)\.png/);
          if (spellMatch) {
            const spellName = spellMatch[1];
            if (
              spellName.startsWith("Summoner") &&
              !spells.includes(spellName)
            ) {
              spells.push(spellName);
            }
          }
        }
      });

      const itemBuild = document.querySelector(".item-build");
      if (itemBuild) {
        const itemDivs = itemBuild.querySelectorAll("div.image-square");
        itemDivs.forEach((div) => {
          const style = div.getAttribute("style") || "";
          const urlMatch = style.match(
            /background-image:\s*url\(['"](.*?)['"]?\)/
          );
          if (urlMatch) {
            const url = urlMatch[1];
            const itemMatch = url.match(/\/item\/(\d+)\.png/);
            if (itemMatch) {
              allItems.push(itemMatch[1]);
            }
          }
        });
      }

      return {
        site,
        rawRunes,
        spells,
        allItems,
      };
    });

    const keystoneId = buildData.rawRunes?.[0] || null;
    const primaryTreeId = findRuneTreeId(keystoneId);

    let secondaryTreeId = null;
    if (buildData.rawRunes && primaryTreeId) {
      for (const runeId of buildData.rawRunes) {
        const treeId = findRuneTreeId(runeId);
        if (treeId && treeId !== primaryTreeId) {
          secondaryTreeId = treeId;
          break;
        }
      }
    }

    buildData.runes = {
      keystone: keystoneId ? [keystoneId] : [],
      primary: primaryTreeId ? [primaryTreeId] : [],
      secondary: secondaryTreeId ? [secondaryTreeId] : [],
    };

    delete buildData.rawRunes;

    // Item kategorileri
    let startingItems = [];
    let nonStartingItems = [];

    if (itemData && buildData.allItems) {
      startingItems = buildData.allItems.filter(isStartingItem);
      nonStartingItems = buildData.allItems.filter((id) => !isStartingItem(id));
    } else {
      startingItems = buildData.allItems.slice(0, 3);
      nonStartingItems = buildData.allItems.slice(3);
    }

    buildData.startingItems = startingItems;
    buildData.coreItems = nonStartingItems.slice(0, 3);
    buildData.item4Options = nonStartingItems.slice(3, 6);
    buildData.item5Options = nonStartingItems.slice(6, 9);
    buildData.item6Options = nonStartingItems.slice(9, 12);

    delete buildData.allItems;

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
      `${championName} için Murderbridge'den veri çekilirken hata:`,
      error.message
    );
    await browser.close();
    return { site: "Murderbridge", error: `Veri çekilemedi: ${error.message}` };
  }
}

async function aram(championName) {
  return await scrapeMurderbridge(championName);
}

module.exports = { scrapeMurderbridge, aram };
