const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

// Item.json dosyasını yükle (eğer mevcutsa)
let itemData = null;
try {
  const itemPath = path.join(__dirname, "../data/item.json");
  if (fs.existsSync(itemPath)) {
    itemData = require(itemPath);
  }
} catch (error) {
  console.warn("Item.json dosyası yüklenirken hata:", error.message);
}

// RunesReforged.json dosyasını yükle
let runesReforgedData = null;
try {
  const runesPath = path.join(__dirname, "../data/runesReforged.json");
  if (fs.existsSync(runesPath)) {
    runesReforgedData = require(runesPath);
  }
} catch (error) {
  console.warn("runesReforged.json dosyası yüklenirken hata:", error.message);
}

/**
 * Rune ID'sine göre hangi kategoride (primary tree) olduğunu bulur
 * @param {string} runeId - Rune ID'si
 * @returns {object|null} - {treeKey: string, treeId: number, runeType: string} veya null
 */
function findRuneCategory(runeId) {
  if (!runesReforgedData) return null;

  for (const tree of runesReforgedData) {
    // Keystone rune kontrolü
    if (tree.slots && tree.slots[0] && tree.slots[0].runes) {
      const keystoneRune = tree.slots[0].runes.find(
        (rune) => rune.id.toString() === runeId
      );
      if (keystoneRune) {
        return {
          treeKey: tree.key,
          treeId: tree.id,
          runeType: "keystone",
          treeName: tree.name,
        };
      }
    }

    // Diğer rune slot'larını kontrol et
    for (let slotIndex = 1; slotIndex < tree.slots.length; slotIndex++) {
      const slot = tree.slots[slotIndex];
      if (slot.runes) {
        const foundRune = slot.runes.find(
          (rune) => rune.id.toString() === runeId
        );
        if (foundRune) {
          return {
            treeKey: tree.key,
            treeId: tree.id,
            runeType:
              slotIndex === 1
                ? "primary"
                : slotIndex === 2
                ? "primary"
                : "primary",
            treeName: tree.name,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Rune listesini kategorilere ayırır
 * @param {string[]} runeIds - Rune ID'leri listesi
 * @returns {object} - Kategorilere ayrılmış rune'lar
 */
function categorizeRunes(runeIds) {
  if (!runeIds || runeIds.length === 0) {
    return {
      primary: [],
      keystone: [],
      secondary: [],
    };
  }

  const result = {
    primary: [],
    keystone: [],
    secondary: [],
  };

  let primaryTreeId = null;

  // İlk rune keystone olarak kabul edilir
  if (runeIds.length > 0) {
    const keystoneInfo = findRuneCategory(runeIds[0]);
    if (keystoneInfo && keystoneInfo.runeType === "keystone") {
      result.keystone.push(runeIds[0]);
      primaryTreeId = keystoneInfo.treeId;

      // Primary path ID'sini ekle (keystone'un bulunduğu tree'nin ID'si)
      result.primary.push(primaryTreeId.toString());
    }
  }

  // Son 2 rune secondary olarak kabul edilir
  if (runeIds.length >= 2) {
    const lastTwoRunes = runeIds.slice(-2);

    // Son 2 rune'dan birinin hangi secondary tree'den olduğunu bul
    let secondaryTreeId = null;
    for (const runeId of lastTwoRunes) {
      const runeInfo = findRuneCategory(runeId);
      if (runeInfo && runeInfo.treeId !== primaryTreeId) {
        secondaryTreeId = runeInfo.treeId;
        break;
      }
    }

    // Secondary path ID'sini ekle
    if (secondaryTreeId) {
      result.secondary.push(secondaryTreeId.toString());
    }
  }

  return result;
}

/**
 * Item'ın starting item olup olmadığını belirler (ARAM için optimize edilmiş)
 * @param {string} itemId - Item ID'si
 * @returns {boolean} - Starting item ise true
 */
function isStartingItem(itemId) {
  if (!itemData || !itemData.data || !itemData.data[itemId]) {
    return false;
  }

  const item = itemData.data[itemId];
  const goldCost = item.gold?.total || 0;

  // BOOTS KONTROLÜ - Hiçbir boots starting item değildir
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

  // MYTHIC/LEGENDARY KONTROLÜ - Tamamlanmış büyük itemlar starting olamaz
  if (item.depth && item.depth >= 3) return false; // 3+ tier itemlar

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

  // Yöntem 1: Kesinlikle starting item olanlar (basic components)
  if (goldCost <= 500) return true;

  // Yöntem 2: Tier 2 itemlar - tek komponent + combine cost ve reasonable fiyat
  if (item.from && item.from.length === 1 && goldCost <= 1300) return true;

  // Yöntem 3: Basic itemlar (komponent gerektirmeyen) - ARAM budget'ına uygun
  if (!item.from && goldCost <= 1300 && goldCost >= 300) return true;

  // Yöntem 4: Bilinen ARAM starting itemlar (manuel güvenli liste)
  const knownAramStartingItems = [
    // Tier 1 Basic Items
    "1036", // Long Sword (350g)
    "1037", // Pickaxe (875g)
    "1038", // B.F. Sword (1300g)
    "1027", // Sapphire Crystal (350g)
    "1028", // Ruby Crystal (400g)
    "1029", // Cloth Armor (300g)
    "1031", // Chain Vest (800g)
    "1033", // Null-Magic Mantle (450g)
    "1057", // Negatron Cloak (720g)
    "1052", // Amplifying Tome (435g)
    "1042", // Dagger (300g)

    // Doran's Items
    "1055", // Doran's Blade (450g)
    "1054", // Doran's Shield (450g)
    "1056", // Doran's Ring (400g)

    // Popular Tier 2 ARAM Starting Items
    "3134", // Serrated Dirk (1100g)
    "3133", // Caulfield's Warhammer (1100g)
    "3145", // Hextech Alternator (1050g)
    "3108", // Fiendish Codex (900g)
    "3067", // Kindlegem (800g)
    "3052", // Jaurim's Fist (1000g)
    "3136", // Haunting Guise (1100g)
    "3155", // Hexdrinker (1300g)
    "3191", // Seeker's Armguard (1000g)
    "3123", // Executioner's Calling (800g)
    "3916", // Oblivion Orb (800g)
    "4632", // Verdant Barrier (1200g)

    // Utility/Consumables
    "1082", // The Dark Seal (350g)
    "2003", // Health Potion (50g)
    "2031", // Refillable Potion (150g)
    "1083", // Cull (450g)
    "3340", // Stealth Ward
    "3363", // Farsight Alteration
    "3364", // Oracle Lens
  ];

  return knownAramStartingItems.includes(itemId);
}

/**
 * CSS pozisyonuna göre item kategorisini belirler (alternatif yöntem)
 */
async function categorizeItemsByPosition(page) {
  return await page.evaluate(() => {
    const buildContainer = document.querySelector(
      'div[class*="min-h-[294px]"]'
    );
    if (!buildContainer) return { startingItems: [], coreItems: [] };

    const itemImages = Array.from(
      buildContainer.querySelectorAll('img[src*="cdn5.lolalytics.com/item64/"]')
    );

    const itemsWithPosition = itemImages
      .map((img) => {
        const match = img.src.match(/item64\/(\d+)\.webp/);
        if (!match) return null;

        const rect = img.getBoundingClientRect();
        const parentRect = buildContainer.getBoundingClientRect();

        return {
          id: match[1],
          x: rect.left - parentRect.left,
          y: rect.top - parentRect.top,
          element: img,
        };
      })
      .filter(Boolean);

    // Y pozisyonuna göre sırala (üsttekiler starting items olabilir)
    itemsWithPosition.sort((a, b) => a.y - b.y || a.x - b.x);

    // İlk satırdaki itemları starting items olarak kabul et
    const firstRowY = itemsWithPosition[0]?.y || 0;
    const tolerance = 10; // pixel tolerance

    const startingItems = [];
    const coreItems = [];

    itemsWithPosition.forEach((item) => {
      if (Math.abs(item.y - firstRowY) <= tolerance) {
        startingItems.push(item.id);
      } else {
        coreItems.push(item.id);
      }
    });

    return { startingItems, coreItems };
  });
}

async function scrapeLolalytics(championName) {
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

  const formattedName = championName.toLowerCase().replace(/[^a-z]/g, "");
  const url = `https://lolalytics.com/lol/${formattedName}/aram/build/`;
  console.log(`Scraping için sayfaya gidiliyor: ${url}`);

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // "Most Common Build" sekmesine tıkla
    try {
      const mostCommonBuildTab = await page.$('div[data-type="pick"]');
      if (mostCommonBuildTab) {
        console.log(
          `${championName} için "Most Common Build" sekmesine tıklanıyor...`
        );
        await mostCommonBuildTab.click();
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Sekme değişimi için bekle
      } else {
        console.warn(
          `${championName} için "Most Common Build" sekmesi bulunamadı, varsayılan build kullanılacak.`
        );
      }
    } catch (tabError) {
      console.warn(
        `${championName} için sekme değişimi sırasında hata:`,
        tabError.message
      );
    }

    const buildData = await page.evaluate(() => {
      const site = "Lolalytics";
      const rawRunes = [];
      const spells = [];

      // Build önerilerinin olduğu container
      const buildContainer = document.querySelector(
        'div[class*="min-h-[294px]"]'
      );

      if (!buildContainer) {
        console.warn("Build container bulunamadı.");
        return { site, rawRunes, spells, startingItems: [], coreItems: [] };
      }

      const images = Array.from(buildContainer.querySelectorAll("img"));

      // Rünler - Ham hali
      images
        .filter((img) => img.src.includes("cdn5.lolalytics.com/rune68/"))
        .forEach((img) => {
          const match = img.src.match(/rune68\/(\d+)\.webp/);
          const style = img.getAttribute("style") || "";
          const classList = img.className || "";
          const isGrayscale =
            style.includes("grayscale") || classList.includes("grayscale");

          if (match && !isGrayscale) rawRunes.push(match[1]);
        });

      // Spell'ler
      images
        .filter((img) => img.src.includes("cdn5.lolalytics.com/spell64/"))
        .forEach((img) => {
          const match = img.src.match(/spell64\/(\d+)\.webp/);
          if (match) spells.push(match[1]);
        });

      return { site, rawRunes, spells };
    });

    // Rune'ları kategorilere ayır
    const categorizedRunes = categorizeRunes(buildData.rawRunes);
    buildData.runes = categorizedRunes;

    // Ham rune datasını sil
    delete buildData.rawRunes;

    // Item kategorilendirmesi için pozisyon bazlı yaklaşım kullan
    const itemCategories = await categorizeItemsByPosition(page);

    // Starting items ve core items kategorilendirmesi
    let allItems = [
      ...itemCategories.startingItems,
      ...itemCategories.coreItems,
    ];
    let startingItems = [];
    let nonStartingItems = [];

    // Item.json mevcutsa doğrulama yap
    if (itemData) {
      startingItems = allItems.filter(isStartingItem);
      nonStartingItems = allItems.filter((id) => !isStartingItem(id));
    } else {
      // Item.json yoksa pozisyon bazlı ayrımı kullan
      startingItems = itemCategories.startingItems;
      nonStartingItems = itemCategories.coreItems;
    }

    // Lolalytics mantığına göre kategorilendirme
    buildData.startingItems = startingItems;

    // Starting olmayan itemları Lolalytics mantığına göre kategorilere ayır
    buildData.coreItems = nonStartingItems.slice(0, 3); // İlk 3: Core Items
    buildData.item4Options = nonStartingItems.slice(3, 5); // 4-5: Item 4 seçenekleri (2 item)
    buildData.item5Options = nonStartingItems.slice(5, 8); // 6-8: Item 5 seçenekleri (3 item)
    buildData.item6Options = nonStartingItems.slice(8, 11); // 9-11: Item 6 seçenekleri (3 item)

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
    console.log(
      `${championName} için bulunan item 4 options:`,
      buildData.item4Options
    );
    console.log(
      `${championName} için bulunan item 5 options:`,
      buildData.item5Options
    );
    console.log(
      `${championName} için bulunan item 6 options:`,
      buildData.item6Options
    );

    await browser.close();
    return buildData;
  } catch (error) {
    console.error(
      `${championName} için Lolalytics'ten veri çekilirken hata:`,
      error.message
    );
    await browser.close();
    return { site: "Lolalytics", error: `Veri çekilemedi: ${error.message}` };
  }
}

async function aram(championName) {
  const buildData = await scrapeLolalytics(championName);

  // İstenen format için veriyi düzenle
  const formattedData = {
    [championName]: {
      lolalytics_aram: buildData,
    },
  };

  return formattedData;
}

module.exports = { scrapeLolalytics, aram };
