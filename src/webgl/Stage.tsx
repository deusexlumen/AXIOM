import { lazy, Suspense } from "react";
import { hasWebGL } from "./hasWebGL";
import { useReducedMotion } from "@/motion/useReducedMotion";

const StageGL = lazy(() => import("./StageGL"));

const Poster = () => (
  <img src="/poster.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
);

export function Stage() {
  const reduced = useReducedMotion();
  if (reduced || !hasWebGL()) return <Poster />;
  return (
    <Suspense fallback={<Poster />}>
      <StageGL />
    </Suspense>
  );
}
