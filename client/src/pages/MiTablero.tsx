import { useState } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/TopBar";

interface Referral {
  id: string;
  referrerCode: string;
  referredId: string;
  status: 'pending' | 'qualified' | 'expired';
  qualifiedAt?: string;
  rewardGiven: boolean;
  createdAt: string;
  referredCustomer?: {
    name: string;
    createdAt: string;
  };
}

interface Purchase {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountApplied: number;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
  product?: {
    name: string;
    images: string[];
  };
}

export function MiTablero() {
  const { customer, isLoading: customerLoading } = useCustomer();
  const { navigateInstantly } = useInstantNavigation();
  const [activeTab, setActiveTab] = useState("overview");

  // 📊 Obtener datos del cliente
  const { data: referrals = [] } = useQuery<Referral[]>({
    queryKey: ["/api/customer/referrals"],
    enabled: !!customer,
  });

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/customer/purchases"],
    enabled: !!customer,
  });

  // 📈 Calcular estadísticas
  const earningsStats = {
    totalEarnings: customer?.discountEarned || 0, // 5% real del valor de las compras
    qualifiedReferrals: referrals.filter(r => r.status === 'qualified').length,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length,
    totalReferrals: referrals.length,
    totalPurchases: purchases.length,
    completedPurchases: purchases.filter(p => p.status === 'completed').length,
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
            <Button onClick={() => navigateInstantly('/login')} className="w-full">
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
            <p className="text-blue-100">
              Bienvenido a tu tablero personal de FULLTECH
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Ganancias Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                RD${earningsStats.totalEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {earningsStats.qualifiedReferrals} referidos calificados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Referidos Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {earningsStats.totalReferrals}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {earningsStats.pendingReferrals} pendientes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Compras Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {earningsStats.totalPurchases}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {earningsStats.completedPurchases} completadas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Código de Referencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                {customer.referralCode}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Compártelo y gana
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigateInstantly('/mi/referir')}>
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-3">
                <i className="fas fa-share-alt text-white text-xl"></i>
              </div>
              <CardTitle className="text-lg">Referir Amigos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                Comparte tu código y gana el 5% del valor de cada compra de tus referidos.
              </p>
              <Button variant="outline" className="w-full mt-4">
                Empezar a Referir
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigateInstantly('/mi/perfil')}>
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-3">
                <i className="fas fa-user-edit text-white text-xl"></i>
              </div>
              <CardTitle className="text-lg">Mi Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                Actualiza tu información personal y foto de perfil.
              </p>
              <Button variant="outline" className="w-full mt-4">
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigateInstantly('/mi/soporte')}>
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3">
                <i className="fas fa-headset text-white text-xl"></i>
              </div>
              <CardTitle className="text-lg">Soporte</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                ¿Necesitas ayuda? Nuestro equipo está aquí para ti.
              </p>
              <Button variant="outline" className="w-full mt-4">
                Contactar Soporte
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-clock text-blue-600"></i>
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length > 0 ? (
                <div className="space-y-3">
                  {referrals.slice(0, 5).map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          referral.status === 'qualified' ? 'bg-green-500' :
                          referral.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {referral.referredCustomer?.name || 'Usuario referido'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {referral.status === 'qualified' ? 'Referido calificado - Ganaste 5% de su compra' :
                             referral.status === 'pending' ? 'Referido pendiente' : 'Referido expirado'}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-inbox text-4xl text-slate-300 mb-4"></i>
                  <p className="text-slate-500">No hay actividad reciente</p>
                  <p className="text-sm text-slate-400">¡Empieza a referir amigos para ver tu actividad aquí!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}