import { Canvas } from "@react-three/fiber";
import { MeshGradient } from "./MeshGradient";
import { hasWebGL } from "./hasWebGL";
import { useReducedMotion } from "@/motion/useReducedMotion";

const Poster = () => (
  <img src="/poster.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
);

export function Stage() {
  const reduced = useReducedMotion();
  if (reduced || !hasWebGL()) return <Poster />;
  return (
    <div className="absolute inset-0">
      <Canvas frameloop="always" dpr={[1, 2]} orthographic camera={{ position: [0, 0, 1] }}>
        <MeshGradient />
      </Canvas>
    </div>
  );
}
