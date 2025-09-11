import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/admin/customers"],
    retry: false,
  });

  const filteredCustomers = customers.filter((customer: any) => {
    const searchLower = searchTerm.toLowerCase();
    return customer.name.toLowerCase().includes(searchLower) ||
           customer.phone?.toLowerCase().includes(searchLower) ||
           customer.email?.toLowerCase().includes(searchLower) ||
           customer.referralCode?.toLowerCase().includes(searchLower);
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra todos los clientes registrados en FULLTECH</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-export-customers">
            <i className="fas fa-download mr-2"></i>
            Exportar CSV
          </Button>
          <Button data-testid="button-send-notification">
            <i className="fas fa-bell mr-2"></i>
            Enviar Notificación
          </Button>
        </div>
      </div>

      {/* Search and Statistics */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar clientes</label>
            <Input
              placeholder="Buscar por nombre, teléfono, email o código de referido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-customers"
            />
          </div>
          <div className="flex items-end">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
                <p className="text-sm text-gray-600">Total Clientes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{customers.filter((c: any) => c.isActive).length}</p>
                <p className="text-sm text-gray-600">Activos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 lg:p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Clientes</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referido</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          {customer.picture ? (
                            <img src={customer.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <i className="fas fa-user text-white text-xs"></i>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.authProvider}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                      <div className="text-sm text-gray-500">{customer.email || 'Sin email'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="secondary">{customer.referralCode}</Badge>
                      {customer.referredBy && (
                        <div className="text-xs text-gray-500 mt-1">Por: {customer.referredBy}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant={customer.isActive ? "default" : "destructive"}>
                        {customer.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <i className="fas fa-eye mr-1"></i>
                          Ver
                        </Button>
                        <Button size="sm" variant="outline">
                          <i className="fas fa-edit mr-1"></i>
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredCustomers.length === 0 && (
          <div className="p-8 text-center">
            <i className="fas fa-users text-gray-300 text-4xl mb-4"></i>
            <p className="text-gray-500">No se encontraron clientes</p>
          </div>
        )}
      </div>
    </div>
  );
}