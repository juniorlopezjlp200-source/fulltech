import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AdminReferrals() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["/api/admin/referrals"],
    retry: false,
  });

  const filteredReferrals = referrals.filter((referral: any) => {
    const searchLower = searchTerm.toLowerCase();
    return referral.referrerName?.toLowerCase().includes(searchLower) ||
           referral.referredName?.toLowerCase().includes(searchLower) ||
           referral.referrerCode?.toLowerCase().includes(searchLower);
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

  const formatMoney = (amount: number) => {
    return `RD$${amount.toLocaleString('es-DO')}`;
  };

  const totalCommissions = referrals.reduce((sum: number, ref: any) => sum + (ref.commissionAmount || 0), 0);
  const activeReferrals = referrals.filter((ref: any) => ref.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Sistema de Referidos</h2>
          <p className="text-gray-600">Gestiona el programa de referidos y comisiones del 5%</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-export-referrals">
            <i className="fas fa-download mr-2"></i>
            Exportar Reporte
          </Button>
          <Button data-testid="button-process-commissions">
            <i className="fas fa-dollar-sign mr-2"></i>
            Procesar Comisiones
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-share-alt text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Referidos</p>
              <p className="text-2xl font-semibold text-gray-900">{referrals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Referencias Activas</p>
              <p className="text-2xl font-semibold text-gray-900">{activeReferrals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-money-bill text-purple-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Comisiones</p>
              <p className="text-2xl font-semibold text-gray-900">{formatMoney(totalCommissions)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Buscar referidos</label>
          <Input
            placeholder="Buscar por nombre del referidor, referido o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-referrals"
          />
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 lg:p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Referidos</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando referidos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referidor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referido</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReferrals.map((referral: any) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <i className="fas fa-user text-white text-xs"></i>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{referral.referrerName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{referral.referrerCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{referral.referredName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{referral.referredPhone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatMoney(referral.commissionAmount || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        De compra: {formatMoney(referral.purchaseAmount || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant={
                        referral.status === 'active' ? 'default' :
                        referral.status === 'paid' ? 'default' :
                        'secondary'
                      }>
                        {referral.status === 'active' ? 'Pendiente' :
                         referral.status === 'paid' ? 'Pagada' :
                         'Procesando'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(referral.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <i className="fas fa-eye mr-1"></i>
                          Ver
                        </Button>
                        {referral.status === 'active' && (
                          <Button size="sm" variant="default">
                            <i className="fas fa-check mr-1"></i>
                            Pagar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredReferrals.length === 0 && (
          <div className="p-8 text-center">
            <i className="fas fa-share-alt text-gray-300 text-4xl mb-4"></i>
            <p className="text-gray-500">No se encontraron referidos</p>
          </div>
        )}
      </div>
    </div>
  );
}