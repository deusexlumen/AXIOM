import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export function meshGradientBg(item: PatternCatalogItem): { indexTsx: string; shaderGlsl: string } {
  const pascal = toPascal(item.name);
  const shaderGlsl = `uniform float uTime;
uniform float uSpeed;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * uSpeed;
  vec3 a = vec3(0.1, 0.2, 0.5);
  vec3 b = vec3(0.5, 0.2, 0.6);
  vec3 c = vec3(0.2, 0.5, 0.7);
  float noise = sin(uv.x * 4.0 + t) * cos(uv.y * 4.0 + t * 0.7);
  vec3 color = mix(mix(a, b, uv.x + noise * 0.2), c, uv.y + noise * 0.1);
  gl_FragColor = vec4(color, 1.0);
}
`;
  const indexTsx = `"use client";
import { useRef } from "react";
import { Stage, useStageFrame } from "@/core/Stage";
import fragmentShader from "./shader.frag.glsl";

const vertexShader = \`${vertexShader}\`;

interface Props {
  speed?: number;
}

export function ${pascal}({ speed = 0.2 }: Props) {
  interface Uniforms {
    uTime: { value: number };
    uSpeed: { value: number };
  }
  const materialRef = useRef<{ uniforms: Uniforms }>(null);
  useStageFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uSpeed.value = speed;
  });
  return (
    <Stage className="fixed inset-0 -z-10 h-screen w-full">
      <mesh>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{ uTime: { value: 0 }, uSpeed: { value: speed } }}
        />
      </mesh>
    </Stage>
  );
}
`;
  return { indexTsx, shaderGlsl };
}
