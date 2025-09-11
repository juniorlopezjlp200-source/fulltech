import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCustomer, type Customer } from "@/hooks/useCustomer";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useInstantFeedback } from "@/hooks/useInstantFeedback";

// 📊 Tipos para el dashboard expandido
interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  status: 'pending' | 'qualified' | 'rewarded';
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

interface Activity {
  id: string;
  customerId: string;
  activityType: 'visit' | 'like' | 'share' | 'purchase';
  productId?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

interface Raffle {
  id: string;
  prize: string;
  description: string;
  drawDate: string;
  isActive: boolean;
}

export function CustomerDashboard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: "", phone: "", address: "" });
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Navegación instantánea
  const { navigateInstantly } = useInstantNavigation();
  const { createInstantClickHandler } = useInstantFeedback();
  
  // Settings state
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false
  });

  // Usar hook personalizado con tipos correctos
  const { customer, isLoading: customerLoading, logout } = useCustomer();

  // 📊 Obtener datos expandidos del cliente
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/customer/activities"],
    enabled: !!customer,
  });

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/customer/purchases"],
    enabled: !!customer,
  });

  const { data: referrals = [] } = useQuery<Referral[]>({
    queryKey: ["/api/customer/referrals"],
    enabled: !!customer,
  });

  const { data: currentRaffle } = useQuery<Raffle>({
    queryKey: ["/api/raffle/current"],
  });

  // 📈 Calcular estadísticas de ganancias
  const earningsStats = {
    totalEarnings: referrals.filter(r => r.status === 'qualified').length * 25, // RD$25 por referido
    qualifiedReferrals: referrals.filter(r => r.status === 'qualified').length,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length,
    totalSpent: purchases.reduce((sum, p) => sum + p.totalPrice, 0),
    totalSavings: purchases.reduce((sum, p) => sum + (p.unitPrice * p.quantity * p.discountApplied / 100), 0),
    monthlyActivity: activities.filter(a => {
      const activityDate = new Date(a.createdAt);
      const thisMonth = new Date();
      return activityDate.getMonth() === thisMonth.getMonth() && 
             activityDate.getFullYear() === thisMonth.getFullYear();
    }).length
  };

  // 🔗 Manejo de código de referido
  const handleCopyReferralLink = () => {
    if (customer?.referralCode) {
      const referralLink = `${window.location.origin}/?ref=${customer.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "Comparte este enlace para ganar RD$25 por cada referido",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 📷 Manejo de subida de foto de perfil
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/customer/upload-profile-image', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "¡Foto actualizada!",
          description: "Tu foto de perfil se ha actualizado correctamente"
        });
        // Recargar datos del cliente
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Intenta de nuevo.",
        variant: "destructive"
      });
    }
    setUploadingImage(false);
  };

  // ✏️ Manejo de edición de perfil
  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/customer/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        toast({
          title: "¡Perfil actualizado!",
          description: "Tus datos se han guardado correctamente"
        });
        setIsEditingProfile(false);
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  // ⚙️ Manejo de configuraciones
  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/customer/update-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications })
      });
      
      if (response.ok) {
        toast({
          title: "¡Configuración guardada!",
          description: "Tus preferencias se han actualizado"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive"
      });
    }
  };

  // 🔄 Inicializar datos del perfil
  useEffect(() => {
    if (customer) {
      setProfileData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || ''
      });
    }
  }, [customer]);

  const handleLogout = () => {
    logout();
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
              onClick={createInstantClickHandler(() => navigateInstantly('/login'))}
            >
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 📊 Cálculos finales
  const qualifiedReferrals = referrals.filter(ref => ref.status === 'qualified');
  const discountEarned = customer?.discountEarned || 0;
  
  // 🎨 Formatear moneda dominicana
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // 📅 Formatear fechas
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 🎨 Header Moderno */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              {/* Logo y Avatar */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-microchip text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    FULLTECH Dashboard
                  </h1>
                  <p className="text-gray-600">¡Hola, {customer?.name}! 🎉</p>
                </div>
              </div>
            </div>
            
            {/* Botones de navegación */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={createInstantClickHandler(() => navigateInstantly('/'))}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <i className="fas fa-store mr-2"></i>
                Catálogo
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 🎯 Stats Cards Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Ganancias Totales */}
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Ganancias Totales</p>
                  <p className="text-3xl font-bold">{formatCurrency(earningsStats.totalEarnings)}</p>
                  <p className="text-green-100 text-xs">+{qualifiedReferrals.length} referidos activos</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <i className="fas fa-coins text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referidos Activos */}
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Referidos Activos</p>
                  <p className="text-3xl font-bold">{earningsStats.qualifiedReferrals}</p>
                  <p className="text-blue-100 text-xs">{earningsStats.pendingReferrals} pendientes</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <i className="fas fa-users text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Gastado */}
          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Gastado</p>
                  <p className="text-3xl font-bold">{formatCurrency(earningsStats.totalSpent)}</p>
                  <p className="text-purple-100 text-xs">{purchases.length} compras</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <i className="fas fa-shopping-cart text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descuentos Ahorrados */}
          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Ahorrado</p>
                  <p className="text-3xl font-bold">{formatCurrency(earningsStats.totalSavings)}</p>
                  <p className="text-orange-100 text-xs">En descuentos</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <i className="fas fa-piggy-bank text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🎛️ Tabs de Navegación */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <i className="fas fa-chart-line mr-2"></i>
              Resumen
            </TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
              <i className="fas fa-users mr-2"></i>
              Referidos
            </TabsTrigger>
            <TabsTrigger value="purchases" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <i className="fas fa-shopping-bag mr-2"></i>
              Compras
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
              <i className="fas fa-user mr-2"></i>
              Perfil
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-white">
              <i className="fas fa-cog mr-2"></i>
              Config
            </TabsTrigger>
          </TabsList>

          {/* 📈 TAB: RESUMEN */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progreso de Referidos */}
              <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-chart-line text-blue-500"></i>
                    Progreso de Referidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Referidos Calificados</span>
                        <span className="text-sm text-gray-500">{earningsStats.qualifiedReferrals}/10</span>
                      </div>
                      <Progress value={(earningsStats.qualifiedReferrals / 10) * 100} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(earningsStats.qualifiedReferrals * 25)}</p>
                        <p className="text-xs text-gray-500">Ganancia Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{earningsStats.pendingReferrals}</p>
                        <p className="text-xs text-gray-500">Pendientes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actividad Reciente */}
              <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-clock text-purple-500"></i>
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity, index) => (
                      <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <i className={`fas ${activity.activityType === 'purchase' ? 'fa-shopping-cart' : activity.activityType === 'share' ? 'fa-share' : 'fa-eye'} text-white text-xs`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.activityType === 'purchase' ? 'Compra realizada' : 
                             activity.activityType === 'share' ? 'Producto compartido' : 'Producto visitado'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tu Código de Referido */}
            <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-gift text-green-500"></i>
                  ¡Comparte y Gana Dinero!
                </CardTitle>
                <CardDescription>
                  Comparte tu código y gana RD$25 por cada persona que se registre y compre
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3 bg-white rounded-lg border-2 border-dashed border-green-300">
                    <p className="text-sm text-gray-600">Tu enlace de referido:</p>
                    <p className="font-mono text-sm font-medium text-green-700">
                      {window.location.origin}/?ref={customer?.referralCode}
                    </p>
                  </div>
                  <Button 
                    onClick={handleCopyReferralLink}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {copied ? (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <i className="fas fa-copy mr-2"></i>
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 👥 TAB: REFERIDOS */}
          <TabsContent value="referrals" className="mt-6">
            <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-users text-green-500"></i>
                  Mis Referidos ({referrals.length})
                </CardTitle>
                <CardDescription>
                  Personas que se han registrado usando tu código
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referrals.length > 0 ? (
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-white"></i>
                          </div>
                          <div>
                            <p className="font-medium">{referral.referredCustomer?.name || 'Usuario'}</p>
                            <p className="text-sm text-gray-500">
                              Registrado: {formatDate(referral.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={referral.status === 'qualified' ? 'default' : 'secondary'}
                            className={referral.status === 'qualified' ? 'bg-green-500' : ''}
                          >
                            {referral.status === 'qualified' ? '✅ Calificado' : '⏳ Pendiente'}
                          </Badge>
                          {referral.status === 'qualified' && (
                            <span className="text-sm font-bold text-green-600">+RD$25</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-users text-gray-300 text-4xl mb-4"></i>
                    <p className="text-gray-500">Aún no tienes referidos</p>
                    <p className="text-sm text-gray-400">¡Comparte tu código para empezar a ganar!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🛒 TAB: COMPRAS */}
          <TabsContent value="purchases" className="mt-6">
            <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-shopping-bag text-purple-500"></i>
                  Historial de Compras ({purchases.length})
                </CardTitle>
                <CardDescription>
                  Todas tus compras realizadas en FULLTECH
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchases.length > 0 ? (
                  <div className="space-y-4">
                    {purchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                            <i className="fas fa-box text-white"></i>
                          </div>
                          <div>
                            <p className="font-medium">{purchase.product?.name || 'Producto'}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(purchase.createdAt)} • Cantidad: {purchase.quantity}
                            </p>
                            <p className="text-xs text-gray-400">
                              ID: {purchase.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{formatCurrency(purchase.totalPrice)}</p>
                          <Badge 
                            variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                            className={purchase.status === 'completed' ? 'bg-green-500' : ''}
                          >
                            {purchase.status === 'completed' ? '✅ Completada' : 
                             purchase.status === 'pending' ? '⏳ Pendiente' : '❌ Cancelada'}
                          </Badge>
                          {purchase.discountApplied > 0 && (
                            <p className="text-xs text-green-600">
                              -{purchase.discountApplied}% descuento
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-shopping-cart text-gray-300 text-4xl mb-4"></i>
                    <p className="text-gray-500">No tienes compras registradas</p>
                    <p className="text-sm text-gray-400">¡Explora nuestro catálogo y haz tu primera compra!</p>
                    <Button 
                      className="mt-4" 
                      onClick={createInstantClickHandler(() => navigateInstantly('/'))}
                    >
                      <i className="fas fa-store mr-2"></i>
                      Ver Catálogo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 👤 TAB: PERFIL */}
          <TabsContent value="profile" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Foto de Perfil */}
              <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-camera text-orange-500"></i>
                    Foto de Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <Avatar className="w-24 h-24 mx-auto mb-4">
                      <AvatarImage src={customer?.picture} alt={customer?.name} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-2xl">
                        {customer?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-gray-600">
                      {customer?.authProvider === 'google' ? 'Foto de Google' : 'Foto personalizada'}
                    </p>
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedProfileImage(file);
                          handleImageUpload(file);
                        }
                      }}
                      className="mb-3"
                    />
                    <p className="text-xs text-gray-500">
                      Formatos soportados: JPG, PNG, GIF (máx. 5MB)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Información Personal */}
              <div className="lg:col-span-2">
                <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <i className="fas fa-user-edit text-orange-500"></i>
                      Información Personal
                    </CardTitle>
                    <CardDescription>
                      Administra tus datos personales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditingProfile ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nombre completo</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Dirección</Label>
                          <Textarea
                            id="address"
                            value={profileData.address}
                            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveProfile} className="flex-1">
                            <i className="fas fa-save mr-2"></i>
                            Guardar
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditingProfile(false)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-600">Nombre</Label>
                            <p className="font-medium">{customer?.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Email</Label>
                            <p className="font-medium">{customer?.email || 'No registrado'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Teléfono</Label>
                            <p className="font-medium">{customer?.phone || 'No registrado'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Método de autenticación</Label>
                            <p className="font-medium">
                              {customer?.authProvider === 'google' ? 'Google' : 'Teléfono'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Dirección</Label>
                          <p className="font-medium">{customer?.address || 'No registrada'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Miembro desde</Label>
                          <p className="font-medium">{formatDate(customer?.createdAt || '')}</p>
                        </div>
                        <Button 
                          onClick={() => setIsEditingProfile(true)}
                          className="w-full"
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Editar Perfil
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ⚙️ TAB: CONFIGURACIONES */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notificaciones */}
              <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-bell text-gray-500"></i>
                    Notificaciones
                  </CardTitle>
                  <CardDescription>
                    Configura cómo quieres recibir notificaciones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones por email</Label>
                      <p className="text-sm text-gray-500">Recibe ofertas y actualizaciones por email</p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS</Label>
                      <p className="text-sm text-gray-500">Notificaciones importantes por SMS</p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones push</Label>
                      <p className="text-sm text-gray-500">Notificaciones en tiempo real</p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Marketing</Label>
                      <p className="text-sm text-gray-500">Promociones y ofertas especiales</p>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) => setNotifications({...notifications, marketing: checked})}
                    />
                  </div>
                  <Button onClick={handleSaveSettings} className="w-full">
                    <i className="fas fa-save mr-2"></i>
                    Guardar Configuración
                  </Button>
                </CardContent>
              </Card>

              {/* Información de la Cuenta */}
              <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-shield-alt text-gray-500"></i>
                    Seguridad de la Cuenta
                  </CardTitle>
                  <CardDescription>
                    Gestiona la seguridad y privacidad de tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span className="font-medium">Estado de la cuenta</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Tu cuenta está {customer?.isActive ? 'activa' : 'inactiva'} y {customer?.isPhoneVerified ? 'verificada' : 'pendiente de verificación'}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>ID de usuario</span>
                      <code className="text-sm bg-white px-2 py-1 rounded">
                        {customer?.id?.slice(0, 8)}...
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Código de referido</span>
                      <code className="text-sm bg-white px-2 py-1 rounded">
                        {customer?.referralCode}
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Última visita</span>
                      <span className="text-sm">
                        {customer?.lastVisit ? formatDate(customer.lastVisit) : 'Ahora'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Cerrar Sesión
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}