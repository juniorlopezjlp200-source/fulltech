import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Prevenir validación HTML5 que interfiere
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "same-origin", // ✅ Asegurar cookies de sesión
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log("✅ Login successful, forcing admin query refetch...", result);
        
        // ✅ CRÍTICO: Forzar refetch inmediato y remover cache viejo
        queryClient.removeQueries({ queryKey: ["/api/admin/me"] });
        await queryClient.refetchQueries({ 
          queryKey: ["/api/admin/me"], 
          type: "active",
          exact: true 
        });
        
        // ✅ Navegación después de refetch completo
        setLocation("/admin/dashboard");
      } else {
        setError(result.error || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <i className="fas fa-user-shield text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">FULLTECH Admin</h1>
          <p className="text-blue-200">Panel de Administración</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6" data-form-type="other">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email de Administrador
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                  placeholder="admin@fulltech.com"
                  required
                  autoComplete="username"
                  data-testid="input-admin-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  data-form-type="other"
                  data-testid="input-admin-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-admin-login"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

        </div>

        {/* Back to Catalog */}
        <div className="text-center mt-6">
          <button
            onClick={() => setLocation("/")}
            className="text-blue-200 hover:text-white transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
            data-testid="link-back-catalog"
          >
            <i className="fas fa-arrow-left"></i>
            Volver al Catálogo
          </button>
        </div>
      </div>
    </div>
  );
}