export function mainTsx(): string {
  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "@/styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;
}

export function appTsx(): string {
  return `import { ErrorBoundary } from "@/core/error-boundary";
import { Router } from "@/core/router";
import { TokenProvider } from "@/core/token-provider";

export function App() {
  return (
    <ErrorBoundary fallback={<div>AXIOM Error</div>}>
      <TokenProvider>
        <Router />
      </TokenProvider>
    </ErrorBoundary>
  );
}
`;
}

export function appTestTsx(): string {
  return `import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "@/App";

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });
});
`;
}

export function indexHtml(projectName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}
