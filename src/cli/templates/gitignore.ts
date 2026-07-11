export function gitignore(): string {
  return `node_modules/
dist/
.next/
next-env.d.ts
*.log
.DS_Store
.env
.env.local
coverage/
playwright-report/
test-results/
`;
}
