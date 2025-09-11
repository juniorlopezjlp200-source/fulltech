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

        {/* TARJETA ÚNICA PROFESIONAL */}
        <div className="max-w-lg mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl relative overflow-hidden">
            {/* Badge "NUEVO" */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              ¡NUEVO!
            </div>
            
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <i className="fas fa-mobile-alt text-black text-3xl"></i>
              </div>
              <CardTitle className="text-3xl text-white mb-2">¡Únete a FULLTECH!</CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                Elige tu método de acceso preferido
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* PRIORIDAD: REGISTRO CON TELÉFONO */}
              <div className="p-6 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-2 border-yellow-400/30 rounded-xl">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">
                    <i className="fas fa-phone mr-2 text-yellow-300"></i>
                    Registro con Teléfono
                  </h3>
                  <p className="text-gray-200 text-sm">¡Rápido y fácil! Solo tu nombre, teléfono y dirección</p>
                </div>
                
                <div className="text-center text-sm text-white mb-4 space-y-1">
                  <div>✨ <span className="font-semibold text-yellow-300">10% descuento</span> en tu primera compra</div>
                  <div>🎁 Participa en rifas exclusivas</div>
                  <div>📱 Acceso inmediato sin esperas</div>
                </div>

                <Button 
                  onClick={() => handleRoleSelect('phone')}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                  data-testid="button-phone-auth"
                >
                  <i className="fas fa-rocket mr-2"></i>
                  ¡Regístrate AHORA!
                </Button>
              </div>

              {/* SEPARADOR */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-4 text-blue-200">o también puedes</span>
                </div>
              </div>

              {/* GOOGLE OAUTH */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    <i className="fab fa-google mr-2 text-red-400"></i>
                    Inicia o Regístrate con Google
                  </h3>
                  <p className="text-blue-200 text-sm">Usa tu cuenta de Google existente</p>
                </div>

                <Button 
                  onClick={() => handleRoleSelect('google')}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold border-2 py-2"
                  data-testid="button-google-login"
                >
                  <i className="fab fa-google mr-2 text-red-500"></i>
                  Continuar con Google
                </Button>
              </div>

              {/* SEPARADOR ADMIN */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-3 text-blue-300">acceso especial</span>
                </div>
              </div>

              {/* ADMIN ACCESS - DISCRETO */}
              <div className="text-center">
                <Button 
                  variant="ghost"
                  onClick={() => handleRoleSelect('admin')}
                  className="text-blue-300 hover:text-white hover:bg-white/10 text-sm"
                  data-testid="button-admin-login"
                >
                  <i className="fas fa-user-shield mr-2"></i>
                  ¿Eres Admin? Inicia Aquí
                </Button>
              </div>
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