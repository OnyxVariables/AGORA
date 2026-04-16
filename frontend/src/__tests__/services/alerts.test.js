import { describe, expect, it, vi, beforeEach } from "vitest";

const { sharedFire } = vi.hoisted(() => ({ sharedFire: vi.fn() }));

vi.mock("sweetalert2", () => ({
  default: {
    mixin: vi.fn(() => ({ fire: sharedFire })),
  },
}));

import { popupConfirm, popupInfo, toastSuccess } from "../../services/alerts";

describe("alerts", () => {
  beforeEach(() => {
    sharedFire.mockReset();
  });

  it("toastSuccess triggers fire", async () => {
    sharedFire.mockResolvedValue({});
    await toastSuccess("ok");
    expect(sharedFire).toHaveBeenCalled();
  });

  it("popupConfirm returns false when not confirmed", async () => {
    sharedFire.mockResolvedValue({ isConfirmed: false });
    const r = await popupConfirm("t", "x");
    expect(r).toBe(false);
  });

  it("popupConfirm returns true when confirmed", async () => {
    sharedFire.mockResolvedValue({ isConfirmed: true });
    const r = await popupConfirm("t", "x");
    expect(r).toBe(true);
  });

  it("popupInfo triggers fire", async () => {
    sharedFire.mockResolvedValue({});
    await popupInfo("Titulo", "Texto");
    expect(sharedFire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "success", title: "Titulo", text: "Texto" }),
    );
  });
});
