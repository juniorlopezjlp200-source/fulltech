import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export interface Customer {
  id: string;
  googleId?: string;
  email?: string;
  phone?: string;
  name: string;
  picture?: string;
  address?: string;
  referralCode: string;
  authProvider: 'google' | 'phone';
  isPhoneVerified?: boolean;
  discountEarned?: number;
  isActive?: boolean;
  createdAt: string;
  lastVisit?: string;
}

export function useCustomer() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");
  const [showWelcome, setShowWelcome] = useState(false);

  const { data: authResponse, isLoading, error } = useQuery<{
    authenticated: boolean;
    user?: {
      id: string;
      name: string;
      email?: string;
      avatarUrl?: string;
    };
  }>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const response = await fetch("/api/me", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Map the response to Customer format for compatibility
  const customer: Customer | null = authResponse?.authenticated 
    ? {
        id: authResponse.user!.id,
        name: authResponse.user!.name,
        email: authResponse.user!.email,
        picture: authResponse.user!.avatarUrl,
        referralCode: '', // Will be loaded from profile endpoint if needed
        authProvider: 'google' as const, // Determined from auth method
        isPhoneVerified: false,
        createdAt: new Date().toISOString(), // Default value
        lastVisit: new Date().toISOString(),
        isActive: true
      }
    : null;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      return response.json();
    },
    onSuccess: () => {
      // Limpiar localStorage
      localStorage.removeItem("customer_last_visit");
      localStorage.removeItem("customer_preferences");
      queryClient.removeQueries({ queryKey: ["/api/me"] });
      setLocation("/");
    },
  });

  // Manejar persistencia de sesión y mensajes de bienvenida
  useEffect(() => {
    if (customer && !isLoading) {
      const now = new Date().toISOString();
      const lastVisit = localStorage.getItem("customer_last_visit");
      const isFirstVisitToday = !lastVisit || 
        new Date(lastVisit).toDateString() !== new Date().toDateString();

      // Generar mensaje de bienvenida personalizado
      const hour = new Date().getHours();
      let greeting = "";
      if (hour < 12) greeting = "¡Buenos días";
      else if (hour < 18) greeting = "¡Buenas tardes";
      else greeting = "¡Buenas noches";

      let message = "";
      if (isFirstVisitToday) {
        if (!lastVisit) {
          // Primera vez que visita la app
          message = `${greeting}, ${customer.name}! 🎉 ¡Bienvenido a FULLTECH! Gracias por unirte a nuestra familia.`;
        } else {
          // Visita recurrente
          const daysSinceLastVisit = Math.floor(
            (new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastVisit === 1) {
            message = `${greeting}, ${customer.name}! 😊 ¡Qué bueno verte de nuevo!`;
          } else if (daysSinceLastVisit <= 7) {
            message = `${greeting}, ${customer.name}! 👋 ¡Te extrañamos! Descubre nuestras nuevas ofertas.`;
          } else {
            message = `${greeting}, ${customer.name}! 🌟 ¡Hace tiempo que no te veíamos! Tenemos productos increíbles esperándote.`;
          }
        }

        setWelcomeMessage(message);
        setShowWelcome(true);
        
        // Auto-hide mensaje después de 6 segundos
        setTimeout(() => setShowWelcome(false), 6000);
      }

      // Guardar información de la visita
      localStorage.setItem("customer_last_visit", now);
      localStorage.setItem("customer_preferences", JSON.stringify({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        picture: customer.picture,
        address: customer.address,
        referralCode: customer.referralCode,
        authProvider: customer.authProvider,
        isPhoneVerified: customer.isPhoneVerified
      }));
    }
  }, [customer, isLoading]);

  const logout = () => {
    logoutMutation.mutate();
  };

  const dismissWelcome = () => {
    setShowWelcome(false);
  };

  // Función para obtener preferencias guardadas
  const getSavedPreferences = () => {
    const saved = localStorage.getItem("customer_preferences");
    return saved ? JSON.parse(saved) : null;
  };

  // Función para verificar si hay una sesión guardada
  const hasSavedSession = () => {
    return !!localStorage.getItem("customer_preferences");
  };

  return {
    customer,
    isLoading,
    error,
    isAuthenticated: authResponse?.authenticated === true,
    logout,
    isLoggingOut: logoutMutation.isPending,
    welcomeMessage,
    showWelcome,
    dismissWelcome,
    getSavedPreferences,
    hasSavedSession
  };
}