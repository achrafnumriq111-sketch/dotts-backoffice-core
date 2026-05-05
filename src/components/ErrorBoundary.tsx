import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("ErrorBoundary caught", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold">Er ging iets mis</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              De applicatie is een onverwachte fout tegengekomen. Ververs de pagina om door te gaan.
            </p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Pagina vernieuwen
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}