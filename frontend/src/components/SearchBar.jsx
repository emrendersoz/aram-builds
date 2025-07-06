import React from 'react';

const SearchBar = ({ searchTerm, setSearchTerm, onSearch }) => {

  const handleSubmit = (event) => {
    event.preventDefault(); 
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto mb-8">
      <div className="flex items-center bg-gray-900 border-2 border-gray-700 rounded-full shadow-lg overflow-hidden">
        <input
          type="text"
          className="w-full bg-transparent text-white px-6 py-3 placeholder-gray-500 focus:outline-none"
          placeholder="Şampiyon ara (örn: Zed)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="submit"
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 py-3 transition-colors"
        >
          Ara
        </button>
      </div>
    </form>
  );
};

export default SearchBar;