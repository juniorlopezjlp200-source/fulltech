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

export function Login() {
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

  const handleAdminLogin = () => {
    navigateInstantly('/admin/login');
  };

  const handleRegisterRedirect = () => {
    navigateInstantly('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-3">
      <div className="w-full max-w-md">
        {/* BOTÓN VOLVER AL CATÁLOGO */}
        <div className="mb-3 text-center">
          <Button
            variant="ghost" 
            onClick={createInstantClickHandler(() => navigateInstantly('/'))}
            className="text-white/70 hover:text-white hover:bg-white/10 text-sm py-1 px-3 transition-all duration-100"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver al Catálogo
          </Button>
        </div>

        {/* TARJETA DE LOGIN */}
        <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl relative overflow-hidden">
          <CardHeader className="text-center pb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xl">
              <img 
                src={logoUrl} 
                alt={siteName}
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling;
                  if (nextElement instanceof HTMLElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
              <i className="fas fa-sign-in-alt text-2xl text-white hidden"></i>
            </div>
            <CardTitle className="text-2xl text-white mb-2">{siteName}</CardTitle>
            <p className="text-blue-100 text-sm font-semibold">
              Inicia sesión en tu cuenta
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* LOGIN CON TELÉFONO - PRIORIDAD */}
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-400/30 rounded-lg">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-white mb-1">
                  <i className="fas fa-phone mr-2 text-blue-300"></i>
                  Inicia con Teléfono
                </h3>
                <p className="text-gray-200 text-xs">Acceso rápido y seguro</p>
              </div>

              <Button 
                onClick={createInstantClickHandler(handlePhoneAuth)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2.5 text-base shadow-lg transition-all duration-100"
              >
                <i className="fas fa-mobile-alt mr-2"></i>
                Iniciar con Teléfono
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
            <Button 
              onClick={createInstantClickHandler(handleGoogleAuth)}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2.5 text-base transition-all duration-100"
            >
              <i className="fab fa-google mr-2 text-red-500"></i>
              Continuar con Google
            </Button>

            {/* SEPARADOR */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-3 text-blue-200">¿No tienes cuenta?</span>
              </div>
            </div>

            {/* LINK A REGISTRO */}
            <Button 
              variant="outline"
              onClick={createInstantClickHandler(handleRegisterRedirect)}
              className="w-full border-white text-black bg-white/90 hover:bg-white hover:text-black py-2.5 text-base transition-all duration-100 font-semibold shadow-lg"
            >
              <i className="fas fa-user-plus mr-2 text-black"></i>
              Crear Cuenta Nueva
            </Button>

            {/* ADMIN ACCESS - DISCRETO */}
            <div className="text-center pt-2">
              <Button 
                variant="ghost"
                onClick={createInstantClickHandler(handleAdminLogin)}
                className="text-blue-300 hover:text-white hover:bg-white/10 text-xs py-2 transition-all duration-100"
              >
                <i className="fas fa-user-shield mr-2"></i>
                ¿Eres Admin? Inicia Aquí
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}