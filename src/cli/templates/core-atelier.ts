export function stageTsx(): string {
  return `"use client";
import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

interface StageProps {
  children?: ReactNode;
  className?: string;
}

export function Stage({ children, className }: StageProps) {
  return (
    <Canvas className={className} gl={{ antialias: true, alpha: true }}>
      {children}
    </Canvas>
  );
}
`;
}

export function quadMeshTsx(): string {
  return `"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import fragmentShader from "@/shaders/quad.frag.glsl";

const vertexShader = \`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }\`;

export function QuadMesh() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (materialRef.current?.uniforms.uTime) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  );
}
`;
}

export function useChoreoTs(): string {
  return `"use client";
import { useEffect, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ChoreoOptions {
  id: string;
}

interface ChoreoResult {
  timeline: gsap.core.Timeline;
  isReducedMotion: boolean;
}

export function useChoreo(options: ChoreoOptions): ChoreoResult {
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const timeline = useMemo(() => {
    return gsap.timeline({ id: options.id });
  }, [options.id]);

  useEffect(() => {
    return () => {
      timeline.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.id === options.id) st.kill();
      });
    };
  }, [timeline, options.id]);

  return { timeline, isReducedMotion };
}
`;
}

export function lenisTs(): string {
  return `"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis(): void {
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09 });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
    };
  }, []);
}
`;
}
export function errorBoundaryTsx(): string {
  return `"use client";
import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

export function ErrorBoundary({ children, fallback }: Props): ReactNode {
  return <ReactErrorBoundary fallback={fallback}>{children}</ReactErrorBoundary>;
}
`;
}
