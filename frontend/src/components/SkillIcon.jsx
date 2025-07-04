// src/components/SkillIcon.jsx

// Component artık 'latestVersion'ı prop olarak alıyor.
const SkillIcon = ({ championName, skillKey, latestVersion }) => {
  // Eğer gerekli prop'lar henüz gelmediyse, hata vermemek için boş bir kutu göster.
  if (!latestVersion || !championName || !skillKey) {
    return <div className="w-10 h-10 bg-gray-800 rounded-md" />;
  }
  
  // const LATEST_VERSION = "14.9.1"; // <-- BU SABİT SATIRI KALDIRDIK.
  
  // URL'yi artık dışarıdan gelen 'latestVersion' prop'u ile oluşturuyoruz.
  const skillImageUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${championName}${skillKey}.png`;

  return (
    // Ana kapsayıcı - Pozisyonlama için
    <div className="relative w-9 h-9 shrink-0">
      {/* Skill resmi */}
      <img 
        src={skillImageUrl} 
        alt={`${championName} ${skillKey}`}
        className="w-full h-full rounded-md border border-black/30"
      />
      {/* Sağ alttaki harf */}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-huly-dark border border-foreground/30 rounded-md flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{skillKey}</span>
      </div>
    </div>
  );
};

export default SkillIcon;