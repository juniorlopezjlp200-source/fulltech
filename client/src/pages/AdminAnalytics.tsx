import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AdminAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("7days");

  const { data: analytics = {}, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics", selectedPeriod],
    retry: false,
  });

  const formatMoney = (amount: number) => {
    return `RD$${amount.toLocaleString('es-DO')}`;
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Analíticas y Reportes</h2>
          <p className="text-gray-600">Métricas de rendimiento y estadísticas del sistema</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="90days">Últimos 90 días</option>
            <option value="365days">Último año</option>
          </select>
          <Button variant="outline" data-testid="button-export-analytics">
            <i className="fas fa-download mr-2"></i>
            Exportar Reporte
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando analíticas...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visitantes Únicos</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.uniqueVisitors || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-blue-600"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  (analytics.visitorsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(analytics.visitorsChange || 0)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nuevos Registros</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.newRegistrations || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user-plus text-green-600"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  (analytics.registrationsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(analytics.registrationsChange || 0)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comisiones Generadas</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatMoney(analytics.totalCommissions || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-purple-600"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  (analytics.commissionsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(analytics.commissionsChange || 0)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Referencias Exitosas</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.successfulReferrals || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-handshake text-orange-600"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  (analytics.referralsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(analytics.referralsChange || 0)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
              </div>
            </div>
          </div>

          {/* Activity Chart Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Actividad de Usuarios</h3>
              <Badge variant="secondary">Datos en tiempo real</Badge>
            </div>
            
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-chart-line text-gray-400 text-4xl mb-4"></i>
                <p className="text-gray-500 mb-2">Gráfico de actividad disponible próximamente</p>
                <p className="text-sm text-gray-400">Se integrarán gráficos interactivos con Chart.js</p>
              </div>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Top Referidores</h3>
              <p className="text-sm text-gray-600">Usuarios que más han referido</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {(analytics.topReferrers || []).map((referrer: any, index: number) => (
                  <div key={referrer.id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{referrer.name}</div>
                        <div className="text-sm text-gray-500">Código: {referrer.referralCode}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{referrer.referralCount} referidos</div>
                      <div className="text-sm text-green-600">{formatMoney(referrer.totalCommissions)}</div>
                    </div>
                  </div>
                ))}
                
                {(!analytics.topReferrers || analytics.topReferrers.length === 0) && (
                  <div className="text-center py-8">
                    <i className="fas fa-chart-bar text-gray-300 text-3xl mb-3"></i>
                    <p className="text-gray-500">No hay datos de referidos aún</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
              <p className="text-sm text-gray-600">Últimas acciones en el sistema</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {(analytics.recentActivity || []).map((activity: any, index: number) => (
                  <div key={activity.id || index} className="flex items-center py-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <i className={`fas ${activity.icon || 'fa-bell'} text-blue-600 text-xs`}></i>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-sm text-gray-900">{activity.description}</div>
                      <div className="text-xs text-gray-500">{activity.timestamp}</div>
                    </div>
                  </div>
                ))}
                
                {(!analytics.recentActivity || analytics.recentActivity.length === 0) && (
                  <div className="text-center py-8">
                    <i className="fas fa-clock text-gray-300 text-3xl mb-3"></i>
                    <p className="text-gray-500">No hay actividad reciente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}