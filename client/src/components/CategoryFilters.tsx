import { useState } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function CategoryFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
}: CategoryFiltersProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      {/* Categorías principales */}
      <div className="absolute bottom-0 left-0 w-full z-40 bg-gradient-to-t from-black/50 to-transparent p-4 pt-6 md:relative md:bg-none md:bg-white/20 md:backdrop-blur-md md:rounded-2xl md:shadow-lg md:p-6 md:mx-6 md:mb-6 lg:mx-8 lg:p-8 category-filters">
        <div className="flex flex-col gap-3 md:gap-4 max-w-7xl mx-auto">
          {/* Filter Pills */}
          <div className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto pb-1 scrollbar-hide md:justify-center md:flex-wrap filter-pills">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`filter-pill px-4 py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all duration-300 hover:scale-105 md:whitespace-normal ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20'
                    : 'bg-white/80 backdrop-blur-sm text-foreground hover:bg-white hover:shadow-md md:hover:bg-gray-50'
                }`}
                data-testid={`filter-${category.id}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buscador expandible en esquina inferior derecha */}
      <div className="fixed bottom-32 right-6 z-50 md:bottom-36 md:right-8">
        <div className="flex flex-col items-end gap-2">
          {/* Barra de búsqueda expandible */}
          {isSearchOpen && (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-3 w-80 max-w-[calc(100vw-3rem)] transform transition-all duration-300">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-search text-gray-400 text-sm"></i>
                </div>
                <input 
                  type="search" 
                  placeholder="Buscar productos..." 
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                  data-testid="input-search"
                  autoFocus
                />
              </div>
            </div>
          )}
          
          {/* Botón de búsqueda */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
              isSearchOpen 
                ? 'bg-primary text-white scale-110 shadow-primary/25' 
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105'
            }`}
            title={isSearchOpen ? 'Cerrar búsqueda' : 'Buscar productos'}
            aria-label={isSearchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
          >
            <i className={`fas transition-transform duration-200 ${
              isSearchOpen ? 'fa-times' : 'fa-search'
            }`}></i>
          </button>
        </div>
      </div>
    </>
  );
}
