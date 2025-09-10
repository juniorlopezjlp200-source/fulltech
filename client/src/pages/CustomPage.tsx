import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";

interface CustomPageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
}

export default function CustomPage() {
  const [pageSlug, setPageSlug] = useState<string | null>(null);
  const { goHome } = useInstantNavigation();
  
  // Extract page slug from hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#page=(.+)$/);
      if (match) {
        setPageSlug(match[1]);
      } else {
        setPageSlug(null);
      }
    };

    // Check initial hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Fetch page data by slug
  const { data: page, isLoading, error } = useQuery<CustomPageData>({
    queryKey: ["/api/custom-pages/slug", pageSlug],
    queryFn: async () => {
      if (!pageSlug) throw new Error("No page slug provided");
      const response = await fetch(`/api/custom-pages/slug/${pageSlug}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!pageSlug,
    retry: false,
  });

  // If no slug in hash, redirect to home
  if (!pageSlug) {
    goHome();
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <TopBar />
        <div className="pt-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
              <p className="text-white/80">Cargando página...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <TopBar />
        <div className="pt-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <i className="fas fa-exclamation-triangle text-3xl text-yellow-400"></i>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Página no encontrada</h1>
              <p className="text-white/80 mb-8">
                La página que buscas no existe o ha sido eliminada.
              </p>
              <Button 
                onClick={goHome}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Catálogo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <TopBar />
      <div className="pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Button 
              variant="ghost" 
              onClick={goHome}
              className="text-white/80 hover:text-white hover:bg-white/10 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Catálogo
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {page.title}
            </h1>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl">
            <div 
              className="prose prose-lg max-w-none text-white/90 prose-headings:text-white prose-strong:text-white prose-links:text-blue-300 hover:prose-links:text-blue-200"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>

          {/* Back to catalog footer */}
          <div className="text-center mt-8 mb-20">
            <Button 
              onClick={goHome}
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Catálogo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}