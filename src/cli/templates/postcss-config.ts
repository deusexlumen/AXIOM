export function postcssConfigMjs(): string {
  return `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;
}
