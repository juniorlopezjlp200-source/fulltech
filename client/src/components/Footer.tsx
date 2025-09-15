import { useState } from 'react';
import { Link } from 'wouter';
import { getConfigValue, useConfigLoader } from '@/lib/config';

export function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);
  useConfigLoader();

  // Tu enlace de ubicación (lo convertimos a embed de Google Maps)
  const rawShareUrl = 'https://share.google/x9dc1sw5UDFJg41KB';
  const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(rawShareUrl)}&output=embed`;

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="py-3">
          {/* Móvil */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center">
                  <i className="fas fa-microchip text-primary text-sm"></i>
                </Link>
                <span className="text-muted-foreground">|</span>

                {/* Antes decía “Rifa” -> ahora Ubicación */}
                <div className="flex items-center gap-1">
                  <i className="fas fa-map-marker-alt text-primary text-sm shadow-sm"></i>
                  <span className="text-muted-foreground">Ubicación</span>
                </div>

                <span className="text-muted-foreground">|</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs font-medium animate-pulse">
                    Síguenos
                  </span>
                  {getConfigValue('social_facebook') && (
                    <a
                      href={getConfigValue('social_facebook')}
                      className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-facebook-f text-xs"></i>
                    </a>
                  )}
                  {getConfigValue('social_instagram') && (
                    <a
                      href={getConfigValue('social_instagram')}
                      className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-md hover:shadow-lg"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-instagram text-xs"></i>
                    </a>
                  )}
                  {getConfigValue('social_tiktok') && (
                    <a
                      href={getConfigValue('social_tiktok')}
                      className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-tiktok text-xs"></i>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="flex items-center gap-1">
                  <i className="fas fa-shield-alt text-green-600 text-sm shadow-sm"></i>
                  <i className="fas fa-truck text-blue-600 text-sm shadow-sm"></i>
                </span>
                <button onClick={() => setIsExpanded(!isExpanded)} className="ml-1">
                  <i
                    className={`fas fa-chevron-${isExpanded ? 'down' : 'up'} text-muted-foreground`}
                  ></i>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <i className="fas fa-microchip text-primary text-lg"></i>
                  <span className="font-semibold text-primary text-sm">
                    {getConfigValue('site_name', 'FULLTECH')}
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-shield-alt text-green-600"></i>
                    Garantía
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-truck text-blue-600"></i>
                    Envío Gratis
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fab fa-whatsapp text-green-600"></i>
                    24/7
                  </span>
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)}>
                  <i
                    className={`fas fa-chevron-${isExpanded ? 'down' : 'up'} text-muted-foreground transition-transform`}
                  ></i>
                </button>
              </div>
            </div>

            {/* Segunda línea: reemplazo de “Rifa” por “Ubicación” */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-primary"></i>
                  <span className="text-muted-foreground">Nuestra Ubicación</span>
                  <a
                    href={rawShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
                  >
                    Ver en Google Maps
                  </a>
                </div>

                {/* Redes sociales */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-medium animate-pulse">
                    Síguenos
                  </span>
                  {getConfigValue('social_facebook') && (
                    <a
                      href={getConfigValue('social_facebook')}
                      className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-110"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-facebook-f text-sm"></i>
                    </a>
                  )}
                  {getConfigValue('social_instagram') && (
                    <a
                      href={getConfigValue('social_instagram')}
                      className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg hover:shadow-xl"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-instagram text-sm"></i>
                    </a>
                  )}
                  {getConfigValue('social_tiktok') && (
                    <a
                      href={getConfigValue('social_tiktok')}
                      className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-110"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-tiktok text-sm"></i>
                    </a>
                  )}
                </div>
              </div>

              <div className="text-muted-foreground">
                © {new Date().getFullYear()} {getConfigValue('site_name', 'FULLTECH')}. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer expandido */}
      {isExpanded && (
        <div className="border-t border-border bg-card max-h-96 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* 🔁 ANTES: “Programa de Referidos” -> AHORA: Tarjeta de Ubicación */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border shadow-lg hover:shadow-xl transition-all mb-8">
              <h3 className="text-xl font-bold text-center text-foreground mb-6 flex items-center justify-center gap-2">
                <i className="fas fa-map-marker-alt text-primary text-xl"></i>
                Nuestra Ubicación
              </h3>

              <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
                <iframe
                  src={mapsEmbedSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                ></iframe>
              </div>

              <div className="text-center">
                <a
                  href={rawShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10"
                >
                  <i className="fas fa-external-link-alt"></i>
                  Abrir en Google Maps
                </a>
              </div>
            </div>

            {/* 2) REDES SOCIALES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border shadow-lg hover:shadow-xl transition-all mb-8">
              <h3 className="text-xl font-bold text-center text-foreground mb-6">Síguenos en Redes Sociales</h3>
              <div className="flex justify-center items-center gap-6">
                {getConfigValue('social_facebook') && (
                  <a
                    href={getConfigValue('social_facebook')}
                    className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all shadow-lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-facebook-f text-lg"></i>
                  </a>
                )}
                {getConfigValue('social_instagram') && (
                  <a
                    href={getConfigValue('social_instagram')}
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-instagram text-lg"></i>
                  </a>
                )}
                {getConfigValue('social_tiktok') && (
                  <a
                    href={getConfigValue('social_tiktok')}
                    className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 hover:scale-110 transition-all shadow-lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-tiktok text-lg"></i>
                  </a>
                )}
              </div>
            </div>

            {/* 3) COMPRAS Y SERVICIOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border shadow-lg hover:shadow-xl transition-all">
                <h3 className="font-semibold text-foreground mb-4 text-center">🛒 Compras</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors block text-center">Catálogo</Link></li>
                  <li><Link href="/offers" className="text-muted-foreground hover:text-primary transition-colors block text-center">Ofertas</Link></li>
                  <li><Link href="/new-arrivals" className="text-muted-foreground hover:text-primary transition-colors block text-center">Nuevos Productos</Link></li>
                  <li><Link href="/brands" className="text-muted-foreground hover:text-primary transition-colors block text-center">Marcas</Link></li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border shadow-lg hover:shadow-xl transition-all">
                <h3 className="font-semibold text-foreground mb-4 text-center">🔧 Servicios</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/garantia" className="text-muted-foreground hover:text-primary transition-colors block text-center">Garantía</Link></li>
                  <li><Link href="/reembolsos" className="text-muted-foreground hover:text-primary transition-colors block text-center">Reembolsos</Link></li>
                  <li><Link href="/contacto" className="text-muted-foreground hover:text-primary transition-colors block text-center">Soporte Técnico</Link></li>
                  <li>
                    <a
                      href={`https://wa.me/${getConfigValue('contact_whatsapp', '15551234567')}?text=Hola%20${getConfigValue('site_name', 'FULLTECH')},%20necesito%20ayuda`}
                      className="text-muted-foreground hover:text-primary transition-colors block text-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Chat WhatsApp
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* 4) Legal + Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4 text-center">📋 Información Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/sobre-nosotros" className="text-muted-foreground hover:text-primary transition-colors block text-center">Sobre Nosotros</Link></li>
                  <li><Link href="/privacidad" className="text-muted-foreground hover:text-primary transition-colors block text-center">Política de Privacidad</Link></li>
                  <li><Link href="/terminos" className="text-muted-foreground hover:text-primary transition-colors block text-center">Términos y Condiciones</Link></li>
                  <li><Link href="/contacto" className="text-muted-foreground hover:text-primary transition-colors block text-center">Contacto</Link></li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4 text-center">📞 Contacto</h3>
                <div className="space-y-2 text-sm text-muted-foreground text-center">
                  {getConfigValue('contact_phone') && (
                    <div className="flex items-center justify-center gap-2">
                      <i className="fas fa-phone text-primary"></i>
                      <span>{getConfigValue('contact_phone')}</span>
                    </div>
                  )}
                  {getConfigValue('contact_email') && (
                    <div className="flex items-center justify-center gap-2">
                      <i className="fas fa-envelope text-primary"></i>
                      <a
                        href={`mailto:${getConfigValue('contact_email')}`}
                        className="hover:text-primary transition-colors"
                      >
                        {getConfigValue('contact_email')}
                      </a>
                    </div>
                  )}
                  {getConfigValue('contact_hours') && (
                    <div className="flex items-center justify-center gap-2">
                      <i className="fas fa-clock text-primary"></i>
                      <span>{getConfigValue('contact_hours')}</span>
                    </div>
                  )}
                  {getConfigValue('footer_address') && (
                    <div className="flex items-start justify-center gap-2">
                      <i className="fas fa-map-marker-alt text-primary mt-0.5"></i>
                      <span>{getConfigValue('footer_address')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-border mt-8 pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {getConfigValue(
                    'footer_copyright',
                    `© ${new Date().getFullYear()} FULLTECH. Todos los derechos reservados.`
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-shield-alt text-green-600"></i>
                    Compra Segura
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-truck text-blue-600"></i>
                    Envío Gratis
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-medal text-yellow-600"></i>
                    Garantía 12 Meses
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
