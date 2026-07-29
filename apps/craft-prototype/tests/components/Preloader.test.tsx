import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { Preloader } from "@/components/Preloader";

vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));

describe("Preloader", () => {
  it("calls onDone after the sequence", async () => {
    const onDone = vi.fn();
    render(<Preloader onDone={onDone} />);
    await waitFor(() => expect(onDone).toHaveBeenCalled(), { timeout: 4000 });
  });
});
