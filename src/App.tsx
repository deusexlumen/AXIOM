import { useState } from "react";
import { LenisProvider } from "@/scroll/LenisProvider";
import { Preloader } from "@/components/Preloader";
import { Stage } from "@/webgl/Stage";
import { Hero } from "@/components/Hero";
import { PinnedNarrative } from "@/components/PinnedNarrative";

export default function App() {
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
      {ready && (
        <LenisProvider>
          <div className="relative">
            <div className="fixed inset-0 -z-10"><Stage /></div>
            <Hero />
            <PinnedNarrative />
            <section className="grid h-screen place-items-center font-display text-3xl">
              Ende
            </section>
          </div>
        </LenisProvider>
      )}
    </>
  );
}
