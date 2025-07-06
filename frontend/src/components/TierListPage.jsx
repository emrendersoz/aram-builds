import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getChampionDisplayName } from '../utils/championNames';

const TIER_CONFIG = {
  'S+': { color: '#ff9b00', order: 1 },
  'S': { color: '#3273fa', order: 2 },
  'A': { color: '#7ea4f4', order: 3 },
  'B': { color: '#e2e8f0', order: 4 }, 
  'C': { color: '#fcb1b2', order: 5 },
  'D': { color: '#ff4e50', order: 6 },
};
const TIER_ORDER = ['S+', 'S', 'A', 'B', 'C', 'D'];

const TierRow = ({ tier, champions }) => {
  const config = TIER_CONFIG[tier] || { color: '#6b7280' };

  return (
    <div 
      className="flex items-start mb-4 p-4 rounded-md border"
      style={{ 
        background: 'linear-gradient(135deg, rgba(10, 11, 13, 1) 0%, rgba(15, 16, 18, 1) 50%, rgba(10, 11, 13, 1) 100%)',
        borderColor: config.color
      }}
    >
      <div
        className="w-24 h-16 flex items-center justify-center font-black text-4xl mr-4 flex-shrink-0"
        style={{ color: config.color }}
      >
        {tier}
      </div>
      <div className="w-px h-16 bg-foreground/10 mr-4 flex-shrink-0"></div>
      <div className="flex flex-wrap gap-2">
        {champions.map(champion => (
          <Link
            to="/"
            state={{ championName: champion.name }}
            key={champion.name}
            className="flex flex-col items-center gap-1.5 p-1 rounded-md hover:bg-white/10 transition-colors group"
            title={getChampionDisplayName(champion.name)}
          >
            <div className={`champion-sprite champion-${champion.name}`} />
            <span className="text-xs text-foreground/70 group-hover:text-foreground transition-colors w-14 truncate text-center">
              {getChampionDisplayName(champion.name)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

const TierListPage = ({ allStatsData }) => {
  const groupedByTier = useMemo(() => {
    if (!allStatsData) return {};
    
    return Object.entries(allStatsData).reduce((acc, [championName, stats]) => {
      const tier = stats.tier || 'D'; 
      if (!acc[tier]) {
        acc[tier] = [];
      }
      acc[tier].push({ name: championName, ...stats });
      return acc;
    }, {});
  }, [allStatsData]);

  if (!allStatsData) {
    return <div className="text-center mt-8 text-foreground/50">Tier List verileri yükleniyor...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-8">
      {TIER_ORDER.map(tier => 
        groupedByTier[tier] ? (
          <TierRow key={tier} tier={tier} champions={groupedByTier[tier]} />
        ) : null
      )}
    </div>
  );
};

export default TierListPage;