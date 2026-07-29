import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export function flowmapHero(item: PatternCatalogItem): { indexTsx: string; shaderGlsl: string } {
  const pascal = toPascal(item.name);
  const shaderGlsl = `uniform float uTime;
uniform float uTrailStrength;
uniform float uDissipation;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float wave = sin(uv.y * 10.0 + uTime * 1.5) * uTrailStrength;
  float trail = smoothstep(0.4, 0.6, uv.x + wave);
  vec3 color = vec3(0.1, 0.3, 0.6) * trail * uDissipation;
  gl_FragColor = vec4(color, 1.0);
}
`;
  const indexTsx = `"use client";
import { useRef } from "react";
import { Stage, useStageFrame } from "@/core/Stage";
import fragmentShader from "./shader.frag.glsl";

const vertexShader = \`${vertexShader}\`;

interface Props {
  trailStrength?: number;
  dissipation?: number;
}

export function ${pascal}({ trailStrength = 0.4, dissipation = 0.92 }: Props) {
  interface Uniforms {
    uTime: { value: number };
    uTrailStrength: { value: number };
    uDissipation: { value: number };
  }
  const materialRef = useRef<{ uniforms: Uniforms }>(null);
  useStageFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uTrailStrength.value = trailStrength;
    material.uniforms.uDissipation.value = dissipation;
  });
  return (
    <Stage className="h-screen w-full">
      <mesh>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{ uTime: { value: 0 }, uTrailStrength: { value: trailStrength }, uDissipation: { value: dissipation } }}
        />
      </mesh>
    </Stage>
  );
}
`;
  return { indexTsx, shaderGlsl };
}
