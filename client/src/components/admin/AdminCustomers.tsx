import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Filter, Eye, UserCheck, UserX, Phone, Mail, Calendar, Activity, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  authProvider: string;
  isActive: boolean;
  createdAt: string;
  lastVisit: string;
  referralCode: string;
  referredBy: string;
  totalReferrals: number;
  totalActivities: number;
  lastActivity: string;
}

interface CustomerDetails {
  customer: Customer;
  profile: any;
  referrals: {
    made: Customer[];
    referredBy: Customer;
  };
  activity: {
    recent: any[];
    total: number;
    byType: Array<{ activityType: string; count: number }>;
  };
}

export function AdminCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [authProvider, setAuthProvider] = useState("");
  const [hasReferrals, setHasReferrals] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Obtener clientes con filtros
  const { data: customersData, isLoading } = useQuery<{data: {customers: Customer[], pagination: any}}>({
    queryKey: ["/api/admin/customers", { 
      page: currentPage, 
      limit: 20,
      search: searchTerm,
      authProvider,
      hasReferrals: hasReferrals === "" ? undefined : hasReferrals === "true"
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20"
      });
      
      if (searchTerm) params.append("search", searchTerm);
      if (authProvider) params.append("authProvider", authProvider);
      if (hasReferrals !== "") params.append("hasReferrals", hasReferrals);
      
      const response = await apiRequest("GET", `/api/admin/customers?${params.toString()}`);
      return await response.json();
    }
  });

  // Obtener detalles de cliente específico
  const { data: customerDetails } = useQuery<{data: CustomerDetails}>({
    queryKey: ["/api/admin/customers", selectedCustomer],
    queryFn: async () => {
      if (!selectedCustomer) return null;
      const response = await apiRequest("GET", `/api/admin/customers/${selectedCustomer}`);
      return await response.json();
    },
    enabled: !!selectedCustomer
  });

  // Mutación para cambiar estado del cliente
  const toggleCustomerStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/customers/${id}/status`, { isActive });
      return await response.json();
    },
    onSuccess: (_, { id, isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({
        title: "Estado actualizado",
        description: `Cliente ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del cliente",
        variant: "destructive",
      });
    }
  });

  const customers = customersData?.data?.customers || [];
  const pagination = customersData?.data?.pagination;

  const handleSearch = () => {
    setCurrentPage(1);
    queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setAuthProvider("");
    setHasReferrals("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Clientes</h1>
        <p className="text-gray-600">Control total sobre todos los clientes registrados</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Registro</label>
              <Select value={authProvider} onValueChange={setAuthProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Referidos</label>
              <Select value={hasReferrals} onValueChange={setHasReferrals}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="true">Con referidos</SelectItem>
                  <SelectItem value="false">Sin referidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {pagination ? `Mostrando ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total} clientes` : 'Cargando...'}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Users className="h-3 w-3 mr-1" />
            Total: {pagination?.total || 0}
          </Badge>
        </div>
      </div>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{customer.name}</h3>
                      <Badge variant={customer.isActive ? "default" : "secondary"}>
                        {customer.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge 
                        variant={customer.authProvider === 'google' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {customer.authProvider === 'google' ? 'Google' : 'Teléfono'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </span>
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Registrado: {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: es })}
                      </span>
                      {customer.lastVisit && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Última visita: {format(new Date(customer.lastVisit), 'dd MMM yyyy', { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Stats */}
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{customer.totalReferrals}</p>
                    <p className="text-xs text-gray-500">Referidos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{customer.totalActivities}</p>
                    <p className="text-xs text-gray-500">Actividades</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCustomer(customer.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalles del Cliente</DialogTitle>
                          <DialogDescription>
                            Información completa y estadísticas de actividad
                          </DialogDescription>
                        </DialogHeader>
                        
                        {customerDetails?.data && (
                          <CustomerDetailsView details={customerDetails.data} />
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant={customer.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleCustomerStatus.mutate({
                        id: customer.id,
                        isActive: !customer.isActive
                      })}
                      disabled={toggleCustomerStatus.isPending}
                    >
                      {customer.isActive ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Página {pagination.page} de {pagination.totalPages}
            </span>
          </div>
          
          <Button 
            variant="outline" 
            disabled={currentPage >= pagination.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar detalles del cliente
function CustomerDetailsView({ details }: { details: CustomerDetails }) {
  const customer = details.customer;
  const profile = details.profile;
  const referrals = details.referrals;
  const activity = details.activity;

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre</label>
              <p className="text-base">{customer.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Teléfono</label>
              <p className="text-base">{customer.phone}</p>
            </div>
            {customer.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-base">{customer.email}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Código de Referido</label>
              <p className="text-base font-mono bg-gray-100 px-2 py-1 rounded">{customer.referralCode}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{referrals.made.length}</p>
                <p className="text-sm text-green-700">Referidos</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{activity.total}</p>
                <p className="text-sm text-blue-700">Actividades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Made */}
      {referrals.made.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Clientes Referidos ({referrals.made.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals.made.map((referred) => (
                <div key={referred.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{referred.name}</p>
                    <p className="text-sm text-gray-500">{referred.phone}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={referred.isActive ? "default" : "secondary"}>
                      {referred.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(referred.createdAt), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity by Type */}
      {activity.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividades por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activity.byType.map((actType) => (
                <div key={actType.activityType} className="flex items-center justify-between">
                  <span className="capitalize">{actType.activityType.replace('_', ' ')}</span>
                  <Badge variant="outline">{actType.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}