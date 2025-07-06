import React from 'react';
import SkillIcon from './SkillIcon';
import { getChampionDisplayName } from '../utils/championNames';

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6 text-foreground/50"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ChampionHero = ({ championName, latestVersion, skills, spellIds }) => {
  
  if (!championName) {
    return (
      <div className="text-center mt-16">
        <h1 className="text-5xl font-bold text-foreground mb-4">
          ARAM Build Aggregator
        </h1>
        <p className="text-xl text-foreground/60 mb-8">
          Şampiyon Build'lerini Keşfet
        </p>
        <h1 className="text-5xl font-bold text-foreground mb-4">
          Şampiyon Build'lerini Keşfet
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-foreground/80">
          Aramak istediğin şampiyonun adını yukarıdaki kutucuğa yaz.
        </p>
      </div>
    );
  }

  const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_0.jpg?cb=${championName}`;
  const squareUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${championName}.png`;


  console.log('ChampionHero - Skills data:', skills);
  
  const skillOrder = skills ? [skills["1stSkill"], skills["2ndSkill"], skills["3rdSkill"]].filter(skill => skill) : [];
  
 
  console.log('ChampionHero - Skill order:', skillOrder);

  return (
    <div className="relative w-full h-[340px] rounded-lg overflow-hidden">
      
      {/* Splash Art */}
      <img 
        src={splashUrl}
        alt={`${getChampionDisplayName(championName)} Splash Art`}
        className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
      />

      {/* Karartma katmanı */}
      <div className="absolute inset-0 bg-gradient-to-t from-huly-dark via-huly-dark/70 to-transparent" />

      {/* İçerik */}
      <div className="absolute inset-0 p-6 flex items-end justify-between">
        
        {/* Sol: Şampiyon küçük görseli ve adı */}
        <div className="flex items-end gap-5">
          <img 
            src={squareUrl}
            alt={getChampionDisplayName(championName)}
            className="w-24 h-24 rounded-md border-2 border-foreground/30 shadow-2xl"
          />
          <h1 className="text-3xl font-bold text-foreground" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
            {getChampionDisplayName(championName)}
          </h1>
        </div>
        
        {/* Sağ: Skill sırası */}
        {skillOrder.length > 0 && (
          <div className="flex items-center gap-3">
            {skillOrder.map((skill, index) => (
              <React.Fragment key={index}>
                <SkillIcon
                  championName={championName}
                  skillKey={skill}
                  latestVersion={latestVersion}
                  spellIds={spellIds}
                />
                {index < skillOrder.length - 1 && <ArrowIcon />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChampionHero;