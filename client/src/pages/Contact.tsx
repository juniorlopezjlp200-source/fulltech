import { TopBar } from "@/components/TopBar";
import { Link } from "wouter";

export default function Contact() {
  return (
    <div className="phone-frame">
      <div className="phone-notch"></div>
      <div className="phone-screen">
        <div className="phone-content">
          <TopBar />
          
          <div className="pt-20 px-4 py-8 max-w-4xl mx-auto">
            {/* Botón regresar */}
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                <i className="fas fa-arrow-left"></i>
                <span>Regresar al catálogo</span>
              </Link>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h1 className="text-2xl font-bold text-primary mb-6">Contacto</h1>
              
              <div className="prose prose-sm max-w-none text-card-foreground">
                <p className="mb-6 text-center text-lg">
                  ¿Necesitas ayuda? Estamos aquí para ti 24/7
                </p>

                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  {/* WhatsApp */}
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fab fa-whatsapp text-green-600 text-3xl"></i>
                    </div>
                    <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">WhatsApp</h3>
                    <p className="text-green-700 dark:text-green-300 mb-3 text-sm">
                      Respuesta inmediata para consultas y soporte
                    </p>
                    <a 
                      href="https://wa.me/18295344286?text=Quiero%20más%20información"
                      className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-whatsapp mr-2"></i>
                      Enviar Mensaje
                    </a>
                  </div>

                  {/* Email */}
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-envelope text-blue-600 text-3xl"></i>
                    </div>
                    <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Email</h3>
                    <p className="text-blue-700 dark:text-blue-300 mb-3 text-sm">
                      Para consultas detalladas y soporte técnico
                    </p>
                    <a 
                      href="mailto:contacto@fulltech.com"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <i className="fas fa-envelope mr-2"></i>
                      Enviar Email
                    </a>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-primary mt-8 mb-4">Información de Contacto</h2>
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <i className="fas fa-phone text-primary text-xl"></i>
                    <div>
                      <div className="font-medium">Teléfono</div>
                      <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <i className="fas fa-clock text-primary text-xl"></i>
                    <div>
                      <div className="font-medium">Horario</div>
                      <div className="text-sm text-muted-foreground">24/7 Disponible</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <i className="fas fa-map-marker-alt text-primary text-xl"></i>
                    <div>
                      <div className="font-medium">Dirección</div>
                      <div className="text-sm text-muted-foreground">Av. Tecnología 123, Digital City</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <i className="fas fa-globe text-primary text-xl"></i>
                    <div>
                      <div className="font-medium">Cobertura</div>
                      <div className="text-sm text-muted-foreground">Todo el territorio nacional</div>
                    </div>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-primary mt-8 mb-4">Departamentos Especializados</h2>
                <div className="space-y-4 mb-6">
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <i className="fas fa-shopping-cart text-primary"></i>
                      <h3 className="font-semibold">Ventas</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Consultas sobre productos, precios y disponibilidad
                    </p>
                    <p className="text-sm">📧 ventas@fulltech.com</p>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <i className="fas fa-tools text-primary"></i>
                      <h3 className="font-semibold">Soporte Técnico</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Ayuda con configuración, problemas técnicos y garantías
                    </p>
                    <p className="text-sm">📧 soporte@fulltech.com</p>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <i className="fas fa-undo text-primary"></i>
                      <h3 className="font-semibold">Devoluciones</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Procesamiento de devoluciones y reembolsos
                    </p>
                    <p className="text-sm">📧 devoluciones@fulltech.com</p>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <i className="fas fa-gift text-primary"></i>
                      <h3 className="font-semibold">Referidos y Rifas</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Información sobre el programa de referidos y rifas mensuales
                    </p>
                    <p className="text-sm">📧 referidos@fulltech.com</p>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-primary mt-8 mb-4">Síguenos en Redes Sociales</h2>
                <div className="flex justify-center gap-4 mb-6">
                  <a href="#" className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors">
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="#" className="w-12 h-12 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                    <i className="fab fa-youtube"></i>
                  </a>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-primary mb-3">¿Prefieres Llamarnos?</h3>
                  <p className="text-sm mb-4">
                    Nuestro equipo de atención al cliente está disponible 24/7 para ayudarte con cualquier consulta.
                  </p>
                  <a 
                    href="tel:+15551234567"
                    className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <i className="fas fa-phone mr-2"></i>
                    Llamar Ahora
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}