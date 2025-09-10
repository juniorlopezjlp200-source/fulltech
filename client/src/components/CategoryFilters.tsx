
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
    <div className="absolute bottom-0 left-0 w-full z-40 bg-gradient-to-t from-black/50 to-transparent p-4 pt-4 md:relative md:bg-none md:bg-white/20 md:backdrop-blur-md md:rounded-2xl md:shadow-lg md:p-4 md:mx-6 md:mb-4 lg:mx-8 lg:p-6 category-filters">
      <div className="flex flex-col gap-2 md:gap-3 max-w-7xl mx-auto">
        {/* Filter Pills */}
        <div className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto pb-1 scrollbar-hide md:justify-center md:flex-wrap filter-pills">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`filter-pill px-3 py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all duration-300 hover:scale-105 md:whitespace-normal ${
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
