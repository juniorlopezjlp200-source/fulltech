import { useState, useEffect } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TopBar } from "@/components/TopBar";

interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
    referralUpdates: boolean;
    orderUpdates: boolean;
  };
  settings: {
    language: string;
    currency: string;
    theme: string;
    autoLogin: boolean;
    dataSharing: boolean;
  };
}

export function MiConfiguracion() {
  const { customer, isLoading: customerLoading, logout } = useCustomer();
  const { navigateInstantly } = useInstantNavigation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load user preferences from backend
  const { data: userPreferences, isLoading: preferencesLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/customer/preferences"],
    enabled: !!customer,
  });

  // Local state to track changes before saving
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false,
    referralUpdates: true,
    orderUpdates: true
  });

  const [preferences, setPreferences] = useState({
    language: 'es',
    currency: 'DOP',
    theme: 'light',
    autoLogin: true,
    dataSharing: false
  });

  // Update local state when backend data loads
  useEffect(() => {
    if (userPreferences) {
      setNotifications(userPreferences.notifications);
      setPreferences(userPreferences.settings);
    }
  }, [userPreferences]);

  // Mutation to save preferences to backend
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { notifications?: any; settings?: any }) => {
      const response = await fetch('/api/customer/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/preferences"] });
      toast({ 
        title: "Configuración guardada", 
        description: "Tus preferencias han sido actualizadas exitosamente." 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "No se pudo guardar la configuración. Inténtalo de nuevo.", 
        variant: "destructive" 
      });
    },
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    
    // Save to backend immediately
    updatePreferencesMutation.mutate({ notifications: newNotifications });
  };

  const handlePreferenceChange = (key: string, value: string | boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    // Save to backend immediately
    updatePreferencesMutation.mutate({ settings: newPreferences });
  };

  const handleLogout = () => {
    logout();
    toast({ 
      title: "Sesión cerrada", 
      description: "Has cerrado sesión exitosamente." 
    });
  };

  const handleDeleteAccount = () => {
    // In a real implementation, this would show a confirmation modal
    alert("Para eliminar tu cuenta, contacta a soporte. Esta acción no se puede deshacer.");
  };

  if (customerLoading || preferencesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <TopBar />
        <div className="pt-20 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando configuración...</p>
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
            <p className="text-slate-600 mb-6">Necesitas iniciar sesión para ver la configuración.</p>
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
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigateInstantly('/mi/tablero')}
              className="text-slate-600 hover:text-slate-900"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Volver al Tablero
            </Button>
          </div>
          
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Configuración</h1>
            <p className="text-purple-100">Personaliza tu experiencia en FULLTECH</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Notificaciones */}
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-bell text-purple-600"></i>
                Notificaciones
                {updatePreferencesMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin ml-2"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                  <p className="text-sm text-slate-500">Recibe actualizaciones importantes por correo</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  disabled={updatePreferencesMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sms-notifications">Notificaciones SMS</Label>
                  <p className="text-sm text-slate-500">Recibe alertas por mensaje de texto</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={notifications.sms}
                  onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                  disabled={updatePreferencesMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="push-notifications">Notificaciones Push</Label>
                  <p className="text-sm text-slate-500">Recibe notificaciones en tiempo real</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  disabled={updatePreferencesMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="marketing-notifications">Marketing y Promociones</Label>
                  <p className="text-sm text-slate-500">Recibe ofertas especiales y novedades</p>
                </div>
                <Switch
                  id="marketing-notifications"
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                  disabled={updatePreferencesMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="referral-notifications">Actualizaciones de Referidos</Label>
                  <p className="text-sm text-slate-500">Recibe notificaciones sobre tus referidos</p>
                </div>
                <Switch
                  id="referral-notifications"
                  checked={notifications.referralUpdates}
                  onCheckedChange={(checked) => handleNotificationChange('referralUpdates', checked)}
                  disabled={updatePreferencesMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferencias */}
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-cog text-purple-600"></i>
                Preferencias
                {updatePreferencesMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin ml-2"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={preferences.language} 
                    onValueChange={(value) => handlePreferenceChange('language', value)}
                    disabled={updatePreferencesMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select 
                    value={preferences.currency} 
                    onValueChange={(value) => handlePreferenceChange('currency', value)}
                    disabled={updatePreferencesMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOP">Peso Dominicano (RD$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano (US$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-login">Inicio de Sesión Automático</Label>
                  <p className="text-sm text-slate-500">Mantener la sesión iniciada</p>
                </div>
                <Switch
                  id="auto-login"
                  checked={preferences.autoLogin}
                  onCheckedChange={(checked) => handlePreferenceChange('autoLogin', checked)}
                  disabled={updatePreferencesMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="data-sharing">Compartir Datos de Uso</Label>
                  <p className="text-sm text-slate-500">Ayúdanos a mejorar la app compartiendo datos anónimos</p>
                </div>
                <Switch
                  id="data-sharing"
                  checked={preferences.dataSharing}
                  onCheckedChange={(checked) => handlePreferenceChange('dataSharing', checked)}
                  disabled={updatePreferencesMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-shield-alt text-purple-600"></i>
                Seguridad y Privacidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Información de Cuenta</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> {customer.email || 'No especificado'}</p>
                  <p><strong>Última actividad:</strong> {customer.lastVisit ? new Date(customer.lastVisit).toLocaleString('es-DO') : 'Ahora'}</p>
                  <p><strong>Método de registro:</strong> {customer.googleId ? 'Google' : 'Teléfono'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button variant="outline" className="w-full justify-start">
                  <i className="fas fa-key mr-3"></i>
                  Cambiar Contraseña
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <i className="fas fa-download mr-3"></i>
                  Descargar Mis Datos
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigateInstantly('/privacy')}
                >
                  <i className="fas fa-user-shield mr-3"></i>
                  Ver Política de Privacidad
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acciones de Cuenta */}
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-user-cog text-purple-600"></i>
                Acciones de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <i className="fas fa-sign-out-alt mr-3"></i>
                Cerrar Sesión
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDeleteAccount}
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              >
                <i className="fas fa-trash-alt mr-3"></i>
                Eliminar Cuenta
              </Button>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Nota:</strong> Para eliminar tu cuenta permanentemente, contacta a nuestro equipo de soporte. 
                  Esta acción no se puede deshacer y perderás todos tus datos y referidos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}