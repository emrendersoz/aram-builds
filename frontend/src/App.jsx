// src/App.jsx

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BuildCard from './components/BuildCard';
import ChampionHero from './components/ChampionHero';
import StatsCard from './components/StatsCard';
import { useDebounce } from './hooks/useDebounce';

// localStorage için kullanacağımız anahtar (key)
const PINNED_BUILDS_KEY = 'pinnedBuilds';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [latestVersion, setLatestVersion] = useState('');
  const [allBuildsData, setAllBuildsData] = useState(null);
  const [allSkillsData, setAllSkillsData] = useState(null);
  const [allStatsData, setAllStatsData] = useState(null);

  const [selectedChampionName, setSelectedChampionName] = useState('');
  const [championBuilds, setChampionBuilds] = useState(null);
  const [championSkills, setChampionSkills] = useState(null);
  const [championStats, setChampionStats] = useState(null);

  const [pinnedSite, setPinnedSite] = useState(null);

  // Uygulama yüklendiğinde verileri çek (Bu kısımda değişiklik yok)
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const [versionRes, buildsRes, skillsRes, statsRes] = await Promise.all([
          fetch('https://ddragon.leagueoflegends.com/api/versions.json'),
          fetch('http://localhost:3001/api/builds'),
          fetch('http://localhost:3001/api/skills'),
          fetch('http://localhost:3001/api/stats'),
        ]);
        const [versions, builds, skills, stats] = await Promise.all([
          versionRes.json(),
          buildsRes.json(),
          skillsRes.json(),
          statsRes.json(),
        ]);
        setLatestVersion(versions[0]);
        setAllBuildsData(builds);
        setAllSkillsData(skills);
        setAllStatsData(stats);
      } catch (error) {
        console.error('Ana veriler çekilemedi:', error);
      }
    };
    fetchGameData();
  }, []);

  // Arama kelimesi değiştiğinde şampiyon verilerini ayarla VE PIN DURUMUNU YÜKLE
  useEffect(() => {
    if (!allBuildsData || !allSkillsData || !allStatsData) return;

    const term = debouncedSearchTerm.trim().toLowerCase();

    // Arama terimi boşsa her şeyi temizle
    if (!term) {
      setSelectedChampionName('');
      setChampionBuilds(null);
      setChampionSkills(null);
      setChampionStats(null);
      setPinnedSite(null);
      return;
    }

    const matchedName = Object.keys(allBuildsData).find(
      (name) => name.toLowerCase() === term
    );

    if (matchedName) {
      setSelectedChampionName(matchedName);
      setChampionBuilds(allBuildsData[matchedName]);
      setChampionSkills(allSkillsData[matchedName]);
      setChampionStats(allStatsData[matchedName]);

      // 1. ADIM: localStorage'dan pin verisini OKU
      // Kayıtlı tüm pinleri bir obje olarak alıyoruz.
      const allPinned = JSON.parse(localStorage.getItem(PINNED_BUILDS_KEY) || '{}');
      // Bu şampiyona ait bir pin var mı diye kontrol et.
      const previouslyPinnedSite = allPinned[matchedName];
      // Varsa state'i güncelle, yoksa null yap.
      setPinnedSite(previouslyPinnedSite || null);

    } else {
      // Şampiyon bulunamadıysa her şeyi temizle
      setSelectedChampionName('');
      setChampionBuilds(null);
      setChampionSkills(null);
      setChampionStats(null);
      setPinnedSite(null);
    }
  }, [debouncedSearchTerm, allBuildsData, allSkillsData, allStatsData]);

  
  // 2. ADIM: Pin durumu değiştiğinde localStorage'a YAZ
  useEffect(() => {
    // Sadece bir şampiyon seçiliyken bu işlemi yap
    if (!selectedChampionName) return;

    const allPinned = JSON.parse(localStorage.getItem(PINNED_BUILDS_KEY) || '{}');

    if (pinnedSite) {
      // Eğer bir site pinlendiyse, şampiyon adını anahtar olarak kullanarak objeye ekle.
      allPinned[selectedChampionName] = pinnedSite;
    } else {
      // Eğer pin kaldırıldıysa (pinnedSite null ise), objeden bu şampiyonun kaydını sil.
      delete allPinned[selectedChampionName];
    }
    
    // Güncellenmiş objeyi tekrar string'e çevirip localStorage'a kaydet.
    localStorage.setItem(PINNED_BUILDS_KEY, JSON.stringify(allPinned));

  }, [pinnedSite, selectedChampionName]); // Bu effect, pin veya şampiyon değiştiğinde çalışır.


  // Pinleme yapıldığında sayfanın başına scroll yap (Bu kısımda değişiklik yok)
  useEffect(() => {
    if (pinnedSite) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pinnedSite]);

  const isReady = latestVersion && allBuildsData && allSkillsData && allStatsData;

  const buildsArray = Object.values(championBuilds || {});
  const sortedBuilds = pinnedSite
    ? [
        buildsArray.find(b => b.site === pinnedSite),
        ...buildsArray.filter(b => b.site !== pinnedSite)
      ].filter(Boolean)
    : buildsArray;

  return (
    <main className="relative min-h-screen bg-huly-dark text-foreground">
      <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20">
          {isReady ? (
            <>
              <ChampionHero
                key={`${selectedChampionName}-hero`}
                championName={selectedChampionName}
                latestVersion={latestVersion}
                skills={championSkills}
              />
              <StatsCard
                key={`${selectedChampionName}-stats`}
                stats={championStats}
                className="mt-8"
              />
              <div className="mt-8 flex flex-col items-center space-y-8">
                {championBuilds ? (
                  sortedBuilds.map((build) => (
                    <BuildCard
                      key={build.site}
                      build={build}
                      isPinned={build.site === pinnedSite}
                      onTogglePin={() =>
                        setPinnedSite(prev => (prev === build.site ? null : build.site))
                      }
                    />
                  ))
                ) : (
                  <p className="text-foreground/50 mt-16">
                    {debouncedSearchTerm
                      ? `'${debouncedSearchTerm}' için sonuç bulunamadı.`
                      : 'Lütfen bir şampiyon arayın.'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center mt-16 text-foreground/50">
              Veriler Yükleniyor...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;