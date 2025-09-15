import { useState } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/TopBar";

interface Purchase {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountApplied: number;
  status: "completed" | "pending" | "cancelled";
  createdAt: string;
  product?: {
    name: string;
    images: string[];
  };
}

export function MiTablero() {
  const { customer, isLoading: customerLoading } = useCustomer();
  const { navigateInstantly } = useInstantNavigation();
  const [activeTab, setActiveTab] = useState("overview"); // (reservado por si luego agregas tabs)

  // 📊 Obtener compras del cliente
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/customer/purchases"],
    enabled: !!customer,
  });

  // 📈 Estadísticas SOLO de compras (sin referidos)
  const purchaseStats = {
    totalPurchases: purchases.length,
    completedPurchases: purchases.filter((p) => p.status === "completed").length,
    pendingPurchases: purchases.filter((p) => p.status === "pending").length,
    totalSpent: purchases
      .filter((p) => p.status === "completed")
      .reduce((acc, p) => acc + (p.totalPrice - (p.discountApplied || 0)), 0),
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <TopBar />
        <div className="pt-20 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando tu tablero...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <TopBar />
        <div className="pt-20 p-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Acceso Requerido</h1>
            <p className="text-slate-600 mb-6">Necesitas iniciar sesión para ver tu tablero.</p>
            <Button onClick={() => navigateInstantly("/login")} className="w-full">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <TopBar />

      <div className="pt-20 p-4 space-y-6">
        {/* Header con Saludo */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              ¡Hola, {customer.name.split(" ")[0]}! 👋
            </h1>
            <p className="text-blue-100">Bienvenido a tu tablero personal de FULLTECH</p>
          </div>
        </div>

        {/* Stats Cards (solo compras y cuenta) */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Compras Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {purchaseStats.totalPurchases}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {purchaseStats.completedPurchases} completadas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {purchaseStats.pendingPurchases}
              </div>
              <p className="text-xs text-slate-500 mt-1">En proceso</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Gasto Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                RD${purchaseStats.totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Compras completadas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Miembro desde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-slate-700">
                {new Date(customer.createdAt).toLocaleDateString("es-DO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-slate-500 mt-1">Última visita:{" "}
                {customer.lastVisit
                  ? new Date(customer.lastVisit).toLocaleDateString("es-DO")
                  : "Hoy"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards (sin “referir amigos”) */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateInstantly("/mi/perfil")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-3">
                <i className="fas fa-user-edit text-white text-xl"></i>
              </div>
              <CardTitle className="text-lg">Mi Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">Actualiza tu información personal y foto de perfil.</p>
              <Button variant="outline" className="w-full mt-4">Editar Perfil</Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateInstantly("/mi/soporte")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3">
                <i className="fas fa-headset text-white text-xl"></i>
              </div>
              <CardTitle className="text-lg">Soporte</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">¿Necesitas ayuda? Nuestro equipo está aquí para ti.</p>
              <Button variant="outline" className="w-full mt-4">Contactar Soporte</Button>
            </CardContent>
          </Card>

          {/* Puedes añadir otra acción útil aquí (historial, direcciones, etc.) */}
        </div>

        {/* Actividad Reciente: basada en compras */}
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-clock text-blue-600"></i>
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {purchasesLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-500">Cargando actividad…</p>
                </div>
              ) : purchases.length > 0 ? (
                <div className="space-y-3">
                  {purchases
                    .slice(0, 5)
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              purchase.status === "completed"
                                ? "bg-green-500"
                                : purchase.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <div>
                            <p className="font-medium text-slate-900">
                              {purchase.product?.name || "Compra realizada"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {purchase.status === "completed"
                                ? "Compra completada"
                                : purchase.status === "pending"
                                ? "Compra pendiente"
                                : "Compra cancelada"}{" "}
                              — RD${purchase.totalPrice.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-inbox text-4xl text-slate-300 mb-4"></i>
                  <p className="text-slate-500">No hay actividad reciente</p>
                  <p className="text-sm text-slate-400">
                    Aún no registras compras.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
