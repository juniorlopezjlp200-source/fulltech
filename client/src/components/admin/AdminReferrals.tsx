import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserPlus, TrendingUp, Award, Phone, Mail, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReferralStats {
  overview: {
    totalCustomers: number;
    totalReferrals: number;
    referralRate: string;
  };
  topReferrers: Array<{
    customerId: string;
    customerName: string;
    customerPhone: string;
    referralCode: string;
    referralCount: number;
  }>;
  byAuthProvider: Array<{
    authProvider: string;
    totalCustomers: number;
    customersWithReferrals: number;
  }>;
  byMonth: Array<{
    month: string;
    count: number;
  }>;
}

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

export function AdminReferrals() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  // Obtener estadísticas de referidos
  const { data: referralStats, isLoading: statsLoading } = useQuery<{data: ReferralStats}>({
    queryKey: ["/api/admin/stats/referrals"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/stats/referrals");
      return await response.json();
    }
  });

  // Obtener clientes con estadísticas
  const { data: customersData, isLoading: customersLoading } = useQuery<{data: {customers: Customer[], pagination: any}}>({
    queryKey: ["/api/admin/customers", { hasReferrals: true, page: 1, limit: 20 }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/customers?hasReferrals=true&page=1&limit=20");
      return await response.json();
    }
  });

  if (statsLoading || customersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = referralStats?.data;
  const customers = customersData?.data?.customers || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Referidos</h1>
        <p className="text-gray-600">Control total sobre referidos, códigos y comisiones</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalCustomers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Clientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referidos</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalReferrals?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Clientes referidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Referidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.referralRate}%</div>
            <p className="text-xs text-muted-foreground">Clientes que vinieron referidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Referrer</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.topReferrers?.[0]?.referralCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.topReferrers?.[0]?.customerName || "Sin datos"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top 10 - Clientes que Más Refieren
            </CardTitle>
            <CardDescription>
              Clientes que han traído más referidos a la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topReferrers?.map((referrer, index) => (
                <div key={referrer.customerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${ 
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{referrer.customerName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="h-3 w-3" />
                        {referrer.customerPhone}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Código: {referrer.referralCode}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{referrer.referralCount}</p>
                    <p className="text-xs text-gray-500">referidos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referrals by Auth Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Referidos por Tipo de Registro
            </CardTitle>
            <CardDescription>
              Análisis de referidos según el método de autenticación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.byAuthProvider?.map((provider) => (
                <div key={provider.authProvider} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {provider.authProvider === 'google' ? (
                        <Mail className="h-4 w-4 text-red-500" />
                      ) : (
                        <Phone className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">
                        {provider.authProvider === 'google' ? 'Google' : 'Teléfono'}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {provider.customersWithReferrals}/{provider.totalCustomers}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        provider.authProvider === 'google' ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${provider.totalCustomers > 0 ? (provider.customersWithReferrals / provider.totalCustomers) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {provider.totalCustomers > 0 ? 
                      ((provider.customersWithReferrals / provider.totalCustomers) * 100).toFixed(1) 
                      : 0}% de referidos
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals by Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            Evolución de Referidos por Mes
          </CardTitle>
          <CardDescription>
            Últimos 12 meses de actividad de referidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.byMonth?.map((month) => (
              <div key={month.month} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm font-medium">{month.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.min((month.count / Math.max(...(stats.byMonth?.map(m => m.count) || [1]))) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <Badge variant="secondary">{month.count}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Customers with Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Clientes con Referidos Activos
          </CardTitle>
          <CardDescription>
            Últimos clientes que han referido a otros usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
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
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                      <span>Código: {customer.referralCode}</span>
                      <span>Registrado: {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={customer.authProvider === 'google' ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {customer.authProvider === 'google' ? 'Google' : 'Teléfono'}
                    </Badge>
                    <Badge 
                      variant={customer.isActive ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {customer.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-green-600 mt-1">{customer.totalReferrals}</p>
                  <p className="text-xs text-gray-500">referidos</p>
                  <p className="text-xs text-gray-400">{customer.totalActivities} actividades</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}