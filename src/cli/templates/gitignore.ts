export function gitignore(): string {
  return `node_modules/
dist/
*.log
.DS_Store
.env
.env.local
coverage/
playwright-report/
test-results/
`;
}
