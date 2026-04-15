import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../../pages/CRUDVotations/Main.jsx";

vi.mock("../../services/xsrf", () => ({
  getXsrfToken: vi.fn(async () => "tok"),
}));

beforeEach(() => {
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => [
      {
        id: 1,
        txHash: "0x1",
        title: "T1",
        description: "",
        startDate: "2026-01-01T00:00:00.000000Z",
        endDate: "2026-12-01T00:00:00.000000Z",
        state: "active",
        startBlockHash: null,
        endBlockHash: null,
      },
    ],
  }));
});

describe("CRUDVotations Main", () => {
  it("loads votations table", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("T1")).toBeInTheDocument());
  });
});
