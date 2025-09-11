import { useState } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TopBar } from "@/components/TopBar";

interface SupportTicket {
  id: string;
  customerId: string;
  type: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function MiSoporte() {
  const { customer, isLoading: customerLoading } = useCustomer();
  const { navigateInstantly } = useInstantNavigation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [supportForm, setSupportForm] = useState({
    type: '',
    subject: '',
    message: '',
    priority: 'normal'
  });

  // Load existing support tickets
  const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/customer/support-tickets"],
    enabled: !!customer,
  });

  // Mutation to create support ticket
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const response = await fetch('/api/customer/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create support ticket');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "¡Ticket creado exitosamente!",
        description: `Tu ticket #${data.ticket.id} ha sido creado. Te contactaremos pronto.`
      });
      
      // Clear form
      setSupportForm({
        type: '',
        subject: '',
        message: '',
        priority: 'normal'
      });
      
      // Refresh tickets list
      queryClient.invalidateQueries({ queryKey: ["/api/customer/support-tickets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear ticket",
        description: error.message || "No se pudo crear el ticket. Inténtalo de nuevo.",
        variant: "destructive"
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setSupportForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitTicket = async () => {
    if (!supportForm.type || !supportForm.subject || !supportForm.message) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    createTicketMutation.mutate(supportForm);
  };

  const openWhatsAppSupport = () => {
    const message = `Hola, necesito ayuda con mi cuenta de FULLTECH.\n\nNombre: ${customer?.name}\nEmail: ${customer?.email}\nCódigo: ${customer?.referralCode}\n\nConsulta: `;
    const whatsappUrl = `https://wa.me/18295551234?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const openEmailSupport = () => {
    const subject = encodeURIComponent('Soporte FULLTECH - ' + customer?.referralCode);
    const body = encodeURIComponent(`Hola equipo de FULLTECH,\n\nNecesito ayuda con mi cuenta.\n\nDetalles de mi cuenta:\nNombre: ${customer?.name}\nEmail: ${customer?.email}\nCódigo de referencia: ${customer?.referralCode}\n\nConsulta:\n[Describe tu problema aquí]\n\nGracias por su ayuda.`);
    const emailUrl = `mailto:soporte@fulltech.do?subject=${subject}&body=${body}`;
    window.open(emailUrl);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      account: 'Problema con cuenta',
      referral: 'Programa de referidos',
      payment: 'Pagos y facturación',
      product: 'Consulta de producto',
      technical: 'Problema técnico',
      other: 'Otro'
    };
    return types[type] || type;
  };

  if (customerLoading || ticketsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <TopBar />
        <div className="pt-20 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando soporte...</p>
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
            <p className="text-slate-600 mb-6">Necesitas iniciar sesión para acceder al soporte.</p>
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
        <div className="max-w-6xl mx-auto">
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
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Centro de Soporte</h1>
            <p className="text-blue-100">Estamos aquí para ayudarte con cualquier duda o problema</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Quick Contact & FAQ */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <i className="fas fa-headset text-blue-600"></i>
                  Contacto Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={openWhatsAppSupport}
                  className="w-full bg-green-600 hover:bg-green-700 justify-start"
                >
                  <i className="fab fa-whatsapp mr-3 text-xl"></i>
                  <div className="text-left">
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-xs opacity-90">Respuesta inmediata</p>
                  </div>
                </Button>

                <Button 
                  onClick={openEmailSupport}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <i className="fas fa-envelope mr-3 text-xl text-blue-600"></i>
                  <div className="text-left">
                    <p className="font-medium">Email</p>
                    <p className="text-xs text-slate-500">soporte@fulltech.do</p>
                  </div>
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Horarios de Atención</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Lunes - Viernes:</strong> 9:00 AM - 6:00 PM</p>
                    <p><strong>Sábados:</strong> 9:00 AM - 2:00 PM</p>
                    <p><strong>Domingos:</strong> Cerrado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <i className="fas fa-question-circle text-blue-600"></i>
                  Preguntas Frecuentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="font-medium text-slate-900 mb-1">¿Cómo funciona el programa de referidos?</h4>
                    <p className="text-sm text-slate-600">Compartes tu código, tus amigos se registran y compran, y tú ganas RD$25 por cada referido calificado.</p>
                  </div>
                  
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="font-medium text-slate-900 mb-1">¿Cuándo recibo mis ganancias?</h4>
                    <p className="text-sm text-slate-600">Las ganancias se acreditan automáticamente cuando tu referido completa su primera compra.</p>
                  </div>
                  
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="font-medium text-slate-900 mb-1">¿Cómo actualizo mi información?</h4>
                    <p className="text-sm text-slate-600">Ve a "Mi Perfil" en tu tablero para actualizar tu información personal y de contacto.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">¿Ofrecen garantía en los productos?</h4>
                    <p className="text-sm text-slate-600">Sí, todos nuestros productos incluyen garantía del fabricante. Contacta soporte para más detalles.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Support Ticket Form */}
          <div>
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <i className="fas fa-ticket-alt text-blue-600"></i>
                  Crear Ticket de Soporte
                  {createTicketMutation.isPending && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="support-type">Tipo de Consulta *</Label>
                  <Select 
                    value={supportForm.type} 
                    onValueChange={(value) => handleInputChange('type', value)}
                    disabled={createTicketMutation.isPending}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Problema con cuenta</SelectItem>
                      <SelectItem value="referral">Programa de referidos</SelectItem>
                      <SelectItem value="payment">Pagos y facturación</SelectItem>
                      <SelectItem value="product">Consulta de producto</SelectItem>
                      <SelectItem value="technical">Problema técnico</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select 
                    value={supportForm.priority} 
                    onValueChange={(value) => handleInputChange('priority', value)}
                    disabled={createTicketMutation.isPending}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Asunto *</Label>
                  <Input
                    id="subject"
                    value={supportForm.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Describe brevemente tu consulta"
                    className="mt-1"
                    disabled={createTicketMutation.isPending}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Mensaje *</Label>
                  <textarea
                    id="message"
                    value={supportForm.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Describe detalladamente tu consulta o problema..."
                    className="w-full mt-1 p-3 border border-slate-300 rounded-lg resize-none h-32 disabled:bg-slate-50 disabled:text-slate-500"
                    disabled={createTicketMutation.isPending}
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-2">Información de tu cuenta</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p><strong>Nombre:</strong> {customer.name}</p>
                    <p><strong>Email:</strong> {customer.email || 'No especificado'}</p>
                    <p><strong>Código:</strong> {customer.referralCode}</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmitTicket}
                  disabled={createTicketMutation.isPending}
                  className="w-full"
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creando ticket...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Crear Ticket
                    </>
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  * Campos obligatorios. Recibirás una respuesta en las próximas 24 horas.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - My Tickets */}
          <div>
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <i className="fas fa-history text-blue-600"></i>
                  Mis Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supportTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-inbox text-4xl text-slate-300 mb-4"></i>
                    <p className="text-slate-500">No tienes tickets de soporte aún</p>
                    <p className="text-sm text-slate-400 mt-1">Crea tu primer ticket para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-slate-900 text-sm">{ticket.subject}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status === 'open' ? 'Abierto' : ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{getTypeLabel(ticket.type)}</p>
                        <p className="text-sm text-slate-700 mb-3 line-clamp-2">{ticket.message}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>#{ticket.id}</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString('es-DO')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-link text-blue-600"></i>
                Enlaces Útiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start flex-col"
                  onClick={() => navigateInstantly('/terms')}
                >
                  <i className="fas fa-file-contract text-2xl text-blue-600 mb-2"></i>
                  <span className="font-medium">Términos y Condiciones</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start flex-col"
                  onClick={() => navigateInstantly('/privacy')}
                >
                  <i className="fas fa-shield-alt text-2xl text-green-600 mb-2"></i>
                  <span className="font-medium">Política de Privacidad</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start flex-col"
                  onClick={() => navigateInstantly('/refund')}
                >
                  <i className="fas fa-undo text-2xl text-yellow-600 mb-2"></i>
                  <span className="font-medium">Política de Devoluciones</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start flex-col"
                  onClick={() => navigateInstantly('/warranty')}
                >
                  <i className="fas fa-certificate text-2xl text-purple-600 mb-2"></i>
                  <span className="font-medium">Garantías</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}