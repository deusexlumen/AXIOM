import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";
import { flowmapHero } from "@/cli/generators/pattern-webgl-flowmap.js";
import { particleType } from "@/cli/generators/pattern-webgl-particle.js";
import { meshGradientBg } from "@/cli/generators/pattern-webgl-mesh-gradient.js";
import { ditherShader } from "@/cli/generators/pattern-webgl-dither.js";
import { depthGallery } from "@/cli/generators/pattern-webgl-depth-gallery.js";

const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

function distortionMedia(item: PatternCatalogItem): { indexTsx: string; shaderGlsl: string } {
  const pascal = toPascal(item.name);
  const shaderGlsl = `uniform float uTime;
uniform float uIntensity;
uniform float uRgbShift;
uniform float uHover;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float wave = sin(uv.y * 12.0 + uTime * 2.0);
  float displacement = wave * uIntensity * uHover;
  vec2 shifted = uv + vec2(displacement, 0.0);
  vec3 base = vec3(0.5 + 0.5 * sin(uTime + shifted.x * 3.14159), 0.2, 0.8);
  float r = base.r + uRgbShift * uHover * 10.0;
  float b = base.b - uRgbShift * uHover * 10.0;
  gl_FragColor = vec4(r, base.g, b, 1.0);
}
`;
  const indexTsx = `"use client";
import { useRef, useState } from "react";
import { Stage, useStageFrame } from "@/core/Stage";
import fragmentShader from "./shader.frag.glsl";

const vertexShader = \`${vertexShader}\`;

interface Uniforms {
  uTime: { value: number };
  uIntensity: { value: number };
  uRgbShift: { value: number };
  uHover: { value: number };
}

interface MeshProps {
  intensity: number;
  rgbShift: number;
  hover: number;
  onHoverChange: (value: number) => void;
}

function ${pascal}Mesh({ intensity, rgbShift, hover, onHoverChange }: MeshProps) {
  const materialRef = useRef<{ uniforms: Uniforms }>(null);
  useStageFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uIntensity.value = intensity;
    material.uniforms.uRgbShift.value = rgbShift;
    material.uniforms.uHover.value = hover;
  });
  return (
    <mesh
      onPointerOver={() => { onHoverChange(1); }}
      onPointerOut={() => { onHoverChange(0); }}
    >
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 }, uIntensity: { value: intensity }, uRgbShift: { value: rgbShift }, uHover: { value: 0 } }}
      />
    </mesh>
  );
}

interface Props {
  intensity?: number;
  rgbShift?: number;
}

export function ${pascal}({ intensity = 0.5, rgbShift = 0.003 }: Props) {
  const [hover, setHover] = useState(0);
  return (
    <Stage className="h-screen w-full">
      <${pascal}Mesh intensity={intensity} rgbShift={rgbShift} hover={hover} onHoverChange={setHover} />
    </Stage>
  );
}
`;
  return { indexTsx, shaderGlsl };
}

export function generateWebglPattern(item: PatternCatalogItem): { indexTsx: string; shaderGlsl: string } {
  if (item.name === "flowmap-hero") return flowmapHero(item);
  if (item.name === "particle-type") return particleType(item);
  if (item.name === "mesh-gradient-bg") return meshGradientBg(item);
  if (item.name === "dither-shader") return ditherShader(item);
  if (item.name === "depth-gallery") return depthGallery(item);
  return distortionMedia(item);
}
