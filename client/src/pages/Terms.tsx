import { TopBar } from "@/components/TopBar";
import { Link } from "wouter";

export default function Terms() {
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
              <h1 className="text-2xl font-bold text-primary mb-6">Términos y Condiciones</h1>
              
              <div className="prose prose-sm max-w-none text-card-foreground">
                <p className="mb-4 text-sm text-muted-foreground">
                  Última actualización: {new Date().toLocaleDateString('es-ES')}
                </p>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">1. Aceptación de Términos</h2>
                <p className="mb-4">
                  Al acceder y utilizar FULLTECH, aceptas cumplir con estos términos y condiciones. 
                  Si no estás de acuerdo, no uses nuestros servicios.
                </p>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">2. Descripción del Servicio</h2>
                <p className="mb-4">
                  FULLTECH es una plataforma de comercio electrónico especializada en productos tecnológicos, 
                  que incluye un sistema de referidos y participación en rifas mensuales.
                </p>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">3. Registro de Cuenta</h2>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Debes proporcionar información veraz y actualizada</li>
                  <li>Eres responsable de mantener segura tu cuenta</li>
                  <li>No puedes transferir tu cuenta a terceros</li>
                  <li>Notifica inmediatamente cualquier uso no autorizado</li>
                </ul>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">4. Compras y Pagos</h2>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Todos los precios están sujetos a cambios sin previo aviso</li>
                  <li>Los pagos deben realizarse en su totalidad antes del envío</li>
                  <li>Aceptamos diversos métodos de pago seguros</li>
                  <li>Las transacciones están sujetas a verificación</li>
                </ul>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">5. Programa de Referidos</h2>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Recibes 5% de descuento por cada referido exitoso</li>
                  <li>El referido debe realizar una compra para calificar</li>
                  <li>Los descuentos tienen fecha de vencimiento</li>
                  <li>No se permite spam o prácticas fraudulentas</li>
                </ul>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">6. Rifas Mensuales</h2>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Participación automática con cada compra</li>
                  <li>Una entrada por cada compra realizada</li>
                  <li>Los ganadores se seleccionan aleatoriamente</li>
                  <li>Los premios no son transferibles ni canjeables por dinero</li>
                </ul>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">7. Envíos y Entregas</h2>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Los tiempos de entrega son estimados</li>
                  <li>Los riesgos de envío se transfieren al comprador</li>
                  <li>Debes inspeccionar los productos al recibirlos</li>
                  <li>Reporta cualquier daño dentro de las 24 horas</li>
                </ul>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">8. Propiedad Intelectual</h2>
                <p className="mb-4">
                  Todo el contenido de FULLTECH, incluyendo textos, imágenes, logos y software, 
                  está protegido por derechos de autor y marcas registradas.
                </p>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">9. Limitación de Responsabilidad</h2>
                <p className="mb-4">
                  FULLTECH no será responsable por daños indirectos, especiales, incidentales o 
                  consecuentes que resulten del uso de nuestros servicios.
                </p>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">10. Terminación</h2>
                <p className="mb-4">
                  Podemos suspender o terminar tu cuenta en cualquier momento por violación de estos términos 
                  o por cualquier otra razón a nuestra discreción.
                </p>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">11. Modificaciones</h2>
                <p className="mb-4">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                  Los cambios entrarán en vigor inmediatamente después de su publicación.
                </p>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">12. Ley Aplicable</h2>
                <p className="mb-4">
                  Estos términos se rigen por las leyes del país donde opera FULLTECH. 
                  Cualquier disputa se resolverá en los tribunales competentes.
                </p>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">Contacto Legal</h2>
                <p className="mb-2">📧 Email: legal@fulltech.com</p>
                <p className="mb-2">📱 WhatsApp: +1 (555) 123-4567</p>
                <p className="mb-4">📍 Dirección: [Dirección legal de la empresa]</p>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-6">
                  <p className="text-amber-800 dark:text-amber-200 text-sm">
                    <strong>Importante:</strong> Al continuar usando FULLTECH, confirmas que has leído, 
                    entendido y aceptado estos términos y condiciones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}