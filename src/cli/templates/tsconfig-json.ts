export function tsConfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        jsx: "react-jsx",
        outDir: "./dist",
        rootDir: ".",
        baseUrl: ".",
        paths: { "@/*": ["./src/*"] },
        strict: true,
        noUncheckedIndexedAccess: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        allowJs: true,
        noEmit: true,
      },
      include: ["src/**/*", "*.config.ts", "*.config.js"],
      exclude: ["node_modules", "dist"],
    },
    null,
    2
  );
}
