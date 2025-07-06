import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import BuildCard from './components/BuildCard';
import ChampionHero from './components/ChampionHero';
import StatsCard from './components/StatsCard';
import TierListPage from './components/TierListPage';

import { useDebounce } from './hooks/useDebounce';

import './assets/item-sprite.css';
import './assets/champion-sprite.css';

const PINNED_BUILDS_KEY = 'pinnedBuilds';

const HomePage = ({
  isReady,
  selectedChampionName,
  latestVersion,
  championSkills,
  championSpellIds,
  championStats,
  championBuilds,
  pinnedSite,
  setPinnedSite,
  hasSearchedBefore,
  searchTerm,
  setSearchTerm,
  suggestions,
  showSuggestions,
  handleTabComplete,
  handleSuggestionClick
}) => {
  const buildsArray = Object.values(championBuilds || {});
  const sortedBuilds = pinnedSite
    ? [
        buildsArray.find(b => b.site === pinnedSite),
        ...buildsArray.filter(b => b.site !== pinnedSite)
      ].filter(Boolean)
    : buildsArray;

  // İlk giriş ekranı
if (!hasSearchedBefore) {
  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center px-4">
      <h1 class="p-5 relative z-30 max-w-[616px] bg-gradient-to-br from-white from-30% via-[#d5d8f6] via-80% to-[#fdf7fe] bg-clip-text text-[84px] font-semibold leading-[0.9] tracking-tight text-transparent lg:max-w-[528px] lg:text-[72px] md:max-w-[441px] md:text-[56px] sm:max-w-64 sm:text-[32px]">
  ARAM Builds
</h1>
      
      <div className="relative w-full max-w-2xl">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-foreground/50 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
    <input
  type="text"
  placeholder="Search Champion Builds"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      handleTabComplete();
    }
  }}
  className="w-full pl-12 pr-6 py-4 text-lg text-foreground placeholder:text-foreground/50 focus:outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 focus:animate-pulse-glow bg-transparent border border-foreground/10 rounded-full"
/>
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-sm border rounded-lg shadow-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 11, 13, 0.95) 0%, rgba(15, 16, 18, 0.95) 50%, rgba(10, 11, 13, 0.95) 100%)',
              border: '1px solid rgba(71, 85, 105, 0.3)'
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-6 py-3 cursor-pointer transition-colors text-base flex items-center justify-between hover:bg-accent/10 hover:text-accent ${
                  index === 0 ? 'bg-accent/10 text-accent' : ''
                }`}
              >
                <span className="font-medium">{suggestion}</span>
                {index === 0 && (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/50 animate-bounce">
                      <path d="M7 13l5 5 5-5"></path>
                      <path d="M12 6v12"></path>
                    </svg>
                    <span className="bg-foreground/10 text-foreground/70 px-2 py-0.5 rounded text-xs font-mono border border-foreground/20">
                      TAB
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

  // Normal görünüm
  return (
    <div className="max-w-5xl mx-auto px-4 p-2 pl-4">
      <div className="pt-8 pb-8">
        {isReady ? (
          <>
            {selectedChampionName && (
              <>
                <ChampionHero
                  key={`${selectedChampionName}-hero`}
                  championName={selectedChampionName}
                  latestVersion={latestVersion}
                  skills={championSkills}
                  spellIds={championSpellIds}
                  
                />
                <StatsCard
                  key={`${selectedChampionName}-stats`}
                  stats={championStats}
                  className="mt-6"
                />
              </>
            )}
            <div className="mt-6 flex flex-col items-center space-y-6">
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
                !selectedChampionName && (
                  <p className="text-foreground/50 mt-8">
                    Lütfen bir şampiyon arayın.
                  </p>
                )
              )}
            </div>
          </>
        ) : (
          <div className="text-center mt-8 text-foreground/50">
            Veriler Yükleniyor...
          </div>
        )}
      </div>
    </div>
  );
};


const LoadingIndicator = () => (
  <div className="min-h-screen flex items-center justify-center bg-huly-dark">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-accent/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-foreground/70 text-lg">Loading ARAM Builds...</p>
    </div>
  </div>
);

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
  const [championSpellIds, setChampionSpellIds] = useState(null);
  const [pinnedSite, setPinnedSite] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearchedBefore, setHasSearchedBefore] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.state?.championName) {
      setSearchTerm(location.state.championName);
      setHasSearchedBefore(true);
      navigate(location.pathname, { replace: true, state: {} }); 
    }
  }, [location, navigate]);

  const fetchChampionSpells = async (championName, version) => {
    try {
      const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championName}.json`);
      const data = await response.json();
      const championData = data.data[championName];
      const spells = championData.spells;
      const skillIds = { Q: spells[0].id, W: spells[1].id, E: spells[2].id, R: spells[3].id };
      return skillIds;
    } catch (error) {
      console.error('Champion spell data fetch error:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchGameData = async () => {
      try {
      // Render.com'daki backend URL'inizi buraya yazın
      const baseURL = import.meta.env.MODE === 'production' 
        ? 'https://aram-builds.onrender.com' 
        : 'http://localhost:3001';
        
      const [versionRes, buildsRes, skillsRes, statsRes] = await Promise.all([
        fetch('https://ddragon.leagueoflegends.com/api/versions.json'),
        fetch(`${baseURL}/api/builds`),
        fetch(`${baseURL}/api/skills`),
        fetch(`${baseURL}/api/stats`),
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

  useEffect(() => {
    if (!allBuildsData) return;
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matchedChampions = Object.keys(allBuildsData).filter(
      (name) => name.toLowerCase().startsWith(term)
    );
    setSuggestions(matchedChampions);
    setShowSuggestions(matchedChampions.length > 0);
  }, [searchTerm, allBuildsData]);

  useEffect(() => {
    if (!allBuildsData || !allSkillsData || !allStatsData) return;
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) {
      return;
    }
    const matchedName = Object.keys(allBuildsData).find((name) => name.toLowerCase() === term);
    if (matchedName) {
      setSelectedChampionName(matchedName);
      setChampionBuilds(allBuildsData[matchedName]);
      setChampionSkills(allSkillsData[matchedName]);
      setChampionStats(allStatsData[matchedName]);
      setShowSuggestions(false);
      setHasSearchedBefore(true); 
      if (latestVersion) {
        fetchChampionSpells(matchedName, latestVersion).then(setChampionSpellIds);
      }
      const allPinned = JSON.parse(localStorage.getItem(PINNED_BUILDS_KEY) || '{}');
      setPinnedSite(allPinned[matchedName] || null);
    }
  }, [debouncedSearchTerm, allBuildsData, allSkillsData, allStatsData, latestVersion]);

  useEffect(() => {
    if (!selectedChampionName) return;
    const allPinned = JSON.parse(localStorage.getItem(PINNED_BUILDS_KEY) || '{}');
    if (pinnedSite) {
      allPinned[selectedChampionName] = pinnedSite;
    } else {
      delete allPinned[selectedChampionName];
    }
    localStorage.setItem(PINNED_BUILDS_KEY, JSON.stringify(allPinned));
  }, [pinnedSite, selectedChampionName]);

  useEffect(() => {
    if (pinnedSite) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pinnedSite]);

  const handleTabComplete = () => {
    if (suggestions.length > 0) {
      setSearchTerm(suggestions[0]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };
  
  const isReady = latestVersion && allBuildsData && allSkillsData && allStatsData;

 return (
  <main className="relative min-h-screen bg-huly-dark text-foreground">
 
{hasSearchedBefore && (
  <Navbar 
    searchTerm={searchTerm} 
    setSearchTerm={setSearchTerm}
    suggestions={suggestions}
    showSuggestions={showSuggestions}
    onTabComplete={handleTabComplete}
    onSuggestionClick={handleSuggestionClick}
    hideSearchBar={!hasSearchedBefore}
    onLogoClick={() => {
      setHasSearchedBefore(false);
      setSearchTerm('');
      setSelectedChampionName('');
      setChampionBuilds(null);
      setChampionSkills(null);
      setChampionStats(null);
      setChampionSpellIds(null);
      setPinnedSite(null);
      navigate('/');
    }}
  />
)}
    <Routes>
      <Route 
        path="/" 
        element={
          <HomePage 
            isReady={isReady}
            selectedChampionName={selectedChampionName}
            latestVersion={latestVersion}
            championSkills={championSkills}
            championSpellIds={championSpellIds}
            championStats={championStats}
            championBuilds={championBuilds}
            debouncedSearchTerm={debouncedSearchTerm}
            pinnedSite={pinnedSite}
            setPinnedSite={setPinnedSite}
            hasSearchedBefore={hasSearchedBefore}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            handleTabComplete={handleTabComplete}
            handleSuggestionClick={handleSuggestionClick}
          />
        } 
      />
      <Route 
        path="/tierlist" 
        element={<TierListPage allStatsData={allStatsData} />} 
      />
    </Routes>
  </main>
);
};

const AppWrapper = () => (
  <BrowserRouter basename="/aram-builds">
    <App />
  </BrowserRouter>
);

export default AppWrapper;