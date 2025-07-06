import React from 'react';
import runeData from '../../../backend/data/runesReforged.json';
import '../assets/rune-sprite.css';


const flatRunes = {};
runeData.forEach(path => {

  flatRunes[path.id] = { id: path.id, name: path.name, icon: path.icon };


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
    <div title={runeName} className={`rune-sprite rune-${runeId} cursor-pointer`}></div>
  );
};

export default RuneIcon;