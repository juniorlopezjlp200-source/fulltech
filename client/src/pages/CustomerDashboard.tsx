import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function CustomerDashboard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Obtener datos del cliente autenticado
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Obtener actividades del cliente
  const { data: activities = [] } = useQuery({
    queryKey: ["/api/customer/activities"],
    enabled: !!customer,
  });

  // Obtener compras del cliente
  const { data: purchases = [] } = useQuery({
    queryKey: ["/api/customer/purchases"],
    enabled: !!customer,
  });

  // Obtener referidos del cliente
  const { data: referrals = [] } = useQuery({
    queryKey: ["/api/customer/referrals"],
    enabled: !!customer,
  });

  // Obtener rifa actual
  const { data: currentRaffle } = useQuery({
    queryKey: ["/api/raffle/current"],
  });

  const handleCopyReferralLink = () => {
    if (customer?.referralCode) {
      const referralLink = `${window.location.origin}/?ref=${customer.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "Comparte este enlace para ganar descuentos y participar en rifas",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Acceso Requerido</CardTitle>
            <CardDescription>
              Necesitas iniciar sesión para acceder a tu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/login'}
            >
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const qualifiedReferrals = referrals.filter((ref: any) => ref.status === 'qualified');
  const discountEarned = customer.discountEarned || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img 
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60" 
                alt="FULLTECH" 
                className="w-12 h-12 object-contain rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Perfil FULLTECH</h1>
                <p className="text-gray-600">Bienvenido de vuelta, {customer.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                <i className="fas fa-store mr-2"></i>
                Ver Catálogo
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt mr-2"></i>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Descuento Ganado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {discountEarned}%
              </div>
              <p className="text-xs text-gray-500">En tu próxima compra</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Referidos Exitosos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {qualifiedReferrals.length}
              </div>
              <p className="text-xs text-gray-500">Clientes que compraron</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Compras Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {purchases.length}
              </div>
              <p className="text-xs text-gray-500">Total de órdenes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Visitas a la Tienda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {activities.filter((a: any) => a.activityType === 'visit').length}
              </div>
              <p className="text-xs text-gray-500">Productos visitados</p>
            </CardContent>
          </Card>
        </div>

        {/* Enlace de Referencia */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-gift mr-2 text-purple-600"></i>
              Tu Enlace de Referencia
            </CardTitle>
            <CardDescription>
              Comparte este enlace y gana 5% de descuento por cada cliente que compre. 
              Además, participarás en la rifa mensual cuando tus referidos compren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-white p-3 rounded-lg border font-mono text-sm">
                {`${window.location.origin}/?ref=${customer.referralCode}`}
              </div>
              <Button onClick={handleCopyReferralLink} className="bg-purple-600 hover:bg-purple-700">
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Tu código: <span className="font-bold text-purple-600">{customer.referralCode}</span>
            </p>
          </CardContent>
        </Card>

        {/* Rifa Actual */}
        {currentRaffle && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-trophy mr-2 text-yellow-600"></i>
                Rifa del Mes - {currentRaffle.prize}
              </CardTitle>
              <CardDescription>
                {currentRaffle.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Participas automáticamente cuando tus referidos realicen compras
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Fecha del sorteo: {currentRaffle.drawDate ? new Date(currentRaffle.drawDate).toLocaleDateString() : 'Por anunciar'}
                  </p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  Participando
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs de Información */}
        <Tabs defaultValue="referrals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="referrals">Mis Referidos</TabsTrigger>
            <TabsTrigger value="purchases">Mis Compras</TabsTrigger>
            <TabsTrigger value="activities">Mi Actividad</TabsTrigger>
            <TabsTrigger value="profile">Mi Información</TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Referidos</CardTitle>
                <CardDescription>
                  Lista de todos los clientes que se registraron con tu enlace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Aún no has referido a ningún cliente. ¡Comparte tu enlace para empezar!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((referral: any) => (
                      <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Cliente #{referral.referredId.slice(-8)}</p>
                          <p className="text-sm text-gray-600">
                            Registrado: {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={referral.status === 'qualified' ? 'default' : 'secondary'}>
                          {referral.status === 'qualified' ? 'Compró ✅' : 'Pendiente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Compras</CardTitle>
                <CardDescription>
                  Todas tus compras realizadas en FULLTECH
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Aún no has realizado ninguna compra.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {purchases.map((purchase: any) => (
                      <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Producto #{purchase.productId.slice(-8)}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(purchase.createdAt).toLocaleDateString()} - 
                            Cantidad: {purchase.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">RD${purchase.totalPrice}</p>
                          {purchase.discountApplied > 0 && (
                            <p className="text-xs text-green-600">
                              Descuento: {purchase.discountApplied}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mi Actividad</CardTitle>
                <CardDescription>
                  Historial de visitas, me gusta y compartidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hay actividad registrada aún.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className={`fas ${
                              activity.activityType === 'visit' ? 'fa-eye' :
                              activity.activityType === 'like' ? 'fa-heart' :
                              activity.activityType === 'share' ? 'fa-share' :
                              'fa-shopping-cart'
                            } text-blue-600 text-xs`}></i>
                          </div>
                          <div>
                            <p className="font-medium capitalize">{activity.activityType}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {activity.productId && (
                          <p className="text-xs text-gray-500">
                            Producto #{activity.productId.slice(-8)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mi Información</CardTitle>
                <CardDescription>
                  Datos de tu cuenta y configuración
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={customer.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}`}
                    alt={customer.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{customer.name}</h3>
                    <p className="text-gray-600">{customer.email}</p>
                    <p className="text-sm text-gray-500">
                      Miembro desde: {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teléfono</label>
                    <p className="text-gray-900">{customer.phone || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Dirección</label>
                    <p className="text-gray-900">{customer.address || 'No especificada'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Código de Referencia</label>
                    <p className="text-gray-900 font-mono">{customer.referralCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estado de la Cuenta</label>
                    <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                      {customer.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}