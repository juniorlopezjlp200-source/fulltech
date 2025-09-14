import React from "react";

interface Category {
  id: string;
  name: string;
  icon: string; // opcional: por si luego quieres mostrar iconos
}

interface CategoryFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;              // se mantiene para compatibilidad con tu código
  onSearchChange: (term: string) => void; // se mantiene para compatibilidad
}

/**
 * Carrusel horizontal de categorías con:
 * - Scroll nativo (móvil/desktop)
 * - Flechas en desktop (md+)
 * - Degradés laterales (cosmético)
 * Mantiene tu API de props para no romper nada.
 */
export function CategoryFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  // estos dos no se usan aquí, pero se conservan para no romper tipos/prop drilling
  // (puedes usarlos si decides integrar una búsqueda dentro de este componente)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchTerm,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSearchChange,
}: CategoryFiltersProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const scrollBy = (px: number) => {
    ref.current?.scrollBy({ left: px, behavior: "smooth" });
  };

  return (
    <div className="absolute bottom-0 left-0 w-full z-40 bg-gradient-to-t from-black/50 to-transparent p-4 pt-4 md:relative md:bg-none md:bg-white/20 md:backdrop-blur-md md:rounded-2xl md:shadow-lg md:p-4 md:mx-6 md:mb-4 lg:mx-8 lg:p-6 category-filters">
      <div className="relative max-w-7xl mx-auto">
        {/* Degradés laterales (ayudan a indicar que hay más contenido) */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/15 to-transparent md:from-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/15 to-transparent md:from-transparent" />

        {/* Flechas (solo en md+) */}
        <button
          type="button"
          aria-label="Anterior"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 shadow"
          onClick={() => scrollBy(-280)}
        >
          <i className="fas fa-chevron-left text-gray-700" />
        </button>

        <button
          type="button"
          aria-label="Siguiente"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 shadow"
          onClick={() => scrollBy(280)}
        >
          <i className="fas fa-chevron-right text-gray-700" />
        </button>

        {/* Píldoras scrollables */}
        <div
          ref={ref}
          className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto pb-1 scrollbar-hide md:justify-center md:flex-nowrap filter-pills px-8"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
          onWheel={(e) => {
            // Rueda vertical -> scroll horizontal (mejor UX en desktop)
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              ref.current!.scrollLeft += e.deltaY;
            }
          }}
          role="tablist"
          aria-label="Categorías"
        >
          {categories.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`filter-pill px-3 py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all duration-300 hover:scale-105 md:whitespace-normal ${
                  active
                    ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20 border border-primary/40"
                    : "bg-white/80 backdrop-blur-sm text-foreground hover:bg-white hover:shadow-md md:hover:bg-gray-50 border border-white/30"
                }`}
                data-testid={`filter-${category.id}`}
                role="tab"
                aria-selected={active}
              >
                {/* Si quieres mostrar iconos, descomenta la línea de abajo */}
                {/* <i className={`${category.icon} mr-1.5`} /> */}
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
