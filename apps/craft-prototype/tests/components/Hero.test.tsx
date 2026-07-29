import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/Hero";

vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));

describe("Hero", () => {
  it("renders the headline text", () => {
    render(<Hero />);
    expect(screen.getByRole("heading")).toHaveTextContent(/Monolith/i);
  });
});
