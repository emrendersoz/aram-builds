import { useState } from 'react';

const SkillIcon = ({ championName, skillKey, latestVersion, spellIds }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  
  if (!latestVersion || !championName || !skillKey) {
    return <div className="w-10 h-10 bg-gray-800 rounded-md" />;
  }
  

  let skillId;
  
  if (spellIds && spellIds[skillKey]) {
   
    skillId = spellIds[skillKey].id || spellIds[skillKey];
  } else {
    
    skillId = `${championName}${skillKey}`;
  }
  
  
  const skillImageUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${skillId}.png`;
  
  console.log(`${championName} ${skillKey} -> ${skillId} -> ${skillImageUrl}`);
  
  const handleImageError = () => {
    setImageError(true);
    console.warn(`Skill icon could not be loaded: ${championName} ${skillKey} (${skillId})`);
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  return (
    <div className="relative w-9 h-9 shrink-0">
      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div className="w-full h-full rounded-md border border-black/30 bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-600 rounded"></div>
        </div>
      )}
      
      {/* Error state - fallback görsel */}
      {imageError && (
        <div className="w-full h-full rounded-md border border-red-500/50 bg-red-900/20 flex items-center justify-center">
          <span className="text-red-400 text-xs font-bold">{skillKey}</span>
        </div>
      )}
      
      {/* Skill resmi */}
      <img 
        src={skillImageUrl} 
        alt={`${championName} ${skillKey}`}
        className={`w-full h-full rounded-md border border-black/30 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-200`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      
      {/* Sağ alttaki harf */}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-huly-dark border border-foreground/30 rounded-md flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{skillKey}</span>
      </div>
    </div>
  );
};

export default SkillIcon;