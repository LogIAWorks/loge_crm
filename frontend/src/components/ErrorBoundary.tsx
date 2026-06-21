import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface State { hasError: boolean; message?: string; }

// Evita que un error de render deje la app en blanco: muestra una pantalla
// de recuperación con opción de recargar.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Punto único donde más adelante se puede enviar a Sentry/logging.
    console.error('ErrorBoundary capturó:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white rounded-3xl shadow-modal ring-1 ring-gray-100 p-8 max-w-md text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-lg font-black text-gray-900 mb-1">Algo ha fallado</h1>
            <p className="text-sm text-gray-500 mb-6">La aplicación encontró un error inesperado. Puedes recargar para continuar.</p>
            <button onClick={() => window.location.reload()} className="btn-primary w-full !py-3 rounded-2xl font-bold">
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
