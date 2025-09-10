import { useCustomer } from "@/hooks/useCustomer";

export function WelcomeMessage() {
  const { welcomeMessage, showWelcome, dismissWelcome } = useCustomer();

  if (!showWelcome || !welcomeMessage) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-xl shadow-2xl border border-white/20 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-heart text-white text-sm"></i>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-relaxed">
              {welcomeMessage}
            </p>
          </div>
          <button
            onClick={dismissWelcome}
            className="flex-shrink-0 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            data-testid="button-dismiss-welcome"
          >
            <i className="fas fa-times text-white text-xs"></i>
          </button>
        </div>
        
        {/* Barra de progreso para auto-hide */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/40 rounded-full animate-[shrink_6s_linear_forwards]" 
            style={{
              animation: 'shrink 6s linear forwards',
              transformOrigin: 'left'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}