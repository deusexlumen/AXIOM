import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

export function pageMaskTransition(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect, useState } from "react";
import { useChoreo, ease } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface Props {
  grammar?: string;
}

export function ${pascal}({ grammar = "mask-wipe-up" }: Props) {
  const maskRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const { timeline, isReducedMotion } = useChoreo({ id: "${item.name}", reducedMotion: "opacity-only" });

  useEffect(() => {
    const mask = maskRef.current;
    if (!mask) return;
    if (isReducedMotion) {
      mask.style.opacity = isActive ? "1" : "0";
      return;
    }
    timeline.fromTo(
      mask,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", duration: motion.dur.scene, ease: ease("hero") },
    );
  }, [timeline, isReducedMotion, isActive]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50" data-axm-id="${item.name}">
      <div
        ref={maskRef}
        className="h-full w-full bg-surface-raised"
        data-grammar={grammar}
        onClick={() => { setIsActive((v) => !v); }}
        role="presentation"
      />
    </div>
  );
}
`,
  };
}

export function webglCrossfade(item: PatternCatalogItem): { indexTsx: string; shaderGlsl: string } {
  const pascal = toPascal(item.name);
  const shaderGlsl = `uniform float uTime;
uniform float uProgress;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float wave = sin(uv.y * 10.0 + uTime) * uProgress;
  vec3 a = vec3(0.1, 0.1, 0.1);
  vec3 b = vec3(0.3, 0.3, 0.4);
  gl_FragColor = vec4(mix(a, b, uProgress + wave), 1.0);
}
`;
  const indexTsx = `"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stage } from "@/core/Stage";
import fragmentShader from "./shader.frag.glsl";

const vertexShader = \`varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}\`;

interface Props {
  duration?: number;
}

export function ${pascal}({ duration = 1.2 }: Props) {
  interface Uniforms {
    uTime: { value: number };
    uProgress: { value: number };
  }
  const materialRef = useRef<{ uniforms: Uniforms }>(null);
  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uProgress.value = (Math.sin(clock.getElapsedTime() / duration) + 1) * 0.5;
  });
  return (
    <Stage className="pointer-events-none fixed inset-0 z-40 h-screen w-full">
      <mesh>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{ uTime: { value: 0 }, uProgress: { value: 0 } }}
          transparent
        />
      </mesh>
    </Stage>
  );
}
`;
  return { indexTsx, shaderGlsl };
}
