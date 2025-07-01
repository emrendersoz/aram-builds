import React from 'react';
import summonerData from '../../../backend/data/summoner.json';
import '../assets/spell-sprite.css';

// --- DEĞİŞİKLİK 1: Birleşik arama haritası oluşturma ---
// Bu harita hem "4" gibi ID'lerle hem de "SummonerFlash" gibi isimlerle arama yapmamızı sağlar.
const spellLookupMap = {};
Object.values(summonerData.data).forEach(spell => {
  // Sayısal ID (key) ile girişi ekle
  spellLookupMap[spell.key] = spell;
  // Metin bazlı isim (id) ile girişi ekle
  spellLookupMap[spell.id] = spell;
});
// --- BİTİŞ ---


const SpellIcon = ({ spellId }) => {
  // --- DEĞİŞİKLİK 2: Yeni haritayı kullanarak arama yap ---
  // spellId "4" de olsa, "SummonerFlash" da olsa doğru nesneyi bulur.
  const spell = spellLookupMap[spellId];

  // Eğer spell bulunamazsa, bir hata veya boşluk göstermek daha güvenlidir.
  if (!spell) {
    console.warn(`Bilinmeyen spell ID veya adı: ${spellId}`);
    return <div title={`Bilinmeyen: ${spellId}`} className="spell-sprite spell-unknown cursor-help w-12 h-12 bg-gray-700 border-2 border-red-500 rounded-md"></div>;
  }
  
  const spellName = spell.name;
  // --- DEĞİŞİKLİK 3: CSS sınıfı için her zaman sayısal ID'yi kullan ---
  // Bu, girdinin "SummonerFlash" olması durumunda bile CSS'in "spell-4" olmasını sağlar.
  const numericSpellId = spell.key; 

  return (
    <div title={spellName} className={`spell-sprite spell-${numericSpellId} cursor-pointer`}></div>
  );
};

export default SpellIcon;