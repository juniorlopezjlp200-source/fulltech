import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useShareMotivation } from "@/hooks/useShareMotivation";
import { SplashScreen } from "@/components/SplashScreen";

import NotFound from "@/pages/not-found";
import Catalog from "@/pages/catalog";
import ProductDetail from "@/pages/ProductDetail";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { PhoneAuth } from "@/pages/PhoneAuth";
import { CustomerDashboard } from "@/pages/CustomerDashboard";
import { MiTablero } from "@/pages/MiTablero";
import { MiPerfil } from "@/pages/MiPerfil";
import { MiConfiguracion } from "@/pages/MiConfiguracion";
import { MiReferir } from "@/pages/MiReferir";
import { MiSoporte } from "@/pages/MiSoporte";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminProfile from "@/pages/AdminProfile";
import Warranty from "@/pages/Warranty";
import Refund from "@/pages/Refund";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import CustomPage from "@/pages/CustomPage";
import { Footer } from "@/components/Footer";
import { FixedFooter } from "@/components/FixedFooter";

/** Sube al top cuando cambia la ruta */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    const id = window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    return () => window.cancelAnimationFrame(id);
  }, [location]);
  return null;
}

function Router() {
  const [location] = useLocation();
  const [hash, setHash] = useState(typeof window !== "undefined" ? window.location.hash : "");

  // Hook global para motivación de compartir cada 15 segundos
  useShareMotivation();

  // escuchar cambios de hash (para páginas custom)
  useEffect(() => {
    const handleHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const isCustomPage = hash?.startsWith("#page=");
  const shouldShowFooter = false; // Disable original Footer, only show FixedFooter

  if (isCustomPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 pb-16 md:pb-20 safe-area-bottom" style={{paddingBottom: `max(4rem, calc(4rem + env(safe-area-inset-bottom)))`}}>
          <CustomPage />
        </div>
        {/* 📌 Footer oculto en rutas /mi/* y /admin* incluso en custom pages */}
        {!location.startsWith('/mi/') && !location.startsWith('/admin') && <FixedFooter />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      
      <div className={`flex-1 pb-16 md:pb-20 safe-area-bottom`} style={{paddingBottom: `max(4rem, calc(4rem + env(safe-area-inset-bottom)))`}}>
        <ScrollToTop />
        <Switch>
          <Route path="/" component={Catalog} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/phone-auth" component={PhoneAuth} />
          <Route path="/customer/dashboard" component={CustomerDashboard} />
          {/* ✅ Rutas del área cliente protegidas */}
          <Route path="/mi/tablero" component={MiTablero} />
          <Route path="/mi/perfil" component={MiPerfil} />
          <Route path="/mi/configuracion" component={MiConfiguracion} />
          <Route path="/mi/referir" component={MiReferir} />
          <Route path="/mi/soporte" component={MiSoporte} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/profile" component={AdminProfile} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/garantia" component={Warranty} />
          <Route path="/reembolsos" component={Refund} />
          <Route path="/privacidad" component={Privacy} />
          <Route path="/terminos" component={Terms} />
          <Route path="/sobre-nosotros" component={About} />
          <Route path="/contacto" component={Contact} />
          <Route component={NotFound} />
        </Switch>
      </div>

      {shouldShowFooter && <Footer />}
      
      {/* 📌 Footer Fijo con Publicidad Central - Oculto en rutas /mi/* y /admin* */}
      {!location.startsWith('/mi/') && !location.startsWith('/admin') && <FixedFooter />}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
