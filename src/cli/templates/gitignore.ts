export function gitignore(): string {
  return `node_modules/
dist/
out/
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
