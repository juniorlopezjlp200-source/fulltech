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
  return (
    <div className="absolute bottom-0 left-0 w-full z-40 bg-gradient-to-t from-black/50 to-transparent p-4 pt-8 md:relative md:bg-none md:bg-white/95 md:backdrop-blur-sm md:rounded-xl md:shadow-lg md:p-6 md:mx-4 md:mb-6 category-filters">
      <div className="flex flex-col gap-3 max-w-6xl mx-auto">
        {/* Search Bar */}
        <div className="relative search-bar">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <i className="fas fa-search text-muted-foreground text-sm"></i>
          </div>
          <input 
            type="search" 
            placeholder="Buscar productos..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white/95 backdrop-blur-sm border border-white/20 md:border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg md:shadow-sm"
            data-testid="input-search"
          />
        </div>
        
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:justify-center md:flex-wrap filter-pills">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`filter-pill px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors md:whitespace-normal ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/80 backdrop-blur-sm text-foreground hover:bg-white md:hover:bg-gray-50'
              }`}
              data-testid={`filter-${category.id}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
