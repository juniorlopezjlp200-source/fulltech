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
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

/**
 * Barra centrada (Buscar / All / Ofertas) + carrusel horizontal de categorías.
 * - Scroll nativo en móvil y flechas en desktop (md+)
 * - Degradés laterales para indicar overflow
 * - Ocupa el ancho completo del contenedor
 */
export function CategoryFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
}: CategoryFiltersProps) {
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const scrollBy = (px: number) => {
    listRef.current?.scrollBy({ left: px, behavior: "smooth" });
  };

  const isAll = selectedCategory === "all";
  const isOffers = selectedCategory === "__offers__";

  return (
    <div className="absolute inset-x-0 bottom-6 z-40 px-4 flex flex-col gap-4 md:relative md:bottom-0 md:mx-6 md:my-4 lg:mx-8 lg:my-6">
      {/* 🔍 Buscar / All / Ofertas (centrado) */}
      <div className="flex justify-center">
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/45 backdrop-blur-md shadow-lg border border-white/10">
          {/* Buscar */}
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/70 text-xs" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar…"
              className="h-9 w-36 sm:w-48 md:w-56 pl-8 pr-3 rounded-full text-sm text-white placeholder-white/70 bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* All */}
          <button
            onClick={() => onCategoryChange("all")}
            className={[
              "px-3 py-1.5 text-sm md:text-base font-medium rounded-full shadow transition",
              isAll
                ? "bg-white text-blue-600 hover:scale-105"
                : "bg-white/15 text-white/80 hover:bg-white/25",
            ].join(" ")}
            data-testid="filter-all"
            aria-pressed={isAll}
            aria-label="Mostrar todos"
          >
            All
          </button>

          {/* Ofertas */}
          <button
            onClick={() => onCategoryChange("__offers__")}
            className={[
              "px-3 py-1.5 text-sm md:text-base font-medium rounded-full shadow transition",
              isOffers
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:scale-105"
                : "bg-white/15 text-red-200 hover:bg-red-500/20",
            ].join(" ")}
            data-testid="filter-offers"
            aria-pressed={isOffers}
            aria-label="Solo ofertas"
          >
            <span className="inline-flex items-center gap-1">
              <i className="fas fa-fire text-xs" />
              Ofertas
            </span>
          </button>
        </div>
      </div>

      {/* 📂 Carrusel de categorías ocupando todo el ancho */}
      <div className="relative w-full">
        {/* Degradés laterales (muestran que hay más contenido) */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/15 to-transparent md:from-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/15 to-transparent md:from-transparent" />

        {/* Flechas (solo en md+) */}
        <button
          type="button"
          aria-label="Anterior"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 p-1 shadow"
          onClick={() => scrollBy(-320)}
        >
          <i className="fas fa-chevron-left text-gray-700" />
        </button>

        <button
          type="button"
          aria-label="Siguiente"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 p-1 shadow"
          onClick={() => scrollBy(320)}
        >
          <i className="fas fa-chevron-right text-gray-700" />
        </button>

        {/* Lista scrollable */}
        <div
          ref={listRef}
          className="w-full overflow-x-auto scrollbar-hide px-8"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onWheel={(e) => {
            // Rueda vertical -> scroll horizontal en desktop
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              listRef.current!.scrollLeft += e.deltaY;
            }
          }}
          role="tablist"
          aria-label="Categorías"
        >
          {/* w-max asegura que el contenido pueda desbordar;
              en md+ hacemos wrap para centrar y rellenar */}
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
                  {/* Para iconos, descomenta: */}
                  {/* <i className={`${category.icon} mr-1.5`} /> */}
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
