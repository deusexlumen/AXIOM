export function axmSelectTs(): string {
  return `export function axmSelect(name: string): string {
  return \`[data-axm-id="\${name}"]\`;
}
`;
}
