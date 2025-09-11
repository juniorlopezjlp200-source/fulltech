import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useInstantFeedback } from "@/hooks/useInstantFeedback";
import { useQuery } from "@tanstack/react-query";

interface SiteConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: string;
}

export function Register() {
  const { navigateInstantly } = useInstantNavigation();
  const { createInstantClickHandler } = useInstantFeedback();

  // Configuraciones del sitio
  const { data: configs = [] } = useQuery<SiteConfig[]>({
    queryKey: ["/api/site-configs"],
  });

  const logoUrl = configs.find(c => c.key === 'logo_url')?.value || 'https://i.postimg.cc/3R2Nzj1g/untitled-0-removebg-preview.png';
  const siteName = configs.find(c => c.key === 'site_name')?.value || 'FULLTECH';

  const handlePhoneAuth = () => {
    navigateInstantly('/phone-auth');
  };

  const handleGoogleAuth = () => {
    window.location.href = '/api/auth/google';
  };

  const handleLoginRedirect = () => {
    navigateInstantly('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* BOTÓN VOLVER AL CATÁLOGO */}
        <div className="mb-4 text-center">
          <Button
            variant="ghost" 
            onClick={createInstantClickHandler(() => navigateInstantly('/'))}
            className="text-white/70 hover:text-white hover:bg-white/10 text-sm py-2 px-4 transition-all duration-100"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver al Catálogo
          </Button>
        </div>

        {/* TARJETA DE REGISTRO */}
        <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl relative overflow-hidden">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
              <img 
                src={logoUrl} 
                alt={siteName}
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'block';
                }}
              />
              <i className="fas fa-user-plus text-2xl text-white hidden"></i>
            </div>
            <CardTitle className="text-2xl text-white mb-2">{siteName}</CardTitle>
            <p className="text-green-100 text-sm font-semibold">
              ¡Regístrate y comienza a ganar!
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* REGISTRO CON TELÉFONO - PRIORIDAD */}
            <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-400/30 rounded-lg">
              <div className="text-center mb-3">
                <h3 className="text-lg font-bold text-white mb-1">
                  <i className="fas fa-phone mr-2 text-green-300"></i>
                  Registro con Teléfono
                </h3>
                <p className="text-gray-200 text-xs">Rápido y fácil • Rifas exclusivas</p>
              </div>

              <Button 
                onClick={createInstantClickHandler(handlePhoneAuth)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 text-base shadow-lg transition-all duration-100"
              >
                <i className="fas fa-mobile-alt mr-2"></i>
                Registrarse con Teléfono
              </Button>
            </div>

            {/* SEPARADOR */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-3 text-blue-200">o también</span>
              </div>
            </div>

            {/* GOOGLE OAUTH */}
            <Button 
              onClick={createInstantClickHandler(handleGoogleAuth)}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 text-base transition-all duration-100"
            >
              <i className="fab fa-google mr-2 text-red-500"></i>
              Continuar con Google
            </Button>

            {/* SEPARADOR */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-3 text-blue-200">¿Ya tienes cuenta?</span>
              </div>
            </div>

            {/* LINK A LOGIN */}
            <Button 
              variant="outline"
              onClick={createInstantClickHandler(handleLoginRedirect)}
              className="w-full border-white/30 text-white hover:bg-white/10 hover:text-white py-3 text-base transition-all duration-100"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>

        {/* BENEFICIOS DEL REGISTRO */}
        <div className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          <h4 className="text-white font-semibold text-center mb-3">
            <i className="fas fa-gift mr-2 text-yellow-300"></i>
            Beneficios al registrarte
          </h4>
          <ul className="text-white/80 text-sm space-y-2">
            <li className="flex items-center gap-2">
              <i className="fas fa-check-circle text-green-400 text-xs"></i>
              Descuentos en tu primera compra
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-check-circle text-green-400 text-xs"></i>
              Participación en rifas mensuales
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-check-circle text-green-400 text-xs"></i>
              Programa de afiliados con ganancias
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-check-circle text-green-400 text-xs"></i>
              Soporte prioritario
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}