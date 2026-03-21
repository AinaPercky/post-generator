import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let errorDetails = null;

      if (this.state.error) {
        try {
          // Try to parse the error message as JSON (for Firestore errors)
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error) {
            errorMessage = "Database Permission Error";
            errorDetails = parsedError;
          }
        } catch (e) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">{errorMessage}</h2>
            {errorDetails ? (
              <div className="bg-neutral-100 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
                <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
              </div>
            ) : (
              <p className="text-neutral-600">{this.state.error?.message}</p>
            )}
            <button
              className="mt-6 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-black transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
