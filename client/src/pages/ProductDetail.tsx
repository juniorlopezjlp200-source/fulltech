import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/TopBar";
import type { Product } from "@shared/schema";
import { formatPrice } from "@/utils/currency";

type MediaItem =
  | { type: "image"; url: string }
  | { type: "video"; url: string };

export default function ProductDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();

  const [selected, setSelected] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // swipe refs
  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);

  // datos
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const product = useMemo(
    () =>
      products.find((p) => String(p.id) === String(params.id)) ??
      products.find((p: any) => p.slug === params.id),
    [products, params.id],
  );

  // media combinado
  const media: MediaItem[] = useMemo(() => {
    const imgs = (product?.images || [])
      .filter(Boolean)
      .map((url) => ({ type: "image" as const, url }));
    const vids = (product?.videos || [])
      .filter(Boolean)
      .map((url) => ({ type: "video" as const, url }));
    return [...imgs, ...vids];
  }, [product]);

  // helpers
  const stars = (n: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`${i < n ? "fas" : "far"} fa-star text-sm text-yellow-400`}
        aria-hidden="true"
      />
    ));

  const handleBack = () => setLocation("/");

  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/product/${product?.id}`
      : `/product/${product?.id}`;

  const handleWhatsApp = () => {
    const msg = `Quiero más información sobre: ${product?.name} - ${product ? formatPrice(product.price) : ""}`;
    window.open(`https://wa.me/18295344286?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleShare = () => {
    const data = {
      title: `${product?.name} - FULLTECH`,
      text: `¡Mira este producto! ${product?.name} - ${product ? formatPrice(product.price) : ""}`,
      url: productUrl,
    };
    if (navigator.share) navigator.share(data);
    else window.open(`https://wa.me/18295344286?text=${encodeURIComponent(`${data.text}\n${productUrl}`)}`, "_blank");
  };

  // teclado en fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowLeft") setSelected((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setSelected((i) => Math.min(media.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, media.length]);

  // swipe
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    deltaX.current = e.touches[0].clientX - startX.current;
  };
  const onTouchEnd = () => {
    const d = deltaX.current;
    startX.current = null;
    deltaX.current = 0;
    if (d > 40) setSelected((i) => Math.max(0, i - 1));
    if (d < -40) setSelected((i) => Math.min(media.length - 1, i + 1));
  };

  // loading / not found
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-background">
        <TopBar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground">Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="w-full min-h-screen bg-background">
        <TopBar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <p className="text-4xl md:text-6xl mb-4">😕</p>
            <h3 className="text-lg md:text-2xl font-semibold mb-2">Producto no encontrado</h3>
            <button
              onClick={handleBack}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Volver al catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ¿Hay bloques de detalle para renderizar abajo?
  const hasExtended =
    Boolean(product.longDescription && product.longDescription.trim().length > 0) ||
    Boolean((product as any).specs && (Array.isArray((product as any).specs) ? (product as any).specs.length : Object.keys((product as any).specs || {}).length));

  return (
    <div className="w-full min-h-screen bg-background overflow-hidden">
      <div className="relative w-full h-screen">
        {/* VISOR PRINCIPAL */}
        <div
          className="absolute inset-0"
          onClick={() => setFullscreen(true)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {media[selected]?.type === "video" ? (
            <video
              src={media[selected].url}
              className="w-full h-full object-cover cursor-pointer"
              controls
              autoPlay
              muted
              loop
            />
          ) : (
            <img
              src={media[selected]?.url}
              alt={product.name}
              className="w-full h-full object-cover cursor-pointer select-none"
              draggable={false}
            />
          )}
        </div>

        {/* HEADER */}
        <div className="absolute top-0 left-0 w-full z-50">
          <TopBar />
        </div>

        {/* FAB COMPARTIR (siempre visible y por encima) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          className="fab-share-button absolute top-20 md:top-24 right-4 md:right-6 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/90 backdrop-blur-md border border-white/50 flex items-center justify-center hover:bg-white transition-all duration-300 z-[70] shadow-lg"
          title="Compartir"
          aria-label="Compartir"
        >
          <i className="fas fa-share-alt text-black text-sm md:text-base" />
        </button>

        {/* BACK */}
        <button
          onClick={handleBack}
          className="absolute top-20 md:top-24 left-4 md:left-8 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors z-[70] shadow-lg"
          title="Volver"
        >
          <i className="fas fa-arrow-left text-black text-sm md:text-base" />
        </button>

        {/* MINIATURAS — ENCIMA DE TODO */}
        {media.length > 1 && (
          <div className="absolute left-0 w-full bottom-24 md:bottom-28 z-[60] px-4 md:px-8 pointer-events-auto">
            <div className="mx-auto max-w-4xl flex gap-2 md:gap-3 justify-center overflow-x-auto pb-2">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(i);
                  }}
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all
                    backdrop-blur-sm bg-black/25
                    ${selected === i ? "border-white ring-2 ring-white/60" : "border-white/40 hover:border-white"}`}
                  title={m.type === "video" ? "Video" : "Imagen"}
                >
                  {m.type === "video" ? (
                    <div className="w-full h-full bg-black/70 flex items-center justify-center">
                      <i className="fas fa-play text-white" />
                    </div>
                  ) : (
                    <img
                      src={m.url}
                      alt={`${product.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OVERLAY INFO — MÁS ABAJO Y MENOR Z PARA NO TAPAR MINIATURAS */}
        <div
          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent
                     p-6 md:p-8 lg:p-12 z-40 pb-28 md:pb-36 lg:pb-40"
        >
          <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl space-y-3 md:space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-white/90 text-base md:text-lg lg:text-xl">{product.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex">{stars(product.rating || 5)}</div>
              <span className="text-sm md:text-base text-white/80">
                ({product.reviewCount || 0} reseñas)
              </span>
            </div>

            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <span className="text-3xl lg:text-4xl font-bold text-white">{formatPrice(product.price)}</span>
              <p className="text-sm text-white/80 mt-1">Precio incluye envío gratis</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsApp();
                }}
                className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-3 animate-pulse-ring"
              >
                <i className="fab fa-whatsapp text-xl"></i>
                Pedir por WhatsApp
              </button>

              {/* Quitamos el botón Compartir de aquí porque ahora es FAB arriba */}
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-gray-500/50 backdrop-blur-sm text-white py-3 rounded-xl font-medium hover:bg-gray-600/70 transition-colors flex items-center justify-center gap-2"
                  title="Favorito"
                >
                  <i className="far fa-heart"></i>
                  Favorito
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO EXTENDIDO (solo si existe) */}
      {hasExtended && (
        <section className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {product.longDescription && (
            <div className="bg-card text-card-foreground rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Descripción</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.longDescription}
              </p>
            </div>
          )}

          {(product as any).specs && (
            <div className="bg-card text-card-foreground rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Detalles técnicos</h2>
              {Array.isArray((product as any).specs) ? (
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {(product as any).specs.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : (
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries((product as any).specs as Record<string, string>).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="w-40 font-medium">{k}</dt>
                      <dd className="text-muted-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}
        </section>
      )}

      {/* FULLSCREEN */}
      {fullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/95">
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 left-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10"
            title="Cerrar"
          >
            <i className="fas fa-times text-white text-lg"></i>
          </button>

          {media.length > 1 && (
            <>
              <button
                onClick={() => setSelected((i) => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-3 rounded-full bg-white/15 hover:bg-white/25"
                title="Anterior"
              >
                <i className="fas fa-chevron-left text-white" />
              </button>
              <button
                onClick={() => setSelected((i) => Math.min(media.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-3 rounded-full bg-white/15 hover:bg-white/25"
                title="Siguiente"
              >
                <i className="fas fa-chevron-right text-white" />
              </button>
            </>
          )}

          <div className="w-full h-full flex items-center justify-center p-4">
            {media[selected]?.type === "video" ? (
              <video src={media[selected].url} className="max-w-full max-h-full" controls autoPlay />
            ) : (
              <img
                src={media[selected]?.url}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
