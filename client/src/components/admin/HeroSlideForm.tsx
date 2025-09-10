import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHeroSlideSchema, type InsertHeroSlide, type HeroSlide } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "@/components/FileUploader";

interface HeroSlideFormProps {
  slide?: HeroSlide;
  onSuccess: () => void;
  onCancel: () => void;
}

export function HeroSlideForm({ slide, onSuccess, onCancel }: HeroSlideFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertHeroSlide>({
    resolver: zodResolver(insertHeroSlideSchema),
    defaultValues: {
      imageUrl: slide?.imageUrl || "",
      title: slide?.title || "",
      subtitle: slide?.subtitle || "",
      order: slide?.order || 0,
      active: slide?.active ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertHeroSlide) => {
      const response = await apiRequest("POST", "/api/admin/hero-slides", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hero Slide creado",
        description: "El slide se ha creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el slide",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertHeroSlide) => {
      const response = await apiRequest("PUT", `/api/admin/hero-slides/${slide!.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hero Slide actualizado",
        description: "El slide se ha actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el slide",
        variant: "destructive",
      });
    },
  });

  // Función para manejar subida de archivos
  const handleUploadComplete = (imageUrl: string) => {
    form.setValue("imageUrl", imageUrl);
  };

  const onSubmit = (data: InsertHeroSlide) => {
    if (slide) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {slide ? "Editar Hero Slide" : "Crear Nuevo Hero Slide"}
        </h2>
        <p className="text-gray-600">
          {slide ? "Modifica los detalles del slide" : "Completa la información del nuevo slide"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagen del Slide</FormLabel>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <FormControl>
                        <Input {...field} placeholder="URL de la imagen o sube una nueva" data-testid="input-hero-image-url" />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        Puedes pegar una URL o subir una imagen desde tu dispositivo
                      </p>
                    </div>
                    <div className="flex items-start">
                      <FileUploader
                        onUploadComplete={handleUploadComplete}
                        maxFileSize={5242880} // 5MB
                        accept="image/*"
                        fileType="image"
                        buttonClassName="w-full lg:w-auto"
                      >
                        <div className="flex items-center gap-2">
                          <i className="fas fa-upload"></i>
                          <span>Subir Imagen</span>
                        </div>
                      </FileUploader>
                    </div>
                  </div>
                  {field.value && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                      <img 
                        src={field.value} 
                        alt="Preview" 
                        className="w-full max-w-md h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Título del slide" data-testid="input-hero-title" />
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
                  <FormLabel>Orden de Aparición</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      placeholder="0"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      value={field.value || 0}
                      data-testid="input-hero-order"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subtitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtítulo</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Descripción o subtítulo del slide..."
                    rows={3}
                    data-testid="textarea-hero-subtitle"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-hero-active"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Activo</FormLabel>
                  <p className="text-sm text-gray-500">
                    Solo los slides activos aparecerán en el carrusel principal
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="flex gap-4 pt-6">
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-hero-slide"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  {slide ? "Actualizar" : "Crear"} Slide
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-hero-slide">
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}