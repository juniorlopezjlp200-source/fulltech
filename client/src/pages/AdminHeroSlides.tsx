import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type HeroSlide } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroSlideForm } from "@/components/admin/HeroSlideForm";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminHeroSlides() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["/api/admin/hero-slides"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (slideId: string) => {
      return await apiRequest(`/api/admin/hero-slides/${slideId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Hero Slide eliminado",
        description: "El slide se ha eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el slide",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingSlide(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSlide(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSlide(null);
  };

  if (showForm) {
    return (
      <HeroSlideForm
        slide={editingSlide || undefined}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Gestión de Hero Slides</h2>
          <p className="text-gray-600">Administra las imágenes del carrusel principal</p>
        </div>
        <Button onClick={handleCreate} className="lg:w-auto" data-testid="button-create-hero-slide">
          <i className="fas fa-plus mr-2"></i>
          Crear Hero Slide
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{slides.length}</div>
          <div className="text-sm text-gray-600">Total slides</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {slides.filter((s: HeroSlide) => s.active).length}
          </div>
          <div className="text-sm text-gray-600">Activos</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-600">
            {slides.filter((s: HeroSlide) => !s.active).length}
          </div>
          <div className="text-sm text-gray-600">Inactivos</div>
        </div>
      </div>

      {/* Slides List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 lg:p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Hero Slides ({slides.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando slides...</p>
          </div>
        ) : slides.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-images text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600 mb-2">No hay slides configurados</p>
            <p className="text-sm text-gray-500">Comienza creando tu primer hero slide</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vista Previa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contenido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {slides
                    .sort((a: HeroSlide, b: HeroSlide) => a.order - b.order)
                    .map((slide: HeroSlide) => (
                    <tr key={slide.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <img 
                          src={slide.imageUrl} 
                          alt={slide.title}
                          className="h-16 w-24 rounded-lg object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{slide.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {slide.subtitle}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <Badge variant="outline">{slide.order}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={slide.active ? "default" : "secondary"}
                          className={slide.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {slide.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(slide)}
                            data-testid={`button-edit-slide-${slide.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(slide.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-slide-${slide.id}`}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {slides
                .sort((a: HeroSlide, b: HeroSlide) => a.order - b.order)
                .map((slide: HeroSlide) => (
                <div key={slide.id} className="p-4">
                  <div className="flex gap-4">
                    <img 
                      src={slide.imageUrl} 
                      alt={slide.title}
                      className="h-16 w-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {slide.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 truncate">{slide.subtitle}</p>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(slide)}
                            data-testid={`button-edit-slide-mobile-${slide.id}`}
                          >
                            <i className="fas fa-edit text-xs"></i>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(slide.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600"
                            data-testid={`button-delete-slide-mobile-${slide.id}`}
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">Orden: {slide.order}</Badge>
                        <Badge 
                          variant={slide.active ? "default" : "secondary"}
                          className={slide.active ? "text-xs bg-green-100 text-green-800" : "text-xs bg-gray-100 text-gray-800"}
                        >
                          {slide.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}