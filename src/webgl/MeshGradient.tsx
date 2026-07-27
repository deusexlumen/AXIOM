import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ShaderMaterial, Color } from "three";
import frag from "./meshGradient.frag.glsl?raw";
import vert from "./meshGradient.vert.glsl?raw";

export function MeshGradient() {
  const mat = useRef<ShaderMaterial>(null);
  useFrame((_, delta) => {
    const uTime = mat.current?.uniforms.uTime;
    if (uTime) uTime.value += delta;
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={{
          uTime: { value: 0 },
          uVoid: { value: new Color("#0a0a0c") },
          uFog: { value: new Color("#14141a") },
          uAccent: { value: new Color("#c9a76b") },
        }}
      />
    </mesh>
  );
}
