export function routerTs(): string {
  return `import type { ReactNode } from "react";

export interface Route {
  path: string;
  component: ReactNode;
}

export function Router({ routes }: { routes: Route[] }): ReactNode {
  const current = routes.find((r) => r.path === window.location.pathname) ?? routes[0];
  return current?.component ?? null;
}
`;
}

export function errorBoundaryTsx(): string {
  return `import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally silent in M0; logging strategy added later.
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
`;
}

export function tokenProviderTsx(): string {
  return `import type { ReactNode } from "react";

export function TokenProvider({ children }: { children: ReactNode }): ReactNode {
  return children;
}
`;
}
