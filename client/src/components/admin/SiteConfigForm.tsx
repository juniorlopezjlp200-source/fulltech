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
import { ObjectUploader } from "@/components/ObjectUploader";

interface SiteConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  updatedAt: Date;
}

export function SiteConfigForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("general");

  // Fetch site configurations
  const { data: configs = [] } = useQuery<SiteConfig[]>({
    queryKey: ["/api/site-configs"],
  });

  // Filter configs by category
  const filteredConfigs = configs.filter(config => config.category === selectedCategory);

  // Create/Update configuration
  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value, description, category }: {
      key: string;
      value: string;
      description?: string;
      category: string;
    }) => {
      // Check if config exists
      const existingConfig = configs.find(c => c.key === key);
      
      if (existingConfig) {
        const response = await apiRequest("PUT", `/api/admin/site-configs/${key}`, { value, description, category });
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/admin/site-configs", { key, value, description, category });
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-configs"] });
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    },
  });

  const handleConfigUpdate = (key: string, value: string, description?: string) => {
    updateConfigMutation.mutate({
      key,
      value,
      description,
      category: selectedCategory,
    });
  };

  // Función específica para subir logo
  const handleLogoUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/upload-url");
      const data = await response.json() as { uploadURL: string };
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo obtener la URL de subida",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleLogoUploadComplete = async (result: any) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const logoPath = uploadedFile.uploadURL;
        
        // Actualizar la configuración del logo
        await handleConfigUpdate("logo_url", logoPath, "URL de la imagen del logo principal");
        
        toast({
          title: "Logo actualizado",
          description: "El logo se ha subido y actualizado correctamente.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el logo",
        variant: "destructive",
      });
    }
  };

  // Funciones para subir imágenes del hero/slider
  const handleHeroImageUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/upload-url");
      const data = await response.json() as { uploadURL: string };
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo obtener la URL de subida",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleHeroImageUploadComplete = (imageKey: string, description: string) => async (result: any) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const imagePath = uploadedFile.uploadURL;
        
        // Actualizar la configuración de la imagen del hero
        await handleConfigUpdate(imageKey, imagePath, description);
        
        toast({
          title: "Imagen actualizada",
          description: "La imagen del hero se ha subido y actualizado correctamente.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la imagen del hero",
        variant: "destructive",
      });
    }
  };

  const getConfigValue = (key: string) => {
    return configs.find(c => c.key === key)?.value || "";
  };

  const categories = [
    { value: "general", label: "General" },
    { value: "branding", label: "Marca y Logo" },
    { value: "header", label: "Header" },
    { value: "hero", label: "Hero/Slider" },
    { value: "raffle", label: "Rifa" },
    { value: "footer", label: "Footer" },
    { value: "contact", label: "Contacto" },
    { value: "social", label: "Redes Sociales" },
    { value: "seo", label: "SEO" },
  ];

  const configFields = {
    general: [
      { key: "site_name", label: "Nombre del Sitio", description: "Nombre principal de la empresa", type: "text" },
      { key: "site_description", label: "Descripción del Sitio", description: "Descripción breve de la empresa", type: "textarea" },
      { key: "site_keywords", label: "Palabras Clave", description: "Palabras clave para SEO (separadas por comas)", type: "textarea" },
    ],
    branding: [
      { key: "logo_url", label: "URL del Logo", description: "URL de la imagen del logo principal", type: "text" },
      { key: "logo_alt", label: "Texto Alternativo del Logo", description: "Descripción del logo para accesibilidad", type: "text" },
      { key: "favicon_url", label: "URL del Favicon", description: "URL del icono del sitio", type: "text" },
      { key: "brand_color", label: "Color Principal", description: "Color principal de la marca (#hex)", type: "color" },
    ],
    header: [
      { key: "header_show_search", label: "Mostrar Buscador", description: "Mostrar buscador en header", type: "select", options: [{value: "true", label: "Sí"}, {value: "false", label: "No"}] },
      { key: "header_show_menu", label: "Mostrar Menú", description: "Mostrar menú en header", type: "select", options: [{value: "true", label: "Sí"}, {value: "false", label: "No"}] },
    ],
    hero: [
      { key: "hero_url1", label: "Imagen Hero 1", description: "URL de la primera imagen del hero/slider", type: "text" },
      { key: "hero_url2", label: "Imagen Hero 2", description: "URL de la segunda imagen del hero/slider", type: "text" },
      { key: "hero_url3", label: "Imagen Hero 3", description: "URL de la tercera imagen del hero/slider", type: "text" },
      { key: "hero_title", label: "Título Hero", description: "Título principal del hero/slider", type: "text" },
      { key: "hero_subtitle", label: "Subtítulo Hero", description: "Subtítulo del hero/slider", type: "text" },
    ],
    raffle: [
      { key: "raffle_img", label: "Imagen de la Rifa", description: "Imagen de la rifa mensual", type: "text" },
      { key: "raffle_title", label: "Título de la Rifa", description: "Título de la rifa mensual", type: "text" },
      { key: "raffle_desc", label: "Descripción de la Rifa", description: "Descripción de la rifa mensual", type: "textarea" },
    ],
    footer: [
      { key: "footer_company_description", label: "Descripción de la Empresa", description: "Texto descriptivo en el footer", type: "textarea" },
      { key: "footer_copyright", label: "Texto de Copyright", description: "Texto de derechos de autor", type: "text" },
      { key: "footer_address", label: "Dirección", description: "Dirección física de la empresa", type: "textarea" },
    ],
    contact: [
      { key: "contact_phone", label: "Teléfono", description: "Número de teléfono principal", type: "text" },
      { key: "contact_email", label: "Email", description: "Email de contacto principal", type: "email" },
      { key: "contact_whatsapp", label: "WhatsApp", description: "Número de WhatsApp", type: "text" },
      { key: "contact_hours", label: "Horario de Atención", description: "Horario de atención al cliente", type: "text" },
    ],
    social: [
      { key: "social_facebook", label: "Facebook", description: "URL de Facebook", type: "url" },
      { key: "social_instagram", label: "Instagram", description: "URL de Instagram", type: "url" },
      { key: "social_tiktok", label: "TikTok", description: "URL de TikTok", type: "url" },
      { key: "social_youtube", label: "YouTube", description: "URL de YouTube", type: "url" },
    ],
    seo: [
      { key: "seo_title", label: "Título SEO", description: "Título principal para motores de búsqueda", type: "text" },
      { key: "seo_description", label: "Meta Descripción", description: "Descripción meta para SEO", type: "textarea" },
      { key: "google_analytics", label: "Google Analytics ID", description: "ID de Google Analytics", type: "text" },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración del Sitio</h2>
          <p className="text-gray-600">Edita todos los aspectos configurables del catálogo</p>
        </div>
      </div>

      {/* Category selector */}
      <Card>
        <CardHeader>
          <CardTitle>Categoría de Configuración</CardTitle>
          <CardDescription>Selecciona qué aspecto del sitio quieres configurar</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Configuration fields */}
      <Card>
        <CardHeader>
          <CardTitle>{categories.find(c => c.value === selectedCategory)?.label}</CardTitle>
          <CardDescription>
            Configura los elementos de {categories.find(c => c.value === selectedCategory)?.label.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {configFields[selectedCategory as keyof typeof configFields]?.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.description && (
                <p className="text-sm text-gray-500">{field.description}</p>
              )}
              
              {/* Campo especial para subir logo */}
              {field.key === "logo_url" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">Subir Nueva Imagen de Logo</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Selecciona una imagen desde tu dispositivo para actualizar el logo automáticamente
                      </p>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={handleLogoUpload}
                        onComplete={handleLogoUploadComplete}
                        buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <i className="fas fa-cloud-upload-alt mr-2"></i>
                        Subir Logo
                      </ObjectUploader>
                    </div>
                    {getConfigValue(field.key) && (
                      <div className="flex-shrink-0">
                        <img 
                          src={getConfigValue(field.key)} 
                          alt="Logo actual" 
                          className="w-16 h-16 object-contain border border-gray-200 rounded-lg bg-white"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor={field.key + "_manual"}>O ingresa URL manualmente:</Label>
                    <Input
                      id={field.key + "_manual"}
                      type="text"
                      defaultValue={getConfigValue(field.key)}
                      placeholder="https://ejemplo.com/logo.png"
                      onBlur={(e) => {
                        if (e.target.value !== getConfigValue(field.key)) {
                          handleConfigUpdate(field.key, e.target.value, field.description);
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (field.key === "hero_image_1" || field.key === "hero_image_2" || field.key === "hero_image_3") ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">Subir {field.label}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Selecciona una imagen desde tu dispositivo para actualizar esta imagen del slider automáticamente
                      </p>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={handleHeroImageUpload}
                        onComplete={handleHeroImageUploadComplete(field.key, field.description || "")}
                        buttonClassName="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <i className="fas fa-image mr-2"></i>
                        Subir Imagen
                      </ObjectUploader>
                    </div>
                    {getConfigValue(field.key) && (
                      <div className="flex-shrink-0">
                        <img 
                          src={getConfigValue(field.key)} 
                          alt={field.label} 
                          className="w-16 h-16 object-cover border border-gray-200 rounded-lg bg-white"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor={field.key + "_manual"}>O ingresa URL manualmente:</Label>
                    <Input
                      id={field.key + "_manual"}
                      type="text"
                      defaultValue={getConfigValue(field.key)}
                      placeholder="https://ejemplo.com/imagen-slider.jpg"
                      onBlur={(e) => {
                        if (e.target.value !== getConfigValue(field.key)) {
                          handleConfigUpdate(field.key, e.target.value, field.description);
                        }
                      }}
                    />
                  </div>
                </div>
              ) : field.type === "textarea" ? (
                <Textarea
                  id={field.key}
                  defaultValue={getConfigValue(field.key)}
                  placeholder={field.description}
                  onBlur={(e) => {
                    if (e.target.value !== getConfigValue(field.key)) {
                      handleConfigUpdate(field.key, e.target.value, field.description);
                    }
                  }}
                />
              ) : (
                <Input
                  id={field.key}
                  type={field.type}
                  defaultValue={getConfigValue(field.key)}
                  placeholder={field.description}
                  onBlur={(e) => {
                    if (e.target.value !== getConfigValue(field.key)) {
                      handleConfigUpdate(field.key, e.target.value, field.description);
                    }
                  }}
                />
              )}
            </div>
          ))}

          {filteredConfigs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-cog text-4xl mb-4"></i>
              <p>No hay configuraciones en esta categoría aún.</p>
              <p className="text-sm">Completa los campos de arriba para agregar configuraciones.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
          <CardDescription>Así se verán los cambios en el sitio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-6">
            {selectedCategory === "branding" && (
              <div className="flex items-center gap-4">
                {getConfigValue("logo_url") && (
                  <img 
                    src={getConfigValue("logo_url")} 
                    alt={getConfigValue("logo_alt") || "Logo"} 
                    className="w-12 h-12 object-contain"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg" style={{ color: getConfigValue("brand_color") || "#000" }}>
                    {getConfigValue("site_name") || "FULLTECH"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getConfigValue("site_description") || "Tu destino tecnológico de confianza"}
                  </p>
                </div>
              </div>
            )}

            {selectedCategory === "contact" && (
              <div className="space-y-2">
                {getConfigValue("contact_phone") && (
                  <p className="flex items-center gap-2">
                    <i className="fas fa-phone text-blue-600"></i>
                    {getConfigValue("contact_phone")}
                  </p>
                )}
                {getConfigValue("contact_email") && (
                  <p className="flex items-center gap-2">
                    <i className="fas fa-envelope text-blue-600"></i>
                    {getConfigValue("contact_email")}
                  </p>
                )}
                {getConfigValue("contact_whatsapp") && (
                  <p className="flex items-center gap-2">
                    <i className="fab fa-whatsapp text-green-600"></i>
                    {getConfigValue("contact_whatsapp")}
                  </p>
                )}
              </div>
            )}

            {selectedCategory === "footer" && (
              <div className="text-sm">
                <p className="mb-2">{getConfigValue("footer_company_description") || "Descripción de la empresa..."}</p>
                <p className="text-gray-500">
                  {getConfigValue("footer_copyright") || `© ${new Date().getFullYear()} FULLTECH. Todos los derechos reservados.`}
                </p>
                {getConfigValue("footer_address") && (
                  <p className="mt-2 text-gray-600">{getConfigValue("footer_address")}</p>
                )}
              </div>
            )}

            {selectedCategory === "social" && (
              <div className="flex gap-3">
                {getConfigValue("social_facebook") && (
                  <a href={getConfigValue("social_facebook")} className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                    <i className="fab fa-facebook-f text-xs"></i>
                  </a>
                )}
                {getConfigValue("social_instagram") && (
                  <a href={getConfigValue("social_instagram")} className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center">
                    <i className="fab fa-instagram text-xs"></i>
                  </a>
                )}
                {getConfigValue("social_twitter") && (
                  <a href={getConfigValue("social_twitter")} className="w-8 h-8 bg-sky-500 text-white rounded-full flex items-center justify-center">
                    <i className="fab fa-twitter text-xs"></i>
                  </a>
                )}
                {getConfigValue("social_youtube") && (
                  <a href={getConfigValue("social_youtube")} className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center">
                    <i className="fab fa-youtube text-xs"></i>
                  </a>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}