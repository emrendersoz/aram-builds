import React from 'react';
import '../assets/item-sprite.css';
import itemData from '../../../backend/data/item.json';

const ItemIcon = ({ itemId }) => {
  // Gelen item ID'sine karşılık gelen item'ı JSON verisinden buluyoruz.
  const item = itemData.data[itemId];
  const itemName = item ? item.name : 'Unknown Item'; // Eğer item bulunamazsa varsayılan bir isim ver.

  // Bileşenimiz, sprite class'larını ve fare üzerine gelince item adını gösterecek bir title'ı içeriyor.
  return (
    <div title={itemName} className={`item-sprite item-${itemId} cursor-pointer`}></div>
  );
};

export default ItemIcon;
