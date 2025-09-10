import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Edit, Plus, Eye, EyeOff } from "lucide-react";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  showInMenu: boolean;
  menuSection: string;
  order: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function CustomPagesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    showInMenu: false,
    menuSection: "main",
    order: 0,
    status: "draft"
  });

  // Fetch custom pages
  const { data: pages = [] } = useQuery<CustomPage[]>({
    queryKey: ["/api/admin/custom-pages"],
  });

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (pageData: any) => {
      const response = await apiRequest("POST", "/api/admin/custom-pages", pageData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-pages"] });
      toast({
        title: "Página creada",
        description: "La página se ha creado correctamente.",
      });
      setIsCreating(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la página.",
        variant: "destructive",
      });
    },
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/custom-pages/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-pages"] });
      toast({
        title: "Página actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
      setEditingPage(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la página.",
        variant: "destructive",
      });
    },
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/custom-pages/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-pages"] });
      toast({
        title: "Página eliminada",
        description: "La página se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la página.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      showInMenu: false,
      menuSection: "main",
      order: 0,
      status: "draft"
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug || !formData.content) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    if (editingPage) {
      updatePageMutation.mutate({
        id: editingPage.id,
        data: formData,
      });
    } else {
      createPageMutation.mutate(formData);
    }
  };

  const handleEdit = (page: CustomPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      showInMenu: page.showInMenu,
      menuSection: page.menuSection,
      order: page.order,
      status: page.status
    });
    setIsCreating(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta página?")) {
      deletePageMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPage(null);
    resetForm();
  };

  if (isCreating || editingPage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {editingPage ? "Editar Página" : "Nueva Página"}
          </CardTitle>
          <CardDescription>
            {editingPage ? "Modifica los datos de la página" : "Crea una nueva página personalizada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Título de la página"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-amigable"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="content">Contenido *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Contenido de la página (HTML permitido)"
                rows={10}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="menuSection">Sección del Menú</Label>
                <Select
                  value={formData.menuSection}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, menuSection: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Principal</SelectItem>
                    <SelectItem value="support">Soporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="order">Orden</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showInMenu"
                checked={formData.showInMenu}
                onChange={(e) => setFormData(prev => ({ ...prev, showInMenu: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="showInMenu">Mostrar en menú</Label>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createPageMutation.isPending || updatePageMutation.isPending}
              >
                {editingPage ? "Actualizar" : "Crear"} Página
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Páginas Personalizadas</h2>
          <p className="text-muted-foreground">Gestiona las páginas de tu sitio web</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Página
        </Button>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{page.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      page.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {page.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                    {page.showInMenu && (
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        En menú
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Slug: {page.slug} | Sección: {page.menuSection} | Orden: {page.order}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    {page.content.length > 100 
                      ? `${page.content.substring(0, 100)}...` 
                      : page.content
                    }
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id)}
                    disabled={deletePageMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {pages.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No hay páginas creadas aún.</p>
              <Button 
                onClick={() => setIsCreating(true)}
                className="mt-4"
              >
                Crear primera página
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}