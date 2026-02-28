import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
    children: ReactNode;
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
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-6">
                    <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center border border-border">
                        <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-10 w-10 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">¡Ups! Algo salió mal</h1>
                        <p className="text-muted-foreground mb-6">
                            La aplicación encontró un error inesperado. Hemos registrado el problema.
                        </p>
                        {this.state.error && (
                            <div className="bg-muted p-4 rounded-lg text-left text-xs font-mono mb-6 overflow-auto max-h-40">
                                {this.state.error.toString()}
                            </div>
                        )}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full"
                            >
                                Recargar Aplicación
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    window.location.href = '/';
                                }}
                                className="w-full"
                            >
                                Volver al Inicio
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
