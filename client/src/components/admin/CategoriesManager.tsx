import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema, type Category, type InsertCategory } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CategoriesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      icon: "",
      order: 0,
      active: true,
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: InsertCategory) => {
      const response = await apiRequest("POST", "/api/admin/categories", categoryData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado correctamente.",
      });
      setIsCreating(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la categoría.",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCategory> }) => {
      const response = await apiRequest("PUT", `/api/admin/categories/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
      setEditingCategory(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la categoría.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/categories/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      toast({
        title: "Categoría eliminada",
        description: "La categoría se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la categoría.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = (data: InsertCategory) => {
    createCategoryMutation.mutate(data);
  };

  const handleUpdateCategory = (data: InsertCategory) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCreating(false);
    form.reset({
      name: category.name,
      slug: category.slug,
      icon: category.icon || "",
      order: category.order || 0,
      active: category.active,
    });
  };

  const handleCreateNew = () => {
    setEditingCategory(null);
    setIsCreating(true);
    form.reset({
      name: "",
      slug: "",
      icon: "",
      order: 0,
      active: true,
    });
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setIsCreating(false);
    form.reset();
  };

  const handleDeleteCategory = (category: Category) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar la categoría "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Gestión de Categorías</h2>
          <p className="text-gray-600">Administra las categorías de productos</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-blue-500 hover:bg-blue-600 text-white"
          data-testid="button-create-category"
        >
          <i className="fas fa-plus mr-2"></i>
          Nueva Categoría
        </Button>
      </div>

      {(isCreating || editingCategory) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCategory ? "Editar Categoría" : "Crear Nueva Categoría"}
          </h3>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingCategory ? handleUpdateCategory : handleCreateCategory)} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Móviles y Smartphones" data-testid="input-category-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: moviles" data-testid="input-category-slug" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono (FontAwesome)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Ej: fas fa-mobile-alt" data-testid="input-category-icon" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orden</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="0" 
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-category-order" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-category-active"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Categoría activa</FormLabel>
                      <p className="text-sm text-gray-600">
                        Las categorías inactivas no se mostrarán en el catálogo
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  data-testid="button-save-category"
                >
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  )}
                  {editingCategory ? "Actualizar" : "Crear"} Categoría
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  data-testid="button-cancel-category"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Categorías Existentes</h3>
          <p className="text-gray-600">Total: {categories.length} categorías</p>
        </div>
        
        <div className="divide-y">
          {categories.map((category) => (
            <div key={category.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {category.icon ? (
                      <i className={`${category.icon} text-gray-600`}></i>
                    ) : (
                      <i className="fas fa-tag text-gray-600"></i>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    <p className="text-sm text-gray-600">Slug: {category.slug}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">Orden: {category.order}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        category.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    data-testid={`button-edit-category-${category.id}`}
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-delete-category-${category.id}`}
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {categories.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <i className="fas fa-tags text-4xl mb-4"></i>
              <p>No hay categorías creadas</p>
              <p className="text-sm">Crea tu primera categoría para organizar los productos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}