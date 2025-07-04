// src/components/StatsCard.jsx

// Tier rengini belirleyen fonksiyon
const getTierColor = (tier) => {
  const tierColors = {
    'S+': '#ff9b00',
    'S': '#3273fa',
    'A': '#7ea4f4',
    'B': 'text-foreground',
    'C': '#fcb1b2',
    'D': '#ff4e50',
  };
  
  const color = tierColors[tier];
  return color && color !== 'text-foreground' ? { color } : {};
};

// Win rate rengini belirleyen fonksiyon
const getWinRateColor = (winRateString) => {
  // Win rate string'inden sayısal değeri çıkar (örn: "55.11%" -> 55.11)
  const winRate = parseFloat(winRateString.replace('%', ''));
  
  if (isNaN(winRate)) return {};
  
  if (winRate >= 55.0) return { color: '#ff9b00' };
  if (winRate >= 53.0) return { color: '#3273fa' };
  if (winRate >= 51.5) return { color: '#7ea4f4' };
  if (winRate >= 48.5) return {};  // text-foreground (varsayılan)
  if (winRate >= 45.0) return { color: '#fcb1b2' };
  return { color: '#ff4e50' };  // 45 altı
};

// Her bir stat'ı (etiket + değer) göstermek için küçük bir component
const StatItem = ({ label, value, customStyle = {} }) => (
  <div className="text-center">
    <dt className="text-sm text-foreground/60">{label}</dt>
    <dd 
      className="mt-1 text-lg font-semibold text-foreground"
      style={customStyle}
    >
      {value}
    </dd>
  </div>
);

const StatsCard = ({ stats, className = "" }) => {
  if (!stats) return null; // Eğer stat verisi yoksa, hiçbir şey gösterme

  return (
    <div className={`static-card ${className} w-full mx-auto`}>
      <div className="p-6">
        <dl className="grid grid-cols-2 md:grid-cols-6 gap-y-4 gap-x-2">
          <StatItem 
            label="Tier" 
            value={stats.tier} 
            customStyle={getTierColor(stats.tier)}
          />
          <StatItem 
            label="Win Rate" 
            value={stats.winRate} 
            customStyle={getWinRateColor(stats.winRate)}
          />
          <StatItem label="Rank" value={stats.rank} />
          <StatItem label="Pick Rate" value={stats.pickRate} />
          <StatItem label="Ban Rate" value={stats.banRate} />
          <StatItem label="Matches" value={stats.matches} />
        </dl>
      </div>
    </div>
  );
};

export default StatsCard;