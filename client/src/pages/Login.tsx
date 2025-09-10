import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Login() {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'customer' | null>(null);

  const handleRoleSelect = (role: 'admin' | 'customer') => {
    setSelectedRole(role);
    if (role === 'admin') {
      window.location.href = '/admin/login';
    } else {
      // Iniciar Google OAuth para clientes
      handleGoogleLogin();
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implementar Google OAuth
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img 
            src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
            alt="FULLTECH Logo" 
            className="w-16 h-16 object-contain mx-auto mb-4 rounded-full animate-pulse"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FULLTECH</h1>
          <p className="text-gray-600">Elige cómo quieres acceder</p>
        </div>

        <div className="space-y-4">
          {/* Cliente Option */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300"
            onClick={() => handleRoleSelect('customer')}
            data-testid="card-customer-login"
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user text-green-600 text-2xl"></i>
              </div>
              <CardTitle className="text-xl text-green-700">Soy Cliente</CardTitle>
              <CardDescription>
                Compra productos y participa en rifas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                data-testid="button-customer-login"
              >
                <i className="fab fa-google mr-2"></i>
                Continuar con Google
              </Button>
            </CardContent>
          </Card>

          {/* Admin Option */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300"
            onClick={() => handleRoleSelect('admin')}
            data-testid="card-admin-login"
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user-shield text-blue-600 text-2xl"></i>
              </div>
              <CardTitle className="text-xl text-blue-700">Soy Administrador</CardTitle>
              <CardDescription>
                Gestiona productos y administra el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
                data-testid="button-admin-login"
              >
                <i className="fas fa-key mr-2"></i>
                Ir a Admin
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            variant="ghost" 
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