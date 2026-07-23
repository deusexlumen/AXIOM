import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export function depthGallery(item: PatternCatalogItem): { indexTsx: string; shaderGlsl: string } {
  const pascal = toPascal(item.name);
  const shaderGlsl = `uniform float uTime;
uniform float uIndex;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float depth = sin(uIndex + uTime * 0.5) * 0.1;
  vec3 base = vec3(0.15 + depth, 0.2, 0.35);
  float vignette = 1.0 - distance(uv, vec2(0.5)) * 0.8;
  gl_FragColor = vec4(base * vignette, 1.0);
}
`;
  const indexTsx = `"use client";
import { useRef, useMemo } from "react";
import { useStageFrame } from "@/core/Stage";
import * as THREE from "three";
import { Stage } from "@/core/Stage";
import fragmentShader from "./shader.frag.glsl";

const vertexShader = \`${vertexShader}\`;

interface Props {
  items?: string[];
}

export function ${pascal}({ items = ["1", "2", "3"] }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const positions = useMemo(() => items.map((_, i) => (i - items.length * 0.5) * 1.5), [items]);
  useStageFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
  });
  return (
    <Stage className="h-screen w-full">
      <group ref={groupRef}>
        {positions.map((x, index) => (
          <mesh key={items[index] ?? index} position={[x, 0, 0]}>
            <planeGeometry args={[1, 1.4]} />
            <shaderMaterial
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
              uniforms={{ uTime: { value: 0 }, uIndex: { value: index } }}
            />
          </mesh>
        ))}
      </group>
    </Stage>
  );
}
`;
  return { indexTsx, shaderGlsl };
}
