"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Shown in the fallback so the user knows which part failed. */
  label: string;
}

interface State {
  error: Error | null;
}

/**
 * Isolates a crash to one region of the page.
 *
 * Wrapped around the Remotion Player and (from Phase 2) the ffmpeg worker
 * because both run third-party code against browser APIs — WebCodecs, WASM,
 * SharedArrayBuffer — whose support varies by browser and by build. Without a
 * boundary, an unsupported codec on one user's Safari unmounts the entire
 * editor and loses their unsaved edits along with it.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[Bolo] ${this.props.label} crashed`, error, info);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <div className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-card/50 p-8 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-5 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{this.props.label} stopped</p>
          <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground">
            {error.message || "Something went wrong while rendering."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={this.reset}>
          <RotateCcw className="size-3.5" />
          Try again
        </Button>
      </div>
    );
  }
}
