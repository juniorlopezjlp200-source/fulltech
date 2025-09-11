import { useState, useEffect } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TopBar } from "@/components/TopBar";

interface UserProfile {
  id: string;
  customerId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  avatar?: string;
  preferences?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export function MiPerfil() {
  const { customer, isLoading: customerLoading } = useCustomer();
  const { navigateInstantly } = useInstantNavigation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
    avatar: ''
  });

  // 📊 Obtener perfil del usuario
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: [`/api/customer/profile`],
    enabled: !!customer,
  });

  // Actualizar form data cuando se carga el perfil
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        address: profile.address || '',
        city: profile.city || '',
        province: profile.province || '',
        zipCode: profile.zipCode || '',
        avatar: profile.avatar || ''
      });
    }
  }, [profile]);

  // Mutación para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al actualizar perfil');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "¡Perfil actualizado!", description: "Tus cambios han sido guardados exitosamente." });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/customer/profile`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar tu perfil. Inténtalo de nuevo.", variant: "destructive" });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        address: profile.address || '',
        city: profile.city || '',
        province: profile.province || '',
        zipCode: profile.zipCode || '',
        avatar: profile.avatar || ''
      });
    }
    setIsEditing(false);
  };

  if (customerLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <TopBar />
        <div className="pt-20 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando tu perfil...</p>
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
            <p className="text-slate-600 mb-6">Necesitas iniciar sesión para ver tu perfil.</p>
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
          
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Mi Perfil</h1>
            <p className="text-green-100">Gestiona tu información personal</p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="text-center">Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center overflow-hidden">
                {customer.picture || formData.avatar ? (
                  <img 
                    src={customer.picture || formData.avatar} 
                    alt={customer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="fas fa-user text-white text-4xl"></i>
                )}
              </div>
              
              <h3 className="font-semibold text-lg text-slate-900 mb-1">
                {customer.name}
              </h3>
              <p className="text-slate-600 text-sm mb-2">{customer.email}</p>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
                {customer.referralCode}
              </div>
              
              {isEditing && (
                <div className="mt-4">
                  <Label htmlFor="avatar">URL de Avatar</Label>
                  <Input
                    id="avatar"
                    value={formData.avatar}
                    onChange={(e) => handleInputChange('avatar', e.target.value)}
                    placeholder="https://ejemplo.com/mi-foto.jpg"
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Información Personal</CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <i className="fas fa-edit mr-2"></i>
                    Editar
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={updateProfileMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Tu nombre"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="(809) 000-0000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Calle, número, sector"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Santo Domingo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="province">Provincia</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Distrito Nacional"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zipCode">Código Postal</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      disabled={!isEditing}
                      placeholder="10100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader>
                <CardTitle>Información de Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={customer.email || 'No especificado'} disabled className="bg-slate-50" />
                  </div>
                  
                  <div>
                    <Label>Código de Referencia</Label>
                    <Input value={customer.referralCode} disabled className="bg-slate-50" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Miembro desde</Label>
                    <Input 
                      value={new Date(customer.createdAt).toLocaleDateString('es-DO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} 
                      disabled 
                      className="bg-slate-50" 
                    />
                  </div>
                  
                  <div>
                    <Label>Última visita</Label>
                    <Input 
                      value={customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('es-DO') : 'Hoy'} 
                      disabled 
                      className="bg-slate-50" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}