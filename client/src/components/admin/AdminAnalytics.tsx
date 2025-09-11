import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Users, 
  Activity, 
  Calendar,
  Eye,
  MousePointer,
  Share,
  Heart,
  ShoppingBag
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardOverview {
  totals: {
    customers: number;
    activeCustomers: number;
    customersWithReferrals: number;
    products: number;
    recentActivity: number;
    newCustomers: number;
  };
  breakdown: {
    byAuthProvider: Array<{
      authProvider: string;
      count: number;
    }>;
  };
  metrics: {
    activationRate: string;
    referralRate: string;
  };
}

interface ActivityStats {
  period: string;
  customerId?: string;
  byType: Array<{
    activityType: string;
    count: number;
  }>;
  byDay: Array<{
    date: string;
    count: number;
  }>;
  byHour: Array<{
    hour: number;
    count: number;
  }>;
  mostActiveCustomers: Array<{
    customerId: string;
    customerName: string;
    customerPhone: string;
    activityCount: number;
  }>;
}

const ACTIVITY_ICONS = {
  visit: Eye,
  page_visit: Eye,
  page_time: Clock,
  like: Heart,
  share: Share,
  purchase: ShoppingBag,
  click: MousePointer
};

const ACTIVITY_COLORS = {
  visit: "bg-blue-500",
  page_visit: "bg-blue-500",
  page_time: "bg-green-500",
  like: "bg-red-500",
  share: "bg-purple-500",
  purchase: "bg-orange-500",
  click: "bg-indigo-500"
};

export function AdminAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  // Obtener vista general del dashboard
  const { data: overviewData, isLoading: overviewLoading } = useQuery<{data: DashboardOverview}>({
    queryKey: ["/api/admin/stats/overview"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/stats/overview");
      return await response.json();
    }
  });

  // Obtener estadísticas de actividad
  const { data: activityData, isLoading: activityLoading } = useQuery<{data: ActivityStats}>({
    queryKey: ["/api/admin/stats/activity", { period: selectedPeriod, customerId: selectedCustomer }],
    queryFn: async () => {
      const params = new URLSearchParams({ period: selectedPeriod });
      if (selectedCustomer) params.append("customerId", selectedCustomer);
      
      const response = await apiRequest("GET", `/api/admin/stats/activity?${params.toString()}`);
      return await response.json();
    }
  });

  const overview = overviewData?.data;
  const activity = activityData?.data;

  if (overviewLoading || activityLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Análisis y Estadísticas</h1>
        <p className="text-gray-600">Análisis completo de actividad, visitas y comportamiento de usuarios</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totals.customers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+{overview?.totals.newCustomers || 0}</span> últimos 7 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totals.activeCustomers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.metrics.activationRate}% tasa de activación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totals.recentActivity?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Referidos</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totals.customersWithReferrals?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.metrics.referralRate}% de referidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análisis de Actividad Detallado
          </CardTitle>
          <CardDescription>
            Análisis por período de tiempo con horarios y patrones de uso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Período:</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Último día</SelectItem>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Actividades por Tipo
            </CardTitle>
            <CardDescription>
              Distribución de diferentes tipos de actividad de usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.byType?.map((actType) => {
                const Icon = ACTIVITY_ICONS[actType.activityType as keyof typeof ACTIVITY_ICONS] || Activity;
                const colorClass = ACTIVITY_COLORS[actType.activityType as keyof typeof ACTIVITY_COLORS] || "bg-gray-500";
                const maxCount = Math.max(...(activity.byType?.map(a => a.count) || [1]));
                const percentage = (actType.count / maxCount) * 100;
                
                return (
                  <div key={actType.activityType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium capitalize">
                          {actType.activityType.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge variant="secondary">{actType.count.toLocaleString()}</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colorClass}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity by Hour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Horarios de Mayor Actividad
            </CardTitle>
            <CardDescription>
              Patrones de uso por hora del día (24 horas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activity?.byHour?.map((hourData) => {
                const maxCount = Math.max(...(activity.byHour?.map(h => h.count) || [1]));
                const percentage = (hourData.count / maxCount) * 100;
                const isPeakHour = hourData.count === maxCount;
                
                return (
                  <div key={hourData.hour} className="flex items-center gap-3">
                    <div className="w-12 text-sm font-medium text-gray-600">
                      {hourData.hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3 relative">
                        <div 
                          className={`h-3 rounded-full transition-all ${
                            isPeakHour ? 'bg-green-500' : 'bg-green-300'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                        {isPeakHour && (
                          <div className="absolute -top-1 -right-1 text-xs bg-green-500 text-white px-1 py-0.5 rounded">
                            Pico
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm text-gray-600">
                      {hourData.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Actividad por Día
            </CardTitle>
            <CardDescription>
              Tendencias diarias para el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity?.byDay?.slice(-14).map((dayData) => {
                const maxCount = Math.max(...(activity.byDay?.map(d => d.count) || [1]));
                const percentage = (dayData.count / maxCount) * 100;
                const date = new Date(dayData.date);
                
                return (
                  <div key={dayData.date} className="flex items-center gap-3">
                    <div className="w-20 text-sm font-medium text-gray-600">
                      {format(date, 'dd MMM', { locale: es })}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <Badge variant="outline">{dayData.count}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Most Active Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Clientes Más Activos
            </CardTitle>
            <CardDescription>
              Top 10 clientes con mayor actividad en el período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity?.mostActiveCustomers?.slice(0, 10).map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-purple-500' : 
                      index === 1 ? 'bg-purple-400' : 
                      index === 2 ? 'bg-purple-300' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.customerName}</p>
                      <p className="text-sm text-gray-500">{customer.customerPhone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">{customer.activityCount}</p>
                    <p className="text-xs text-gray-500">actividades</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auth Provider Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Distribución por Método de Registro
          </CardTitle>
          <CardDescription>
            Comparación entre registros por Google y teléfono
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {overview?.breakdown.byAuthProvider?.map((provider) => {
              const total = overview.totals.customers;
              const percentage = total > 0 ? (provider.count / total) * 100 : 0;
              
              return (
                <div key={provider.authProvider} className="text-center p-6 border border-gray-200 rounded-lg">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white mb-4 ${
                    provider.authProvider === 'google' ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                    {provider.authProvider === 'google' ? (
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {provider.authProvider === 'google' ? 'Google' : 'Teléfono'}
                  </h3>
                  <p className="text-3xl font-bold mb-2">{provider.count.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{percentage.toFixed(1)}% del total</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div 
                      className={`h-2 rounded-full ${
                        provider.authProvider === 'google' ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}