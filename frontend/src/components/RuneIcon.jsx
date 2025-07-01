import React from 'react';
import runeData from '../../../backend/data/runesReforged.json';
import '../assets/rune-sprite.css';

// Veriyi daha kolay arama yapmak için düz bir yapıya çevirelim.
const flatRunes = {};
runeData.forEach(path => {
  // --- YENİ EKLENEN KISIM: Ana rün yollarını da objeye ekliyoruz ---
  flatRunes[path.id] = { id: path.id, name: path.name, icon: path.icon };

  // Alt rünleri ekliyoruz (mevcut kod)
  path.slots.forEach(slot => {
    slot.runes.forEach(rune => {
      flatRunes[rune.id] = rune;
    });
  });
});

const RuneIcon = ({ runeId }) => {
  const rune = flatRunes[runeId];
  const runeName = rune ? rune.name : 'Bilinmeyen Rün';
  return (
    // runeId bulunamadığında bir şey göstermemesi için koşul ekleyebiliriz ama şimdilik böyle kalsın.
    <div title={runeName} className={`rune-sprite rune-${runeId} cursor-pointer`}></div>
  );
};

export default RuneIcon;