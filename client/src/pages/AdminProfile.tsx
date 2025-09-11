import { useAdmin } from "@/hooks/useAdmin";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function AdminProfile() {
  const { admin, isLoading, isAuthenticated } = useAdmin();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    picture: ""
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/admin/login";
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || "",
        email: admin.email || "",
        picture: admin.picture || ""
      });
    }
  }, [admin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePictureUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      picture: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar actualización de perfil de admin
    console.log("Actualizar perfil admin:", formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-arrow-left text-gray-600"></i>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Mi Perfil de Administrador</h1>
                <p className="text-sm text-gray-500">Editar información personal y configuración</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit}>
            {/* Profile Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {formData.picture ? (
                      <img 
                        src={formData.picture} 
                        alt="Admin Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <i className="fas fa-user-tie text-white text-2xl"></i>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <div className="mt-4">
                    <ObjectUploader
                      onUploadComplete={handlePictureUpload}
                      className="text-sm"
                    >
                      <Button type="button" variant="outline" size="sm">
                        <i className="fas fa-camera mr-2"></i>
                        Cambiar Foto
                      </Button>
                    </ObjectUploader>
                  </div>
                </div>

                {/* Admin Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{admin?.name}</h2>
                  <p className="text-gray-600">{admin?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <i className="fas fa-crown mr-1"></i>
                      Administrador
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <i className="fas fa-check-circle mr-1"></i>
                      {admin?.role || 'Admin'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ingrese su nombre completo"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@fulltech.com"
                    required
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Información de la Cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Rol:</span>
                    <span className="ml-2 font-medium">{admin?.role || 'Administrador'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Último acceso:</span>
                    <span className="ml-2 font-medium">
                      {admin?.lastLogin ? new Date(admin.lastLogin).toLocaleDateString('es-ES') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">ID de Admin:</span>
                    <span className="ml-2 font-mono text-xs">{admin?.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Estado:</span>
                    <span className="ml-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <i className="fas fa-circle mr-1 text-green-500"></i>
                        Activo
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Volver
              </Button>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (admin) {
                      setFormData({
                        name: admin.name || "",
                        email: admin.email || "",
                        picture: admin.picture || ""
                      });
                    }
                  }}
                >
                  <i className="fas fa-undo mr-2"></i>
                  Descartar Cambios
                </Button>
                <Button type="submit">
                  <i className="fas fa-save mr-2"></i>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}