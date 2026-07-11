export function quadFragGlsl(): string {
  return `uniform float uTime;
varying vec2 vUv;

void main() {
  vec3 color = vec3(
    0.5 + 0.5 * sin(uTime + vUv.x * 3.14159),
    0.2,
    0.8
  );
  gl_FragColor = vec4(color, 1.0);
}
`;
}

export function glslDts(): string {
  return `declare module "*.glsl" {
  const content: string;
  export default content;
}
`;
}
