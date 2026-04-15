import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useParties } from "../../data/partidos";

describe("useParties", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("maps API parties to UI shape", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: "P1",
          description: "d",
          code: "c1",
          image: "i.png",
          color_background: "#111",
          color_title: "#222",
        },
      ],
    });

    const { result } = renderHook(() => useParties());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.partidos).toHaveLength(1);
    expect(result.current.partidos[0].nombre).toBe("P1");
    expect(result.current.partidos[0].value).toBe("c1");
  });
});
