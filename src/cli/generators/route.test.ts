import { describe, it, expect } from "vitest";
import { routeTsx, routeManifestTs } from "@/cli/generators/route.js";

describe("route generator", () => {
  it("route wrapper is deterministic", () => {
    const a = routeTsx("/", "Home");
    const b = routeTsx("/", "Home");
    expect(a).toBe(b);
    expect(a).toContain("export default function HomeRoute()");
  });

  it("manifest is deterministic", () => {
    const a = routeManifestTs([{ path: "/", component: "Home", file: "src/routes/home.route.tsx" }]);
    const b = routeManifestTs([{ path: "/", component: "Home", file: "src/routes/home.route.tsx" }]);
    expect(a).toBe(b);
  });
});
