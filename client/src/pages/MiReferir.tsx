import { useState } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TopBar } from "@/components/TopBar";

interface Referral {
  id: string;
  referrerCode: string;
  referredId: string;
  status: 'pending' | 'qualified' | 'expired';
  qualifiedAt?: string;
  rewardGiven: boolean;
  createdAt: string;
  referredCustomer?: {
    name: string;
    createdAt: string;
  };
}

export function MiReferir() {
  const { customer, isLoading: customerLoading } = useCustomer();
  const { navigateInstantly } = useInstantNavigation();
  const { toast } = useToast();
  
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState("");

  // 📊 Obtener referidos del usuario
  const { data: referrals = [] } = useQuery<Referral[]>({
    queryKey: ["/api/customer/referrals"],
    enabled: !!customer,
  });

  // 📈 Calcular estadísticas de referidos
  const referralStats = {
    total: referrals.length,
    qualified: referrals.filter(r => r.status === 'qualified').length,
    pending: referrals.filter(r => r.status === 'pending').length,
    earnings: customer?.discountEarned || 0, // 5% real del valor de las compras
  };

  const referralUrl = customer ? `${window.location.origin}/?ref=${customer.referralCode}` : '';
  
  const defaultShareText = customer ? `¡Descubre los mejores productos tech en FULLTECH! 🚀\n\nUsa mi código ${customer.referralCode} y obtén descuentos especiales.\n\n${referralUrl}` : '';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "¡Copiado!", description: "El enlace ha sido copiado al portapapeles." });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast({ title: "¡Copiado!", description: "El enlace ha sido copiado al portapapeles." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    const message = shareText || defaultShareText;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareViaInstagram = () => {
    // Instagram no permite compartir enlaces directamente, copiamos el texto
    copyToClipboard(shareText || defaultShareText);
    toast({ 
      title: "Texto copiado", 
      description: "Pega este mensaje en tu historia o post de Instagram." 
    });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('¡Descubre FULLTECH!');
    const body = encodeURIComponent(shareText || defaultShareText);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(emailUrl);
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <TopBar />
        <div className="pt-20 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando programa de referidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <TopBar />
        <div className="pt-20 p-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Acceso Requerido</h1>
            <p className="text-slate-600 mb-6">Necesitas iniciar sesión para ver el programa de referidos.</p>
            <Button onClick={() => navigateInstantly('/login')} className="w-full">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <TopBar />
      
      <div className="pt-20 p-4 space-y-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigateInstantly('/mi/tablero')}
              className="text-slate-600 hover:text-slate-900"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Volver al Tablero
            </Button>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Programa de Referidos</h1>
            <p className="text-yellow-100">Gana 5% del valor de cada compra de tus referidos</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Referidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{referralStats.total}</div>
              <p className="text-xs text-slate-500 mt-1">Amigos invitados</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Calificados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{referralStats.qualified}</div>
              <p className="text-xs text-slate-500 mt-1">Que hicieron compras</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{referralStats.pending}</div>
              <p className="text-xs text-slate-500 mt-1">Sin compra aún</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Ganancias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">RD${referralStats.earnings.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Total acumulado</p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Share Section */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <i className="fas fa-share-alt text-yellow-600"></i>
                  Comparte tu Código
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="referral-code">Tu Código de Referencia</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="referral-code"
                      value={customer.referralCode}
                      readOnly
                      className="bg-slate-50 font-mono text-lg text-center"
                    />
                    <Button 
                      onClick={() => copyToClipboard(customer.referralCode)}
                      variant="outline"
                      className={copied ? "bg-green-50 text-green-600" : ""}
                    >
                      {copied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="referral-url">Enlace de Invitación</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="referral-url"
                      value={referralUrl}
                      readOnly
                      className="bg-slate-50 text-sm"
                    />
                    <Button 
                      onClick={() => copyToClipboard(referralUrl)}
                      variant="outline"
                      className={copied ? "bg-green-50 text-green-600" : ""}
                    >
                      {copied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="share-message">Mensaje Personalizado</Label>
                  <textarea
                    id="share-message"
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    placeholder={defaultShareText}
                    className="w-full mt-1 p-3 border border-slate-300 rounded-lg resize-none h-24 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={shareViaWhatsApp} className="bg-green-600 hover:bg-green-700">
                    <i className="fab fa-whatsapp mr-2"></i>
                    WhatsApp
                  </Button>
                  
                  <Button onClick={shareViaFacebook} className="bg-blue-600 hover:bg-blue-700">
                    <i className="fab fa-facebook mr-2"></i>
                    Facebook
                  </Button>
                  
                  <Button onClick={shareViaInstagram} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <i className="fab fa-instagram mr-2"></i>
                    Instagram
                  </Button>
                  
                  <Button onClick={shareViaEmail} variant="outline">
                    <i className="fas fa-envelope mr-2"></i>
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <i className="fas fa-question-circle text-yellow-600"></i>
                  ¿Cómo Funciona?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Comparte tu código</p>
                      <p className="text-sm text-slate-600">Envía tu código o enlace a tus amigos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Tu amigo se registra</p>
                      <p className="text-sm text-slate-600">Usando tu código de referencia</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">¡Ganas RD$25!</p>
                      <p className="text-sm text-slate-600">Cuando tu amigo haga su primera compra</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referrals List */}
          <div>
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <i className="fas fa-users text-yellow-600"></i>
                  Mis Referidos ({referrals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            referral.status === 'qualified' ? 'bg-green-500' :
                            referral.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {referral.referredCustomer?.name || 'Usuario referido'}
                            </p>
                            <p className="text-sm text-slate-500">
                              {new Date(referral.createdAt).toLocaleDateString('es-DO')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'qualified' ? 'bg-green-100 text-green-800' :
                            referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {referral.status === 'qualified' ? 'Calificado' :
                             referral.status === 'pending' ? 'Pendiente' : 'Expirado'}
                          </div>
                          {referral.status === 'qualified' && (
                            <p className="text-xs text-green-600 mt-1">+RD$25</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-user-plus text-4xl text-slate-300 mb-4"></i>
                    <p className="text-slate-500 mb-2">Aún no tienes referidos</p>
                    <p className="text-sm text-slate-400">¡Comparte tu código y empieza a ganar!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}