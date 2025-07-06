import React from 'react';
import '../assets/item-sprite.css';
import itemData from '../../../backend/data/item.json';

const ItemIcon = ({ itemId }) => {
  const item = itemData.data[itemId];
  const itemName = item ? item.name : 'Unknown Item'; 

  return (
    <div title={itemName} className={`item-sprite item-${itemId} cursor-pointer`}></div>
  );
};

export default ItemIcon;
