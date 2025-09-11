import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export function PhoneAuth() {
  const [activeTab, setActiveTab] = useState("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          window.location.href = "/customer/dashboard";
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
          window.location.href = "/customer/dashboard";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header Espectacular */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border-2 border-white/20 animate-pulse">
            <i className="fas fa-mobile-alt text-3xl text-black"></i>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
            ¡Únete a FULLTECH!
          </h1>
          <p className="text-xl text-yellow-100 mb-2">
            🎉 <span className="font-bold">10% de descuento</span> en tu primera compra
          </p>
          <p className="text-blue-200">Registro rápido con tu teléfono</p>
        </div>

        {/* Card Principal con Glass Effect */}
        <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-white mb-2">
              <i className="fas fa-star text-yellow-300 mr-2"></i>
              Acceso Privilegiado
            </CardTitle>
            <CardDescription className="text-blue-100">
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
              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label className="text-white font-medium mb-2 block">
                      <i className="fas fa-user mr-2 text-yellow-300"></i>
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
                      <i className="fas fa-phone mr-2 text-yellow-300"></i>
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
                      <i className="fas fa-map-marker-alt mr-2 text-yellow-300"></i>
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
                      <i className="fas fa-lock mr-2 text-yellow-300"></i>
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
                      <i className="fas fa-check-double mr-2 text-yellow-300"></i>
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

                  <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-lg p-4 text-center">
                    <p className="text-yellow-100 text-sm mb-2">
                      🎁 <span className="font-bold">Beneficios exclusivos al registrarte:</span>
                    </p>
                    <ul className="text-yellow-200 text-xs space-y-1">
                      <li>✨ 10% descuento en tu primera compra</li>
                      <li>🎯 Acceso a ofertas exclusivas</li>
                      <li>🎪 Participación en rifas mensuales</li>
                      <li>📱 Notificaciones de nuevos productos</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
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
              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
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

                  <div className="bg-blue-400/20 border border-blue-400/50 rounded-lg p-3 text-center">
                    <p className="text-blue-100 text-sm">
                      🔐 <span className="font-semibold">Acceso seguro y rápido</span><br/>
                      <span className="text-blue-200 text-xs">Tus datos están protegidos con nosotros</span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-bold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
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

            {/* Links adicionales */}
            <div className="mt-6 space-y-3">
              <div className="text-center">
                <Button
                  variant="ghost"
                  className="text-blue-200 hover:text-white hover:bg-white/10"
                  onClick={() => window.location.href = '/login'}
                >
                  <i className="fab fa-google mr-2"></i>
                  ¿Prefieres Google OAuth?
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  className="text-blue-200 hover:text-white hover:bg-white/10"
                  onClick={() => window.location.href = '/'}
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Volver al Catálogo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer motivacional */}
        <div className="text-center mt-6">
          <p className="text-blue-200 text-sm">
            <i className="fas fa-shield-alt mr-1 text-green-400"></i>
            Más de <span className="font-bold text-yellow-300">10,000 clientes</span> confían en nosotros
          </p>
        </div>
      </div>
    </div>
  );
}