import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Login() {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'google' | 'phone' | null>(null);

  const handleRoleSelect = (role: 'admin' | 'google' | 'phone') => {
    setSelectedRole(role);
    if (role === 'admin') {
      window.location.href = '/admin/login';
    } else if (role === 'google') {
      // Iniciar Google OAuth para clientes
      handleGoogleLogin();
    } else if (role === 'phone') {
      // Ir a registro/login con teléfono
      window.location.href = '/phone-auth';
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header más llamativo */}
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border-2 border-white/20">
            <i className="fas fa-mobile-alt text-4xl text-white"></i>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
            FULLTECH
          </h1>
          <p className="text-xl text-blue-100 mb-2">¡Tu Destino Tecnológico de Confianza!</p>
          <p className="text-blue-200">Regístrate ahora y obtén <span className="font-bold text-yellow-300">10% de descuento</span> en tu primera compra</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Opción NUEVA: Teléfono - MÁS DESTACADA */}
          <Card 
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-yellow-400/50 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 backdrop-blur-sm hover:scale-105 relative overflow-hidden group"
            onClick={() => handleRoleSelect('phone')}
            data-testid="card-phone-login"
          >
            {/* Badge "NUEVO" */}
            <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              ¡NUEVO!
            </div>
            
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-all duration-300">
                <i className="fas fa-phone text-black text-3xl"></i>
              </div>
              <CardTitle className="text-2xl text-yellow-200 mb-2">Registro con Teléfono</CardTitle>
              <CardDescription className="text-yellow-100">
                <span className="font-semibold">¡Rápido y Fácil!</span><br/>
                Solo tu nombre, teléfono y dirección
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center text-sm text-yellow-100 mb-3">
                ✨ <span className="font-semibold">10% descuento</span> en tu primera compra<br/>
                🎁 Participa en rifas exclusivas<br/>
                📱 Acceso inmediato sin esperas
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
                data-testid="button-phone-auth"
              >
                <i className="fas fa-rocket mr-2"></i>
                ¡Regístrate AHORA!
              </Button>
            </CardContent>
          </Card>

          {/* Google OAuth - Rediseñada */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:scale-105"
            onClick={() => handleRoleSelect('google')}
            data-testid="card-google-login"
          >
            <CardHeader className="text-center">
              <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fab fa-google text-red-500 text-2xl"></i>
              </div>
              <CardTitle className="text-xl text-white">Google OAuth</CardTitle>
              <CardDescription className="text-blue-200">
                Usa tu cuenta de Google existente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold border-2"
                size="lg"
                data-testid="button-google-login"
              >
                <i className="fab fa-google mr-2 text-red-500"></i>
                Continuar con Google
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Option - Separada y más discreta */}
        <div className="max-w-md mx-auto">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20"
            onClick={() => handleRoleSelect('admin')}
            data-testid="card-admin-login"
          >
            <CardHeader className="text-center py-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-user-shield text-white text-lg"></i>
              </div>
              <CardTitle className="text-lg text-white">Área de Administración</CardTitle>
              <CardDescription className="text-blue-200 text-sm">
                Panel para gestionar el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                size="sm"
                data-testid="button-admin-login"
              >
                <i className="fas fa-key mr-2"></i>
                Acceso Administrativo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Back button con estilo renovado */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            className="text-blue-200 hover:text-white hover:bg-white/10"
            onClick={() => window.location.href = '/'}
            data-testid="button-back-home"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver al Catálogo
          </Button>
        </div>
      </div>
    </div>
  );
}