import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type InsertProduct, type Product, type Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "@/components/FileUploader";
import { useAdmin } from "@/hooks/useAdmin";

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { admin, isAuthenticated } = useAdmin();
  // Fetch categories from API
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || [""]);
  const [videoUrls, setVideoUrls] = useState<string[]>(product?.videos || [""]);

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || 0,
      category: product?.category || "",
      images: product?.images || [],
      videos: product?.videos || [],
      inStock: product?.inStock ?? true,
      featured: product?.featured ?? false,
      onSale: product?.onSale ?? false,
      rating: product?.rating || 5,
      reviewCount: product?.reviewCount || 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await apiRequest("POST", "/api/admin/products", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Producto creado",
        description: "El producto se ha creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await apiRequest("PUT", `/api/admin/products/${product!.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Producto actualizado",
        description: "El producto se ha actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    // Filter out empty URLs
    const filteredImages = imageUrls.filter(url => url.trim() !== "");
    const filteredVideos = videoUrls.filter(url => url.trim() !== "");
    
    const formData = {
      ...data,
      images: filteredImages,
      videos: filteredVideos,
    };

    if (product) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const updateImageUrl = (index: number, url: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = url;
    setImageUrls(newUrls);
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const addVideoUrl = () => {
    setVideoUrls([...videoUrls, ""]);
  };

  const updateVideoUrl = (index: number, url: string) => {
    const newUrls = [...videoUrls];
    newUrls[index] = url;
    setVideoUrls(newUrls);
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  // Funciones para manejar subida de archivos
  const handleImageUploadComplete = (imageUrl: string) => {
    const newUrls = [...imageUrls];
    // Reemplazar la primera URL vacía o agregar al final
    const emptyIndex = newUrls.findIndex(url => url === "");
    if (emptyIndex >= 0) {
      newUrls[emptyIndex] = imageUrl;
    } else {
      newUrls.push(imageUrl);
    }
    setImageUrls(newUrls);
  };

  const handleVideoUploadComplete = (videoUrl: string) => {
    const newUrls = [...videoUrls];
    // Reemplazar la primera URL vacía o agregar al final
    const emptyIndex = newUrls.findIndex(url => url === "");
    if (emptyIndex >= 0) {
      newUrls[emptyIndex] = videoUrl;
    } else {
      newUrls.push(videoUrl);
    }
    setVideoUrls(newUrls);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-2"
          data-testid="button-back-product-form"
        >
          <i className="fas fa-arrow-left"></i>
          Volver
        </Button>
        <h2 className="text-xl font-semibold text-gray-900 flex-1">
          {product ? "Editar Producto" : "Crear Nuevo Producto"}
        </h2>
        <p className="text-gray-600">
          {product ? "Modifica los detalles del producto" : "Completa la información del nuevo producto"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: iPhone 15 Pro Max" data-testid="input-product-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-product-category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isCategoriesLoading ? (
                        <div className="p-2 text-sm text-gray-500">Cargando categorías...</div>
                      ) : categories.length > 0 ? (
                        categories
                          .filter(category => category.active && category.slug && category.slug.trim() !== '')
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((category) => (
                            <SelectItem key={category.id} value={category.slug}>
                              {category.name}
                            </SelectItem>
                          ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">No hay categorías disponibles</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Describe las características y beneficios del producto..."
                    rows={4}
                    data-testid="textarea-product-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio (RD$)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      placeholder="25"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-product-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (1-5)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      min="1"
                      max="5"
                      placeholder="5"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                      value={field.value || 5}
                      data-testid="input-product-rating"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Image URLs */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <FormLabel>Imágenes del Producto</FormLabel>
              <div className="flex gap-2">
                <FileUploader
                  onUploadComplete={handleImageUploadComplete}
                  maxFileSize={5242880} // 5MB
                  accept="image/*"
                  fileType="image"
                  buttonClassName=""
                  disabled={!isAuthenticated}
                >
                  <div className="flex items-center gap-2">
                    <i className="fas fa-upload"></i>
                    <span>{isAuthenticated ? "Subir Imagen" : "Autentícate como admin"}</span>
                  </div>
                </FileUploader>
                <Button type="button" variant="outline" size="sm" onClick={addImageUrl} data-testid="button-add-image">
                  <i className="fas fa-plus mr-2"></i>
                  Agregar URL
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Puedes subir imágenes desde tu dispositivo o agregar URLs manualmente. Las imágenes se mostrarán en el orden que aparecen aquí.
            </p>
            {imageUrls.map((url, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg o sube desde dispositivo"
                    className="flex-1"
                    data-testid={`input-image-${index}`}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeImageUrl(index)}
                    disabled={imageUrls.length === 1}
                    data-testid={`button-remove-image-${index}`}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
                {url && (
                  <img 
                    src={url} 
                    alt={`Preview ${index + 1}`} 
                    className="w-24 h-24 object-cover rounded-lg border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Video URLs */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <FormLabel>Videos del Producto (opcional)</FormLabel>
              <div className="flex gap-2">
                <FileUploader
                  onUploadComplete={handleVideoUploadComplete}
                  maxFileSize={52428800} // 50MB para videos
                  accept="video/*"
                  fileType="video"
                  buttonClassName=""
                  disabled={!isAuthenticated}
                >
                  <div className="flex items-center gap-2">
                    <i className="fas fa-video"></i>
                    <span>{isAuthenticated ? "Subir Video" : "Autentícate como admin"}</span>
                  </div>
                </FileUploader>
                <Button type="button" variant="outline" size="sm" onClick={addVideoUrl} data-testid="button-add-video">
                  <i className="fas fa-plus mr-2"></i>
                  Agregar URL
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Puedes subir videos desde tu dispositivo (máximo 50MB) o agregar URLs de videos. Formatos soportados: MP4, AVI, MOV, etc.
            </p>
            {videoUrls.map((url, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateVideoUrl(index, e.target.value)}
                    placeholder="https://ejemplo.com/video.mp4 o sube desde dispositivo"
                    className="flex-1"
                    data-testid={`input-video-${index}`}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeVideoUrl(index)}
                    disabled={videoUrls.length === 1}
                    data-testid={`button-remove-video-${index}`}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
                {url && (
                  <div className="relative">
                    <video 
                      src={url} 
                      className="w-32 h-24 object-cover rounded-lg border"
                      controls
                      preload="metadata"
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement;
                        target.style.display = 'none';
                      }}
                    >
                      <span className="text-xs text-gray-500">Vista previa del video no disponible</span>
                    </video>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <i className="fas fa-play text-white text-lg drop-shadow-lg"></i>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="inStock"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-in-stock"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>En Stock</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-featured"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Destacado</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="onSale"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-on-sale"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>En Oferta</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-product"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  {product ? "Actualizar" : "Crear"} Producto
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-product">
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}