// App.jsx (YENİ HALİ)
import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import BuildDisplay from './components/BuildDisplay'; // Doğrudan yeni component'i import ediyoruz
import './assets/item-sprite.css'; 
import './assets/rune-sprite.css'; 
import './assets/spell-sprite.css'; 

function App() {
  const [allBuilds, setAllBuilds] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChampionData, setSelectedChampionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/builds')
      .then(response => {
        if (!response.ok) throw new Error('Ağ yanıtı sorunsuz değil.');
        return response.json();
      })
      .then(data => setAllBuilds(data))
      .catch(err => {
        console.error("Veri çekme hatası:", err);
        setError("Build verileri yüklenemedi. Backend'in çalıştığından emin olun.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    if (!searchTerm) {
      setSelectedChampionData(null);
      return;
    }
    const formattedSearchTerm = searchTerm.trim().toLowerCase();
    const championName = Object.keys(allBuilds).find(
      name => name.toLowerCase() === formattedSearchTerm
    );

    if (championName) {
      setSelectedChampionData({
        name: championName,
        builds: allBuilds[championName]
      });
    } else {
      setSelectedChampionData({ name: searchTerm, builds: null });
    }
  };

  // --- RENDER KISMI (Factory olmadan, daha basit) ---
  if (loading) return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center"><h1 className="text-4xl animate-pulse">Veritabanı Yükleniyor...</h1></div>;
  if (error) return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center"><h1 className="text-4xl text-red-500">{error}</h1></div>;

  return (
    <div className="bg-gray-800 text-white min-h-screen font-sans">
      <header className="bg-gray-900 p-6 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-center text-cyan-400 mb-4">
            LoL ARAM Build Aggregator
          </h1>
          <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            onSearch={handleSearch} 
          />
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 md:p-8">
        {selectedChampionData ? (
          <div>
            <h2 className="text-5xl font-extrabold text-yellow-300 mb-8 text-center">{selectedChampionData.name}</h2>
            {selectedChampionData.builds ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Her site için doğrudan BuildDisplay'i render et */}
                {Object.entries(selectedChampionData.builds).map(([siteKey, buildData]) => (
                  <BuildDisplay
                    key={siteKey}
                    buildData={buildData}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-xl text-red-400">"{selectedChampionData.name}" için build bulunamadı. Lütfen adı kontrol edin.</p>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-16">
            <h2 className="text-3xl">Build'ini merak ettiğin şampiyonu ara!</h2>
            <p className="mt-2">Başlamak için yukarıdaki arama çubuğunu kullan.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;