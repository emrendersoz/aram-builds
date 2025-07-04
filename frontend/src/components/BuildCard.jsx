// src/components/BuildCard.jsx

import React from 'react';
import ItemIcon from './ItemIcon';
import RuneIcon from './RuneIcon';
import SpellIcon from './SpellIcon';

const OrSeparatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-foreground/40 shrink-0">
    <path d="M7 12h10" /><path d="M10 9l-3 3 3 3" /><path d="M14 9l3 3-3 3" />
  </svg>
);

const PinIcon = ({ pinned, onClick }) => {
  return pinned ? (
    // Solid (Dolu) kalp
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className="w-5 h-5 text-accent transition-colors duration-200 ease-in-out cursor-pointer"
      onClick={onClick}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41 1 4.5 2.5 1.09-1.5 2.76-2.5 4.5-2.5C20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ) : (
    // Outline (Boş) kalp
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      className="w-5 h-5 text-foreground/40 transition-colors duration-200 ease-in-out cursor-pointer"
      onClick={onClick}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21C12 21 7 16.5 5 12.5 3 9 5 6 8 6c1.5 0 3 1 4 3 1-2 2.5-3 4-3 3 0 5 3 3 6-2 4-7 8.5-7 8.5z" />
    </svg>
  );
};


const BuildCard = ({ build, className = "", isPinned = false, onTogglePin }) => {
  if (!build) {
    return (
      <div className={`cursor-card ${className} w-full mx-auto`}>
        <div className="cursor-card-content p-6">
          <p className="text-center text-foreground/60">Build'lerini görmek için bir şampiyon adı aratın.</p>
        </div>
      </div>
    );
  }

  const hasItemOptions = (build.item4Options?.length > 0) || (build.item5Options?.length > 0) || (build.item6Options?.length > 0);

  return (
    <div className={`cursor-card relative ${isPinned ? 'ring-2 ring-accent' : ''} ${className} w-full mx-auto`}>
      {/* Pin butonu */}
      <button
        onClick={onTogglePin}
        // Butonu diğer tüm katmanların üzerine çıkarmak için z-10 ekliyoruz.
        className="absolute top-3 right-3 p-1 rounded z-10 hover:bg-white/5 transition-colors"
        title={isPinned ? "Unpin this build" : "Pin this build"}
        type="button"
        aria-pressed={isPinned}
      >
        <PinIcon pinned={isPinned} />
      </button>

      {/* İçerik div'i (z-index: 1 ile) artık butonun altında kalacak */}
      <div className="cursor-card-content p-6">
        <h3 className="text-xl font-bold text-accent mb-6">{build.site}</h3>
        {/* ... kartın geri kalan tüm içeriği tamamen aynı, değişiklik yok ... */}
        <div className="flex flex-col gap-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-4 items-start">

            {/* BÖLÜM 1: RUNES & SPELLS */}
            <div>
              <h4 className="text-sm font-semibold text-foreground/80 mb-3">Spells & Runes</h4>
              <div className="flex flex-row flex-nowrap items-start gap-3">
                <div className="flex items-center gap-2">
                  {build.spells?.map(spellId => <SpellIcon key={`spell-${spellId}`} spellId={spellId} />)}
                </div>

                <div className="flex-grow" />

                <div className="relative w-[52px] h-[52px] shrink-0">
                  <div className="w-full h-full">
                    {build.runes?.keystone?.map(runeId => (
                      <RuneIcon key={`keystone-${runeId}`} runeId={runeId} />
                    ))}
                  </div>
                  <div className="absolute bottom-[-2px] right-[-2px] w-[24px] h-[24px] border-2 border-huly-dark rounded-full">
                    {build.runes?.secondary?.map(runeId => (
                      <RuneIcon key={`secondary-${runeId}`} runeId={runeId} />
                    ))}
                  </div>
                </div>
                <div className="flex-grow" />
              </div>
            </div>

            <div className="w-px h-full bg-foreground/10 self-stretch hidden md:block" />

            {/* BÖLÜM 2: STARTING ITEMS */}
            <div>
              <h4 className="text-sm font-semibold text-foreground/80 mb-3">Starting Items</h4>
              <div className="flex flex-row flex-nowrap items-start gap-2">
                {build.startingItems?.map(itemId => <ItemIcon key={`start-${itemId}`} itemId={itemId} />)}
              </div>
            </div>

            <div className="w-px h-full bg-foreground/10 self-stretch hidden md:block" />

            {/* BÖLÜM 3: CORE ITEMS */}
            <div>
              <h4 className="text-sm font-semibold text-foreground/80 mb-3">Core Items</h4>
              <div className="flex flex-row flex-nowrap items-start gap-2">
                {build.coreItems?.map(itemId => <ItemIcon key={`core-${itemId}`} itemId={itemId} />)}
              </div>
            </div>
          </div>

          {/* Alt sıra - Item seçenekleri */}
          {hasItemOptions && (
            <>
              <hr className="my-2 border-foreground/10" />
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-4 items-start">
                <div>
                  <h4 className="text-sm font-semibold text-foreground/80 mb-3">Fourth Item Options</h4>
                  <div className="flex flex-row flex-nowrap items-start gap-2">
                    {build.item4Options?.map((itemId, i) => (
                      <React.Fragment key={`i4-${i}`}>
                        <ItemIcon itemId={itemId} />
                        {i < build.item4Options.length - 1 && <OrSeparatorIcon />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="w-px h-full bg-foreground/10 self-stretch hidden md:block" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground/80 mb-3">Fifth Item Options</h4>
                  <div className="flex flex-row flex-nowrap items-start gap-2">
                    {build.item5Options?.map((itemId, i) => (
                      <React.Fragment key={`i5-${i}`}>
                        <ItemIcon itemId={itemId} />
                        {i < build.item5Options.length - 1 && <OrSeparatorIcon />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="w-px h-full bg-foreground/10 self-stretch hidden md:block" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground/80 mb-3">Sixth Item Options</h4>
                  <div className="flex flex-row flex-nowrap items-start gap-2">
                    {build.item6Options?.map((itemId, i) => (
                      <React.Fragment key={`i6-${i}`}>
                        <ItemIcon itemId={itemId} />
                        {i < build.item6Options.length - 1 && <OrSeparatorIcon />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildCard;
