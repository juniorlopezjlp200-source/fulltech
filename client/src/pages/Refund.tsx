import { TopBar } from "@/components/TopBar";

export default function Refund() {
  return (
    <div className="phone-frame">
      <div className="phone-notch"></div>
      <div className="phone-screen">
        <div className="phone-content">
          <TopBar />
          
          <div className="pt-20 px-4 py-8 max-w-4xl mx-auto">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h1 className="text-2xl font-bold text-primary mb-6">Política de Reembolso</h1>
              
              <div className="prose prose-sm max-w-none text-card-foreground">
                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">Período de Devolución</h2>
                <p className="mb-4">
                  Aceptamos devoluciones dentro de los primeros <strong>30 días</strong> después de la compra, 
                  siempre que el producto esté en condiciones originales.
                </p>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">Condiciones para Reembolso</h2>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Producto en empaque original sin abrir (para algunos productos)</li>
                  <li>Incluir todos los accesorios y documentación</li>
                  <li>Factura de compra original</li>
                  <li>Producto sin daños físicos</li>
                  <li>Sin evidencia de uso excesivo</li>
                </ul>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">Productos Elegibles</h2>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Smartphones y tablets</li>
                  <li>Laptops y computadoras</li>
                  <li>Accesorios tecnológicos</li>
                  <li>Audio y video</li>
                  <li>Dispositivos inteligentes</li>
                </ul>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">Productos NO Elegibles</h2>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Software descargado</li>
                  <li>Productos personalizados</li>
                  <li>Tarjetas de regalo</li>
                  <li>Productos en oferta especial (según términos)</li>
                </ul>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">Proceso de Reembolso</h2>
                <ol className="list-decimal list-inside mb-4 space-y-2">
                  <li>Solicita el reembolso a través de nuestros canales</li>
                  <li>Empaca el producto en su caja original</li>
                  <li>Programa la recolección gratuita</li>
                  <li>Inspección del producto (1-2 días hábiles)</li>
                  <li>Procesamiento del reembolso (3-5 días hábiles)</li>
                </ol>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">Métodos de Reembolso</h2>
                <p className="mb-4">
                  El reembolso se realizará por el mismo método de pago utilizado en la compra original:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Tarjeta de crédito/débito: 3-5 días hábiles</li>
                  <li>Transferencia bancaria: 2-3 días hábiles</li>
                  <li>Efectivo: Inmediato en tienda</li>
                </ul>

                <h2 className="text-lg font-semibold text-primary mt-6 mb-3">Contacto para Reembolsos</h2>
                <p className="mb-2">📧 Email: reembolsos@fulltech.com</p>
                <p className="mb-2">📱 WhatsApp: +1 (555) 123-4567</p>
                <p className="mb-4">🕒 Horario: Lunes a Viernes 9:00 AM - 6:00 PM</p>

                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    <strong>Garantía de Satisfacción:</strong> Tu satisfacción es nuestra prioridad. Si no estás completamente 
                    satisfecho con tu compra, te ayudaremos a encontrar la mejor solución.
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