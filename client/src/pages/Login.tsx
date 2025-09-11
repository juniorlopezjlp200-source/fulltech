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
      <div className="w-full max-w-md">
        {/* TARJETA ÚNICA COMPACTA */}
        <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl relative overflow-hidden">
          {/* Badge "NUEVO" */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold animate-pulse">
            ¡NUEVO!
          </div>
          
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
              <i className="fas fa-mobile-alt text-3xl text-white"></i>
            </div>
            <CardTitle className="text-2xl text-white mb-2">FULLTECH</CardTitle>
            <CardDescription className="text-blue-100 text-sm">
              <span className="font-bold text-yellow-300">10% descuento</span> en tu primera compra
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* PRIORIDAD: REGISTRO CON TELÉFONO */}
            <div className="p-4 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 rounded-lg">
              <div className="text-center mb-3">
                <h3 className="text-lg font-bold text-white mb-1">
                  <i className="fas fa-phone mr-2 text-yellow-300"></i>
                  Registro con Teléfono
                </h3>
                <p className="text-gray-200 text-xs">Rápido y fácil • Rifas exclusivas</p>
              </div>

              <Button 
                onClick={() => handleRoleSelect('phone')}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-2.5 shadow-lg transition-all duration-300"
                data-testid="button-phone-auth"
              >
                <i className="fas fa-rocket mr-2"></i>
                ¡Regístrate AHORA!
              </Button>
            </div>

            {/* SEPARADOR */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-3 text-blue-200">o también</span>
              </div>
            </div>

            {/* GOOGLE OAUTH */}
            <div className="space-y-3">
              <Button 
                onClick={() => handleRoleSelect('google')}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2.5"
                data-testid="button-google-login"
              >
                <i className="fab fa-google mr-2 text-red-500"></i>
                Inicia con Google
              </Button>

              {/* ADMIN ACCESS - DISCRETO */}
              <div className="text-center pt-2">
                <Button 
                  variant="ghost"
                  onClick={() => handleRoleSelect('admin')}
                  className="text-blue-300 hover:text-white hover:bg-white/10 text-xs py-2"
                  data-testid="button-admin-login"
                >
                  <i className="fas fa-user-shield mr-2"></i>
                  ¿Eres Admin? Inicia Aquí
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}