import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export function particleType(item: PatternCatalogItem): { indexTsx: string; shaderGlsl: string } {
  const pascal = toPascal(item.name);
  const shaderGlsl = `uniform float uTime;
uniform float uParticleCount;
varying vec2 vUv;

void main() {
  float glow = smoothstep(0.5, 0.0, distance(vUv, vec2(0.5)));
  vec3 color = vec3(0.9, 0.95, 1.0) * glow;
  gl_FragColor = vec4(color, glow);
}
`;
  const indexTsx = `"use client";
import { useRef, useMemo, useEffect } from "react";
import { useStageFrame } from "@/core/Stage";
import * as THREE from "three";
import { Stage } from "@/core/Stage";
import { Text } from "@react-three/drei";
import fragmentShader from "./shader.frag.glsl";

const vertexShader = \`${vertexShader}\`;

interface Props {
  text?: string;
  particleCount?: number;
}

export function ${pascal}({ text = "AXIOM", particleCount = 2048 }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 4;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1;
    }
    return arr;
  }, [particleCount]);

  useEffect(() => {
    const points = pointsRef.current;
    if (!points) return;
    points.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [positions]);

  useStageFrame(({ clock }) => {
    const material = pointsRef.current?.material as THREE.ShaderMaterial | undefined;
    if (!material) return;
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <Stage className="h-screen w-full">
      <points ref={pointsRef}>
        <bufferGeometry />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          uniforms={{ uTime: { value: 0 }, uParticleCount: { value: particleCount } }}
        />
      </points>
      <Text fontSize={0.1} position={[0, -1.2, 0]} color="#8A93A6">
        {text}
      </Text>
    </Stage>
  );
}
`;
  return { indexTsx, shaderGlsl };
}
