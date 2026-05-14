import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Partidos from "../../pages/Votar/Partidos";

vi.mock("../../components/Particles/Particles", () => ({
  default: () => null,
}));

vi.mock("../../data/partidos", () => ({
  useParties: () => ({
    partidos: [
      {
        id: 1,
        nombre: "Partido Uno",
        descripcion: "d",
        value: "PU",
        imagen: "x.png",
        colores: { fondo: "#fff", titulo: "#000" },
      },
    ],
    loading: false,
  }),
}));

describe("Partidos page", () => {
  it("renders party cards and submit", () => {
    render(<Partidos />);
    expect(screen.getByText("Partido Uno")).toBeInTheDocument();
    expect(screen.getByText("Enviar")).toBeInTheDocument();
  });
});
