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
    <div className="absolute bottom-0 left-0 w-full z-40 bg-gradient-to-t from-black/50 to-transparent p-4 pt-8 md:relative md:bg-none md:bg-white/20 md:backdrop-blur-md md:rounded-2xl md:shadow-lg md:p-8 md:mx-6 md:mb-8 lg:mx-8 lg:p-10 category-filters">
      <div className="flex flex-col gap-4 md:gap-6 max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="relative search-bar md:max-w-2xl md:mx-auto lg:max-w-3xl">
          <div className="absolute left-4 md:left-5 top-1/2 transform -translate-y-1/2 z-10">
            <i className="fas fa-search text-muted-foreground text-sm md:text-base lg:text-lg"></i>
          </div>
          <input 
            type="search" 
            placeholder="Buscar productos..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-11 md:h-14 lg:h-16 pl-10 md:pl-14 lg:pl-16 pr-4 md:pr-6 bg-white/95 backdrop-blur-sm border border-white/20 md:border-gray-200 rounded-xl md:rounded-2xl text-sm md:text-base lg:text-lg focus:outline-none focus:ring-2 md:focus:ring-4 focus:ring-primary/50 shadow-lg md:shadow-xl hover:shadow-2xl transition-all duration-300"
            data-testid="input-search"
          />
        </div>
        
        {/* Filter Pills */}
        <div className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto pb-1 scrollbar-hide md:justify-center md:flex-wrap filter-pills">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`filter-pill px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 rounded-full text-sm md:text-base lg:text-lg font-medium whitespace-nowrap transition-all duration-300 hover:scale-105 md:whitespace-normal ${
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
  );
}
