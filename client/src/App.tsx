import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Catalog from "@/pages/catalog";
import ProductDetail from "@/pages/ProductDetail";
import { Login } from "@/pages/Login";
import { CustomerDashboard } from "@/pages/CustomerDashboard";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import Warranty from "@/pages/Warranty";
import Refund from "@/pages/Refund";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import CustomPage from "@/pages/CustomPage";
import { Footer } from "@/components/Footer";

/** Sube al top cuando cambia la ruta */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    const id = window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    return () => window.cancelAnimationFrame(id);
  }, [location]);
  return null;
}

function Router() {
  const [location] = useLocation();
  const [hash, setHash] = useState(typeof window !== "undefined" ? window.location.hash : "");

  // escuchar cambios de hash (para páginas custom)
  useEffect(() => {
    const handleHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const isCustomPage = hash?.startsWith("#page=");
  const shouldShowFooter = location === "/" && !isCustomPage;

  if (isCustomPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <CustomPage />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className={`flex-1 ${shouldShowFooter ? "pb-16" : ""}`}>
        <ScrollToTop />
        <Switch>
          <Route path="/" component={Catalog} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/login" component={Login} />
          <Route path="/customer/dashboard" component={CustomerDashboard} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
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
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
