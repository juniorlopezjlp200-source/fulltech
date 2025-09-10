import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function LegalPagesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch all legal pages
  const { data: pages = [] } = useQuery<LegalPage[]>({
    queryKey: ["/api/legal-pages", { all: true }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/legal-pages?all=true");
      return await response.json();
    },
  });

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (pageData: {
      slug: string;
      title: string;
      content: string;
      isActive: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/admin/legal-pages", pageData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-pages"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Página creada",
        description: "La página legal se ha creado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la página.",
        variant: "destructive",
      });
    },
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, ...pageData }: {
      id: string;
      slug?: string;
      title?: string;
      content?: string;
      isActive?: boolean;
    }) => {
      const response = await apiRequest("PUT", `/api/admin/legal-pages/${id}`, pageData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-pages"] });
      toast({
        title: "Página actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la página.",
        variant: "destructive",
      });
    },
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/legal-pages/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-pages"] });
      setSelectedPage(null);
      toast({
        title: "Página eliminada",
        description: "La página se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la página.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createPageMutation.mutate({
      slug: formData.get("slug") as string,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      isActive: formData.get("isActive") === "on",
    });
  };

  const handleUpdatePage = () => {
    if (!selectedPage) return;
    
    updatePageMutation.mutate({
      id: selectedPage.id,
      slug: selectedPage.slug,
      title: selectedPage.title,
      content: selectedPage.content,
      isActive: selectedPage.isActive,
    });
  };

  const handleToggleActive = (page: LegalPage) => {
    updatePageMutation.mutate({
      id: page.id,
      isActive: !page.isActive,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Páginas Legales</h2>
          <p className="text-gray-600">Gestiona el contenido de todas las páginas legales</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <i className="fas fa-plus mr-2"></i>
              Nueva Página
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Página Legal</DialogTitle>
              <DialogDescription>
                Agrega una nueva página legal al sitio web.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="politica-de-cookies"
                  required
                />
                <p className="text-sm text-gray-500">
                  URL amigable para la página (sin espacios, usar guiones)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Política de Cookies"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Contenido de la página..."
                  rows={8}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" name="isActive" defaultChecked />
                <Label htmlFor="isActive">Página activa</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createPageMutation.isPending}>
                  {createPageMutation.isPending ? "Creando..." : "Crear Página"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pages list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Páginas Disponibles</CardTitle>
            <CardDescription>Selecciona una página para editar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pages.map((page) => (
              <div
                key={page.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPage?.id === page.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedPage(page)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{page.title}</h3>
                    <p className="text-sm text-gray-500">/{page.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={page.isActive}
                      onCheckedChange={() => handleToggleActive(page)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {page.isActive ? (
                      <i className="fas fa-eye text-green-600 text-sm"></i>
                    ) : (
                      <i className="fas fa-eye-slash text-gray-400 text-sm"></i>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {pages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-file-alt text-4xl mb-4"></i>
                <p>No hay páginas legales aún.</p>
                <p className="text-sm">Crea la primera página.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Page editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedPage ? `Editar: ${selectedPage.title}` : "Editor de Páginas"}
            </CardTitle>
            <CardDescription>
              {selectedPage 
                ? "Modifica el contenido de la página seleccionada"
                : "Selecciona una página de la lista para editarla"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPage ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">Slug (URL)</Label>
                  <Input
                    id="edit-slug"
                    value={selectedPage.slug}
                    onChange={(e) => setSelectedPage({
                      ...selectedPage,
                      slug: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Título</Label>
                  <Input
                    id="edit-title"
                    value={selectedPage.title}
                    onChange={(e) => setSelectedPage({
                      ...selectedPage,
                      title: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-content">Contenido</Label>
                  <Textarea
                    id="edit-content"
                    value={selectedPage.content}
                    onChange={(e) => setSelectedPage({
                      ...selectedPage,
                      content: e.target.value
                    })}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Puedes usar HTML básico para formatear el contenido.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedPage.isActive}
                    onCheckedChange={(checked) => setSelectedPage({
                      ...selectedPage,
                      isActive: checked
                    })}
                  />
                  <Label>Página activa</Label>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="destructive"
                    onClick={() => deletePageMutation.mutate(selectedPage.id)}
                    disabled={deletePageMutation.isPending}
                  >
                    <i className="fas fa-trash mr-2"></i>
                    {deletePageMutation.isPending ? "Eliminando..." : "Eliminar"}
                  </Button>
                  <Button
                    onClick={handleUpdatePage}
                    disabled={updatePageMutation.isPending}
                  >
                    <i className="fas fa-save mr-2"></i>
                    {updatePageMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <i className="fas fa-edit text-6xl mb-4"></i>
                <p className="text-lg">Selecciona una página para editar</p>
                <p className="text-sm">O crea una nueva página usando el botón de arriba</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}