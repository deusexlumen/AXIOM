export function routerTs(): string {
  return `import type { ReactNode } from "react";
import { routes } from "@/generated/route-manifest";

export function Router(): ReactNode {
  const current = routes.find((r) => r.path === window.location.pathname) ?? routes[0];
  return current?.component ?? null;
}
`;
}

export function errorBoundaryTsx(): string {
  return `import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

export function ErrorBoundary({ children, fallback }: Props): ReactNode {
  return <ReactErrorBoundary fallback={fallback}>{children}</ReactErrorBoundary>;
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
