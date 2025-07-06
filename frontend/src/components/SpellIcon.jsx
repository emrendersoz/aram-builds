import React from 'react';
import summonerData from '../../../backend/data/summoner.json';
import '../assets/spell-sprite.css';


const spellLookupMap = {};
Object.values(summonerData.data).forEach(spell => {
  spellLookupMap[spell.key] = spell;

  spellLookupMap[spell.id] = spell;
});



const SpellIcon = ({ spellId }) => {
  const spell = spellLookupMap[spellId];


  if (!spell) {
    console.warn(`Bilinmeyen spell ID veya adı: ${spellId}`);
    return <div title={`Bilinmeyen: ${spellId}`} className="spell-sprite spell-unknown cursor-help w-12 h-12 bg-gray-700 border-2 border-red-500 rounded-md"></div>;
  }
  
  const spellName = spell.name;
  const numericSpellId = spell.key; 

  return (
    <div title={spellName} className={`spell-sprite spell-${numericSpellId} cursor-pointer`}></div>
  );
};

export default SpellIcon;