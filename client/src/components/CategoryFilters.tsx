import React from "react";

interface Category {
  id: string;
  name: string;
  icon: string; // opcional
}

interface CategoryFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  // se mantienen para compatibilidad con tu código, pero NO se usan aquí
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

/**
 * Carrusel horizontal de categorías (SOLO el carrusel).
 * - Mobile: full-bleed (ocupa TODA la pantalla a lo ancho), scroll con el dedo
 * - Desktop: flechas laterales (md+)
 * - Degradés laterales para indicar overflow
 * - Mantiene la API de props original
 */
export function CategoryFilters({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFiltersProps) {
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const scrollBy = (px: number) => {
    listRef.current?.scrollBy({ left: px, behavior: "smooth" });
  };

  return (
    <div
      className={[
        // full-bleed en móvil, centrado respecto a la ventana
        "absolute left-1/2 -translate-x-1/2 bottom-4 z-40 w-screen",
        // en md+ usamos el ancho del contenedor normal
        "md:relative md:left-0 md:translate-x-0 md:bottom-0 md:w-full",
        // padding vertical suave
        "px-0 md:px-6 lg:px-8",
      ].join(" ")}
    >
      <div className="relative w-full">
        {/* Degradés laterales (solo cosmético) */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/15 to-transparent md:from-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/15 to-transparent md:from-transparent" />

        {/* Flechas (solo en md+) */}
        <button
          type="button"
          aria-label="Anterior"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/85 p-1 shadow"
          onClick={() => scrollBy(-320)}
        >
          <i className="fas fa-chevron-left text-gray-700" />
        </button>

        <button
          type="button"
          aria-label="Siguiente"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/85 p-1 shadow"
          onClick={() => scrollBy(320)}
        >
          <i className="fas fa-chevron-right text-gray-700" />
        </button>

        {/* Lista scrollable de categorías */}
        <div
          ref={listRef}
          className="w-screen md:w-full overflow-x-auto scrollbar-hide px-4 md:px-8"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onWheel={(e) => {
            // En desktop: rueda vertical -> scroll horizontal
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              listRef.current!.scrollLeft += e.deltaY;
            }
          }}
          role="tablist"
          aria-label="Categorías"
        >
          {/* w-max permite que el contenido se desborde en móvil; en md+ centramos */}
          <div className="flex gap-2 md:gap-3 lg:gap-4 w-max md:w-full md:flex-wrap md:justify-center">
            {categories.map((category) => {
              const active = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={[
                    "min-w-[150px] text-center",
                    "px-3 py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5",
                    "rounded-full text-sm md:text-base font-medium whitespace-nowrap",
                    "transition-all duration-300 hover:scale-105 shadow",
                    active
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/20 border border-primary/40"
                      : "bg-white/90 text-foreground hover:bg-white border border-white/40",
                  ].join(" ")}
                  data-testid={`filter-${category.id}`}
                  role="tab"
                  aria-selected={active}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
