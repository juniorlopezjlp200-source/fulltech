import { useState } from 'react';
import { Link } from 'wouter';
import { getConfigValue, useConfigLoader } from '@/lib/config';

export function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Load configurations
  useConfigLoader();

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="py-3">
          {/* En móvil: Una sola línea compacta y delicada */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center">
                  <i className="fas fa-microchip text-primary text-sm"></i>
                </Link>
                <span className="text-muted-foreground">|</span>
                <div className="flex items-center gap-1">
                  <i className="fas fa-gift text-yellow-600 text-sm shadow-sm"></i>
                  <span className="text-muted-foreground">Rifa</span>
                </div>
                <span className="text-muted-foreground">|</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs font-medium animate-pulse">Síguenos</span>
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
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="ml-1"
                >
                  <i className={`fas fa-chevron-${isExpanded ? 'down' : 'up'} text-muted-foreground`}></i>
                </button>
              </div>
            </div>
          </div>

          {/* En desktop: Dos líneas como antes */}
          <div className="hidden md:block">
            {/* Primera línea: Logo, servicios y flecha */}
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
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <i className={`fas fa-chevron-${isExpanded ? 'down' : 'up'} text-muted-foreground transition-transform`}></i>
                </button>
              </div>
            </div>

            {/* Segunda línea: Rifas, Redes Sociales y Copyright */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                {/* Rifas */}
                <div className="flex items-center gap-2">
                  <i className="fas fa-gift text-yellow-600"></i>
                  <span className="text-muted-foreground">Rifa Mensual</span>
                  <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded text-xs font-medium">
                    iPhone 15 Pro
                  </span>
                </div>
                
                {/* Redes sociales */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-medium animate-pulse">Síguenos</span>
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
              
              {/* Copyright */}
              <div className="text-muted-foreground">
                © {new Date().getFullYear()} {getConfigValue('site_name', 'FULLTECH')}. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer expandido - solo visible cuando se hace click */}
      {isExpanded && (
        <div className="border-t border-border bg-card max-h-96 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* 1. PROGRAMA DE REFERIDOS - LO MÁS IMPORTANTE AL FRENTE */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-950 dark:to-orange-900 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-all mb-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-4 flex items-center justify-center gap-2">
                  <i className="fas fa-gift text-3xl animate-bounce"></i>
                  Programa de Referidos FULLTECH
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-lg mb-6">
                  ¡Gana 5% de descuento por cada amigo que refiere + participa en rifas mensuales!
                </p>
              </div>
            </div>

            {/* 2. REDES SOCIALES - IMPORTANTE PARA MARKETING */}
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

            {/* 3. COMPRAS Y SERVICIOS - IMPORTANTE PARA USUARIOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Compras */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border shadow-lg hover:shadow-xl transition-all">
                <h3 className="font-semibold text-foreground mb-4 text-center">🛒 Compras</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Catálogo
                    </Link>
                  </li>
                  <li>
                    <Link href="/offers" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Ofertas
                    </Link>
                  </li>
                  <li>
                    <Link href="/new-arrivals" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Nuevos Productos
                    </Link>
                  </li>
                  <li>
                    <Link href="/brands" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Marcas
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Servicios */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border shadow-lg hover:shadow-xl transition-all">
                <h3 className="font-semibold text-foreground mb-4 text-center">🔧 Servicios</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/garantia" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Garantía
                    </Link>
                  </li>
                  <li>
                    <Link href="/reembolsos" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Reembolsos
                    </Link>
                  </li>
                  <li>
                    <Link href="/contacto" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Soporte Técnico
                    </Link>
                  </li>
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

            {/* 4. AL FINAL - INFORMACIÓN LEGAL Y CONTACTO (LADO A LADO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Legal e Información */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4 text-center">📋 Información Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/sobre-nosotros" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Sobre Nosotros
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacidad" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Política de Privacidad
                    </Link>
                  </li>
                  <li>
                    <Link href="/terminos" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Términos y Condiciones
                    </Link>
                  </li>
                  <li>
                    <Link href="/contacto" className="text-muted-foreground hover:text-primary transition-colors block text-center">
                      Contacto
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contacto */}
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

            {/* 5. MAPA DE UBICACIÓN */}
            <div className="border-t border-border mt-8 pt-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border shadow-lg hover:shadow-xl transition-all mb-8">
                <h3 className="text-xl font-bold text-center text-foreground mb-6 flex items-center justify-center gap-2">
                  <i className="fas fa-map-marker-alt text-primary text-xl"></i>
                  Nuestra Ubicación
                </h3>
                <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.525!2d-74.075!3d4.609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzYnMzIuNCJOIDc0wrAwNCczMC4wIlc!5e0!3m2!1ses!2sco!4v1640000000000!5m2!1ses!2sco"
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
                  <p className="text-muted-foreground mb-2">
                    {getConfigValue('footer_address', 'Bogotá, Colombia')}
                  </p>
                  <div className="flex justify-center items-center gap-4">
                    <span className="text-muted-foreground text-sm">Síguenos en redes sociales:</span>
                    {getConfigValue('social_instagram') && (
                      <a 
                        href={getConfigValue('social_instagram')} 
                        className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="fab fa-instagram text-sm"></i>
                      </a>
                    )}
                    {getConfigValue('social_facebook') && (
                      <a 
                        href={getConfigValue('social_facebook')} 
                        className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="fab fa-facebook-f text-sm"></i>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. DIRECTORIO COMPLETO DE PÁGINAS Y SERVICIOS */}
            <div className="border-t border-border pt-8">
              <h3 className="text-xl font-bold text-center text-foreground mb-8">Directorio Completo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Catálogo de Productos */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-border">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <i className="fas fa-mobile-alt text-primary"></i>
                    Catálogo
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Inicio</Link></li>
                    <li><Link href="/productos" className="text-muted-foreground hover:text-primary transition-colors">Todos los Productos</Link></li>
                    <li><Link href="/ofertas" className="text-muted-foreground hover:text-primary transition-colors">Ofertas Especiales</Link></li>
                    <li><Link href="/nuevos" className="text-muted-foreground hover:text-primary transition-colors">Nuevos Productos</Link></li>
                    <li><Link href="/marcas" className="text-muted-foreground hover:text-primary transition-colors">Marcas</Link></li>
                  </ul>
                </div>

                {/* Servicios al Cliente */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-border">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <i className="fas fa-headset text-primary"></i>
                    Servicios
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li><Link href="/garantia" className="text-muted-foreground hover:text-primary transition-colors">Garantía</Link></li>
                    <li><Link href="/reembolsos" className="text-muted-foreground hover:text-primary transition-colors">Reembolsos</Link></li>
                    <li><Link href="/envios" className="text-muted-foreground hover:text-primary transition-colors">Envíos</Link></li>
                    <li><Link href="/soporte" className="text-muted-foreground hover:text-primary transition-colors">Soporte Técnico</Link></li>
                    <li><Link href="/instalacion" className="text-muted-foreground hover:text-primary transition-colors">Instalación</Link></li>
                  </ul>
                </div>

                {/* Información Empresarial */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-border">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <i className="fas fa-building text-primary"></i>
                    Empresa
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li><Link href="/sobre-nosotros" className="text-muted-foreground hover:text-primary transition-colors">Sobre Nosotros</Link></li>
                    <li><Link href="/historia" className="text-muted-foreground hover:text-primary transition-colors">Nuestra Historia</Link></li>
                    <li><Link href="/equipo" className="text-muted-foreground hover:text-primary transition-colors">Nuestro Equipo</Link></li>
                    <li><Link href="/carreras" className="text-muted-foreground hover:text-primary transition-colors">Trabaja con Nosotros</Link></li>
                    <li><Link href="/noticias" className="text-muted-foreground hover:text-primary transition-colors">Noticias</Link></li>
                  </ul>
                </div>

                {/* Información Legal */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-border">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <i className="fas fa-gavel text-primary"></i>
                    Legal
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li><Link href="/privacidad" className="text-muted-foreground hover:text-primary transition-colors">Privacidad</Link></li>
                    <li><Link href="/terminos" className="text-muted-foreground hover:text-primary transition-colors">Términos</Link></li>
                    <li><Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">Cookies</Link></li>
                    <li><Link href="/contacto" className="text-muted-foreground hover:text-primary transition-colors">Contacto</Link></li>
                    <li><Link href="/ayuda" className="text-muted-foreground hover:text-primary transition-colors">Ayuda</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="border-t border-border mt-8 pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {getConfigValue('footer_copyright', `© ${new Date().getFullYear()} FULLTECH. Todos los derechos reservados.`)}
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