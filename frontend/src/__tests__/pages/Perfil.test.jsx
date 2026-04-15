import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Main from "../../pages/Perfil/Main.jsx";

vi.mock("../../components/Particles/Particles", () => ({
  default: () => null,
}));

beforeEach(() => {
  global.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({
      nombre: "Juan",
      apellidos: "Perez",
      dni: "12345678A",
      nickname: null,
      municipio: "M1",
      provincia: "P1",
      comunidad: "C1",
      nacion: "España",
    }),
  }));
});

describe("Perfil Main", () => {
  it("shows user data", async () => {
    render(<Main />);
    await waitFor(() => expect(screen.getByText("Juan")).toBeInTheDocument());
    expect(screen.getByText(/12345678A/)).toBeInTheDocument();
  });
});
