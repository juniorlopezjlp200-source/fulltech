import { useQuery } from "@tanstack/react-query";
import { type RaffleParticipant } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AdminRaffle() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["/api/admin/raffle-participants"],
    retry: false,
  });

  const filteredParticipants = participants.filter((participant: RaffleParticipant) => {
    const searchLower = searchTerm.toLowerCase();
    return participant.name.toLowerCase().includes(searchLower) ||
           participant.phone.toLowerCase().includes(searchLower) ||
           participant.address.toLowerCase().includes(searchLower) ||
           (participant.email?.toLowerCase().includes(searchLower));
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
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Participantes de Rifa</h2>
          <p className="text-gray-600">Administra todos los participantes registrados en la rifa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-export-participants">
            <i className="fas fa-download mr-2"></i>
            Exportar CSV
          </Button>
          <Button data-testid="button-select-winner">
            <i className="fas fa-trophy mr-2"></i>
            Seleccionar Ganador
          </Button>
        </div>
      </div>

      {/* Search and Statistics */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar participantes</label>
            <Input
              placeholder="Buscar por nombre, teléfono, dirección o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-participants"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{participants.length}</div>
              <div className="text-sm text-blue-700">Total Participantes</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {participants.filter((p: RaffleParticipant) => p.email).length}
              </div>
              <div className="text-sm text-green-700">Con Email</div>
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 lg:p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Participantes ({filteredParticipants.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando participantes...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-gift text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600 mb-2">No se encontraron participantes</p>
            {searchTerm ? (
              <p className="text-sm text-gray-500">Prueba ajustando el término de búsqueda</p>
            ) : (
              <p className="text-sm text-gray-500">Los participantes aparecerán aquí cuando se registren</p>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParticipants.map((participant: RaffleParticipant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <i className="fas fa-user text-blue-600"></i>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                            <div className="text-sm text-gray-500">ID: {participant.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{participant.phone}</div>
                          {participant.email && (
                            <div className="text-gray-500">{participant.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={participant.address}>
                          {participant.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(participant.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant="default" className="bg-green-100 text-green-800 w-fit">
                            Registrado
                          </Badge>
                          {participant.email && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 w-fit">
                              Con Email
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredParticipants.map((participant: RaffleParticipant) => (
                <div key={participant.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-user text-blue-600"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {participant.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">{participant.phone}</p>
                          {participant.email && (
                            <p className="text-xs text-gray-500">{participant.email}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          {formatDate(participant.createdAt)}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 truncate" title={participant.address}>
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {participant.address}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Registrado
                        </Badge>
                        {participant.email && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            Email
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          {participants
            .sort((a: RaffleParticipant, b: RaffleParticipant) => 
              new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
            )
            .slice(0, 5)
            .map((participant: RaffleParticipant) => (
              <div key={participant.id} className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  <strong>{participant.name}</strong> se registró en la rifa
                </span>
                <span className="text-gray-400 ml-auto">
                  {formatDate(participant.createdAt)}
                </span>
              </div>
            ))}
          {participants.length === 0 && (
            <div className="text-gray-500 text-sm text-center py-4">
              No hay actividad reciente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}