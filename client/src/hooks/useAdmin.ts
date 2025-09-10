import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLogin?: string;
}

export function useAdmin() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: admin, isLoading, error } = useQuery<AdminUser>({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }), // ✅ 401 → null (no error)
    retry: false,
    staleTime: 0, // ✅ Siempre revalidar para admin auth
    cacheTime: 1000 * 60, // 1 minuto de cache
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include", // ✅ Incluir credenciales para logout
      });
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["/api/admin/me"] });
      setLocation("/admin/login");
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    admin,
    isLoading,
    error,
    isAuthenticated: !!admin,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}