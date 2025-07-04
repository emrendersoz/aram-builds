import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const Navbar = ({ searchTerm, setSearchTerm }) => {
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className="sticky top-4 w-full z-50">
      
      <div
        className={cn(
          "max-w-7xl mx-auto flex items-center justify-between p-2 pl-4",
          "transition-all duration-300",
          {
           
            "bg-huly-dark rounded-full": isScrolled,
            "[box-shadow:0_0_20px_theme(colors.accent/15%)]": isScrolled,
            
          }
        )}
      >
        <h1 className="text-xl font-bold text-foreground"  >ARAM Builds</h1>

        <div className="relative flex-grow max-w-xl mx-4 flex items-center">
          <div className="absolute left-1 text-foreground/50 pointer-events-none pl-2 py-2">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search Champion Builds"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-9 pr-4 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none border border-foreground/10 rounded-full transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 text-sm focus:animate-pulse-glow"
          />
        </div>
        
        <div>
          <button className="bg-white/10 text-foreground px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/20 transition-colors">
            Giriş Yap
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;