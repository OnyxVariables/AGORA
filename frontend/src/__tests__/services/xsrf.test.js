import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getXsrfToken, readXsrfToken } from "../../services/xsrf";

function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
}

describe("xsrf", () => {
  beforeEach(() => {
    clearCookies();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    clearCookies();
    vi.unstubAllGlobals();
  });

  it("readXsrfToken returns empty when no cookie", () => {
    expect(readXsrfToken()).toBe("");
  });

  it("readXsrfToken decodes XSRF-TOKEN cookie", () => {
    document.cookie = "XSRF-TOKEN=abc%3D123";
    expect(readXsrfToken()).toBe("abc=123");
  });

  it("getXsrfToken returns existing cookie without fetch", async () => {
    document.cookie = "XSRF-TOKEN=hello";
    const t = await getXsrfToken();
    expect(t).toBe("hello");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("getXsrfToken fetches csrf cookie when missing", async () => {
    global.fetch.mockImplementation(async () => {
      document.cookie = "XSRF-TOKEN=fetched";
      return { ok: true };
    });
    const t = await getXsrfToken();
    expect(t).toBe("fetched");
    expect(fetch).toHaveBeenCalled();
  });
});
