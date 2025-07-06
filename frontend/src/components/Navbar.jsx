import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PressIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 13l5 5 5-5"></path>
    <path d="M12 6v12"></path>
  </svg>
);

const Navbar = ({ searchTerm, setSearchTerm, suggestions, showSuggestions, onTabComplete, onSuggestionClick, hideSearchBar, onLogoClick  }) => {
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
          "max-w-5xl mx-auto flex items-center justify-between p-2 px-4",
          "transition-all duration-300",
          {
            "bg-huly-dark rounded-full": isScrolled,
            "[box-shadow:0_0_20px_theme(colors.accent/15%)]": isScrolled,
          }
        )}
      >
        <Link to="/" onClick={onLogoClick} className="text-xl font-bold text-foreground no-underline">
          ARAM Builds
        </Link>

        {!hideSearchBar && (
          <div className="relative flex-grow max-w-xl mx-4 flex items-center">
            <div className="absolute left-1 text-foreground/50 pointer-events-none pl-2 py-2">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search Champion Builds"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
                  e.preventDefault();
                  onTabComplete();
                }
              }}
              className="w-full bg-transparent pl-9 pr-4 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none border border-foreground/10 rounded-full transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 text-sm focus:animate-pulse-glow"
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-huly-dark border border-foreground/10 rounded-lg shadow-xl overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    onClick={() => onSuggestionClick(suggestion)}
                    className={cn(
                      "px-4 py-2 cursor-pointer transition-colors text-sm flex items-center justify-between",
                      "hover:bg-accent/10 hover:text-accent",
                      {
                        "bg-accent/10 text-accent": index === 0,
                      }
                    )}
                  >
                    <span className="font-medium">{suggestion}</span>
                    {index === 0 && (
                      <div className="flex items-center gap-1">
                        <PressIcon className="text-foreground/50 animate-bounce" />
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
        )}
        
        <div>
          <Link to="/tierlist" className="bg-white/10 text-foreground px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/20 transition-colors no-underline">
            Tier List
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;