import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useInstantFeedback } from "@/hooks/useInstantFeedback";

interface SiteConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: string;
}

export function PhoneAuth() {
  const [activeTab, setActiveTab] = useState("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Navegación instantánea
  const { navigateInstantly } = useInstantNavigation();
  const { createInstantClickHandler } = useInstantFeedback();

  // Configuraciones del sitio
  const { data: configs = [] } = useQuery<SiteConfig[]>({
    queryKey: ["/api/site-configs"],
  });

  const logoUrl = configs.find(c => c.key === 'logo_url')?.value || 'https://i.postimg.cc/3R2Nzj1g/untitled-0-removebg-preview.png';
  const siteName = configs.find(c => c.key === 'site_name')?.value || 'FULLTECH';

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: ""
  });

  // Login form state
  const [loginData, setLoginData] = useState({
    phone: "",
    password: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validaciones
    if (registerData.password !== registerData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (registerData.phone.length < 10) {
      setError("El teléfono debe tener al menos 10 dígitos");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/phone/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerData.name,
          phone: registerData.phone,
          address: registerData.address,
          password: registerData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`¡Registro exitoso! Bienvenido ${data.customer.name}. Tu código de referencia es: ${data.customer.referralCode}`);
        setTimeout(() => {
          navigateInstantly("/customer/dashboard");
        }, 2000);
      } else {
        setError(data.error || "Error en el registro");
      }
    } catch (err) {
      setError("Error de conexión. Por favor intenta de nuevo.");
    }

    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/phone/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`¡Bienvenido de vuelta ${data.customer.name}!`);
        setTimeout(() => {
          navigateInstantly("/customer/dashboard");
        }, 1500);
      } else {
        setError(data.error || "Credenciales incorrectas");
      }
    } catch (err) {
      setError("Error de conexión. Por favor intenta de nuevo.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-3">
      <div className="w-full max-w-md">
        {/* Header Compacto y Profesional */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl border-2 border-white/30">
            <img 
              src={logoUrl} 
              alt={siteName}
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling;
                if (nextElement instanceof HTMLElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
            <i className="fas fa-mobile-alt text-2xl text-blue-600 hidden"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
            ¡Únete a {siteName}!
          </h1>
          <p className="text-lg text-yellow-100 mb-1">
            🎉 <span className="font-bold">10% de descuento</span> en tu primera compra
          </p>
          <p className="text-blue-200 text-sm">Registro rápido con tu teléfono</p>
        </div>

        {/* Card Principal Compacto */}
        <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl text-white mb-1">
              <i className="fas fa-star text-yellow-300 mr-2"></i>
              Acceso Privilegiado
            </CardTitle>
            <CardDescription className="text-blue-100 text-sm">
              Únete a miles de clientes satisfechos
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-black text-white font-semibold"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  Registro
                </TabsTrigger>
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-purple-500 data-[state=active]:text-white text-blue-200 font-semibold"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Iniciar Sesión
                </TabsTrigger>
              </TabsList>

              {/* Mensajes de estado */}
              {error && (
                <Alert className="mt-4 bg-red-500/20 border-red-500/50 text-red-200">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mt-4 bg-green-500/20 border-green-500/50 text-green-200">
                  <i className="fas fa-check-circle mr-2"></i>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Tab de Registro */}
              <TabsContent value="register" className="space-y-3 mt-4">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <Label className="text-white font-medium mb-2 block">
                      <i className="fas fa-user mr-2 text-blue-300"></i>
                      Nombre Completo
                    </Label>
                    <Input
                      type="text"
                      placeholder="Tu nombre completo"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white font-medium mb-2 block">
                      <i className="fas fa-phone mr-2 text-blue-300"></i>
                      Teléfono
                    </Label>
                    <Input
                      type="tel"
                      placeholder="Ej: 18095551234"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value.replace(/\D/g, '') })}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white font-medium mb-2 block">
                      <i className="fas fa-map-marker-alt mr-2 text-blue-300"></i>
                      Dirección
                    </Label>
                    <Input
                      type="text"
                      placeholder="Tu dirección completa"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white font-medium mb-2 block">
                      <i className="fas fa-lock mr-2 text-blue-300"></i>
                      Contraseña
                    </Label>
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white font-medium mb-2 block">
                      <i className="fas fa-check-double mr-2 text-blue-300"></i>
                      Confirmar Contraseña
                    </Label>
                    <Input
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="bg-blue-400/20 border border-blue-400/50 rounded-lg p-2 text-center">
                    <p className="text-white text-xs mb-1">
                      🎁 <span className="font-bold">Beneficios exclusivos:</span>
                    </p>
                    <p className="text-blue-100 text-xs">
                      ✨ 10% descuento • 🎯 Ofertas exclusivas • 🎪 Rifas mensuales
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Registrando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-rocket mr-2"></i>
                        ¡Registrarme AHORA!
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Tab de Login */}
              <TabsContent value="login" className="space-y-3 mt-4">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <Label className="text-white font-medium mb-2 block">
                      <i className="fas fa-phone mr-2 text-blue-300"></i>
                      Teléfono
                    </Label>
                    <Input
                      type="tel"
                      placeholder="Tu número de teléfono"
                      value={loginData.phone}
                      onChange={(e) => setLoginData({ ...loginData, phone: e.target.value.replace(/\D/g, '') })}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white font-medium mb-2 block">
                      <i className="fas fa-lock mr-2 text-blue-300"></i>
                      Contraseña
                    </Label>
                    <Input
                      type="password"
                      placeholder="Tu contraseña"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="bg-blue-400/20 border border-blue-400/50 rounded-lg p-2 text-center">
                    <p className="text-blue-100 text-xs">
                      🔐 <span className="font-semibold">Acceso seguro y rápido</span> • Datos protegidos
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-bold py-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2"></i>
                        Iniciar Sesión
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Links adicionales compactos */}
            <div className="mt-4 flex justify-center gap-4">
              <Button
                variant="ghost"
                className="text-blue-200 hover:text-white hover:bg-white/10 text-sm py-2"
                onClick={createInstantClickHandler(() => navigateInstantly('/login'))}
              >
                <i className="fab fa-google mr-1"></i>
                Google
              </Button>
              <Button
                variant="ghost"
                className="text-blue-200 hover:text-white hover:bg-white/10 text-sm py-2"
                onClick={createInstantClickHandler(() => navigateInstantly('/'))}
              >
                <i className="fas fa-arrow-left mr-1"></i>
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer compacto */}
        <div className="text-center mt-3">
          <p className="text-blue-200 text-xs">
            <i className="fas fa-shield-alt mr-1 text-green-400"></i>
            Más de <span className="font-bold text-yellow-300">10,000 clientes</span> confían en nosotros
          </p>
        </div>
      </div>
    </div>
  );
}