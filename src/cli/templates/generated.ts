export function stylesCss(): string {
  return `@import "tailwindcss";
@import "./generated/theme.css";

@layer base {
  body {
    background-color: var(--color-surface-base);
    color: var(--color-text-primary);
    font-family: system-ui, sans-serif;
  }
}
`;
}

export function themeCss(): string {
  return `:root {
  --color-action-primary: #4F46E5;
  --color-action-danger: #DC2626;
  --color-surface-base: #0B0F19;
  --color-surface-raised: #151B2B;
  --color-text-primary: #F5F7FA;
  --color-text-muted: #8A93A6;
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-8: 32px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-full: 9999px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-xl: 24px;
}
`;
}
