import { describe, expect, it, vi, beforeEach } from "vitest";

const { sharedFire } = vi.hoisted(() => ({ sharedFire: vi.fn() }));

vi.mock("sweetalert2", () => ({
  default: {
    mixin: vi.fn(() => ({ fire: sharedFire })),
  },
}));

import { popupConfirm, toastSuccess } from "../../services/alerts";

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
});
