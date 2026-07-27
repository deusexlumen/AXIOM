import { Canvas } from "@react-three/fiber";
import { MeshGradient } from "./MeshGradient";

export default function StageGL() {
  return (
    <div className="absolute inset-0">
      <Canvas frameloop="always" dpr={[1, 2]} orthographic camera={{ position: [0, 0, 1] }}>
        <MeshGradient />
      </Canvas>
    </div>
  );
}
