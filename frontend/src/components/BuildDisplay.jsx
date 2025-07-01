// components/BuildDisplay.jsx (YENİ VE TEK COMPONENT)

import React from 'react';
import ItemIcon from './ItemIcon';
import RuneIcon from './RuneIcon';
import SpellIcon from './SpellIcon';

const BuildDisplay = ({ buildData }) => {
  // Hata durumu veya veri yoksa, özel bir kart göster.
  // Bu kontrol App.jsx'te yapılıyor ama burada da olması iyidir.
  if (!buildData || buildData.error) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 shadow-xl border border-gray-700">
        <h3 className="text-xl font-bold text-red-500">{buildData?.site || 'Bilinmeyen Site'}</h3>
        <p className="text-gray-400 mt-2">Bu site için veri bulunamadı veya çekilemedi.</p>
      </div>
    );
  }

  // --- RÜN GÖSTERİMİ İÇİN VERİYİ HAZIRLAMA ---
  // buildData.runes nesnesini tek bir diziye dönüştür
  const runesToShow = buildData.runes ? [
    ...(buildData.runes.primary || []),
    ...(buildData.runes.keystone || []),
    ...(buildData.runes.secondary || []),
  ] : [];

  // --- EŞYA GÖSTERİMİ İÇİN KOŞUL BELİRLEME ---
  // Veride eşya seçenekleri var mı diye kontrol et
  const hasItemOptions = 
    (buildData.item4Options?.length > 0) ||
    (buildData.item5Options?.length > 0) ||
    (buildData.item6Options?.length > 0);

  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-700">
      <h3 className="text-2xl font-bold text-cyan-400 mb-4">{buildData.site} (ARAM)</h3>
      <div className="space-y-6">
        
        {/* Sihirdar Büyüleri */}
        {buildData.spells?.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-300 mb-2">Sihirdar Büyüleri</h4>
            <div className="flex flex-wrap gap-2">
              {buildData.spells.map(spellId => (
                <SpellIcon key={`spell-${spellId}`} spellId={spellId} />
              ))}
            </div>
          </div>
        )}

        {/* Rünler */}
        {runesToShow.length > 0 && (
           <div>
              <h4 className="text-lg font-semibold text-gray-300 mb-2">Rünler</h4>
              <div className="flex flex-wrap items-center gap-2">
                {runesToShow.map((runeId, index) => (
                  <React.Fragment key={`rune-${runeId}-${index}`}>
                    <RuneIcon runeId={runeId} />
                    {/* Keystone'dan sonra bir ayraç ekle */}
                    {index === 1 && <div className="w-px h-6 bg-gray-600 mx-1"></div>}
                  </React.Fragment>
                ))}
              </div>
           </div>
        )}

        {/* Başlangıç Eşyaları */}
        {buildData.startingItems?.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-300 mb-2">Başlangıç Eşyaları</h4>
            <div className="flex flex-wrap gap-2">
              {buildData.startingItems.map(itemId => (
                <ItemIcon key={`start-${itemId}`} itemId={itemId} />
              ))}
            </div>
          </div>
        )}

        {/* --- KOŞULLU EŞYA GÖSTERİMİ --- */}
        {hasItemOptions ? (
          // EĞER SEÇENEKLER VARSA (U.GG, Lolalytics vb.)
          <>
            {buildData.coreItems?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-orange-400 mb-2">Çekirdek Eşyalar</h4>
                <div className="flex flex-wrap gap-2">
                  {buildData.coreItems.map(itemId => (
                    <ItemIcon key={`core-${itemId}`} itemId={itemId} />
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {buildData.item4Options?.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-green-600">
                  <h4 className="text-lg font-semibold text-green-400 mb-3 text-center">4. Eşya Seçenekleri</h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {buildData.item4Options.map(itemId => <ItemIcon key={`item4-${itemId}`} itemId={itemId} />)}
                  </div>
                </div>
              )}
              {buildData.item5Options?.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-green-600">
                  <h4 className="text-lg font-semibold text-green-400 mb-3 text-center">5. Eşya Seçenekleri</h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {buildData.item5Options.map(itemId => <ItemIcon key={`item5-${itemId}`} itemId={itemId} />)}
                  </div>
                </div>
              )}
              {buildData.item6Options?.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-green-600">
                  <h4 className="text-lg font-semibold text-green-400 mb-3 text-center">6. Eşya Seçenekleri</h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {buildData.item6Options.map(itemId => <ItemIcon key={`item6-${itemId}`} itemId={itemId} />)}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // EĞER SEÇENEK YOKSA (MetaSRC gibi)
          <>
            {buildData.coreItems?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Önerilen Build</h4>
                <div className="flex flex-wrap gap-2">
                  {buildData.coreItems.map(itemId => (
                    <ItemIcon key={`core-${itemId}`} itemId={itemId} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BuildDisplay;