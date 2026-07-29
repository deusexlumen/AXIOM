import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export function ditherShader(item: PatternCatalogItem): { indexTsx: string; shaderGlsl: string } {
  const pascal = toPascal(item.name);
  const shaderGlsl = `uniform float uTime;
uniform float uScale;
varying vec2 vUv;

void main() {
  vec2 uv = vUv * uScale;
  float dither = step(0.5, fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + uTime));
  vec3 color = vec3(dither);
  gl_FragColor = vec4(color, 1.0);
}
`;
  const indexTsx = `"use client";
import { useRef } from "react";
import { Stage, useStageFrame } from "@/core/Stage";
import fragmentShader from "./shader.frag.glsl";

const vertexShader = \`${vertexShader}\`;

interface Props {
  scale?: number;
}

export function ${pascal}({ scale = 1 }: Props) {
  interface Uniforms {
    uTime: { value: number };
    uScale: { value: number };
  }
  const materialRef = useRef<{ uniforms: Uniforms }>(null);
  useStageFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uScale.value = scale;
  });
  return (
    <Stage className="h-screen w-full">
      <mesh>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{ uTime: { value: 0 }, uScale: { value: scale } }}
        />
      </mesh>
    </Stage>
  );
}
`;
  return { indexTsx, shaderGlsl };
}
