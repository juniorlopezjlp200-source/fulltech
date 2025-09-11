import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "@/components/admin/ProductForm";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/utils/currency";

export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/admin/products"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest(`/api/admin/products/${productId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    },
  });

  const categories = ["all", ...new Set(products.map((p: Product) => p.category))];

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };


  if (showForm) {
    return (
      <ProductForm
        product={editingProduct || undefined}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Gestión de Productos</h2>
          <p className="text-gray-600">Administra todos los productos del catálogo</p>
        </div>
        <Button onClick={handleCreate} className="lg:w-auto" data-testid="button-create-product">
          <i className="fas fa-plus mr-2"></i>
          Crear Producto
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar productos</label>
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-products"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="select-filter-category"
            >
              <option value="all">Todas las categorías</option>
              {categories.filter(cat => cat !== "all").map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{products.length}</div>
          <div className="text-sm text-gray-600">Total productos</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {products.filter((p: Product) => p.inStock).length}
          </div>
          <div className="text-sm text-gray-600">En stock</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            {products.filter((p: Product) => p.featured).length}
          </div>
          <div className="text-sm text-gray-600">Destacados</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-orange-600">
            {products.filter((p: Product) => p.onSale).length}
          </div>
          <div className="text-sm text-gray-600">En oferta</div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 lg:p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Productos ({filteredProducts.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-box text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600 mb-2">No se encontraron productos</p>
            {searchTerm || selectedCategory !== "all" ? (
              <p className="text-sm text-gray-500">Prueba ajustando los filtros de búsqueda</p>
            ) : (
              <p className="text-sm text-gray-500">Comienza creando tu primer producto</p>
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
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
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
                  {filteredProducts.map((product: Product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.images.length > 0 && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatPrice(product.price)}</div>
                          {product.onSale && product.originalPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatPrice(product.originalPrice)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.inStock && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              En Stock
                            </Badge>
                          )}
                          {product.featured && (
                            <Badge variant="default" className="bg-purple-100 text-purple-800">
                              Destacado
                            </Badge>
                          )}
                          {product.onSale && (
                            <Badge variant="default" className="bg-orange-100 text-orange-800">
                              Oferta
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(product.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-product-${product.id}`}
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
              {filteredProducts.map((product: Product) => (
                <div key={product.id} className="p-4">
                  <div className="flex gap-4">
                    {product.images.length > 0 && (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-product-mobile-${product.id}`}
                          >
                            <i className="fas fa-edit text-xs"></i>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(product.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600"
                            data-testid={`button-delete-product-mobile-${product.id}`}
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="font-medium text-sm">{formatPrice(product.price)}</div>
                        {product.onSale && product.originalPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.inStock && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Stock
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                            Destacado
                          </Badge>
                        )}
                        {product.onSale && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            Oferta
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
    </div>
  );
}