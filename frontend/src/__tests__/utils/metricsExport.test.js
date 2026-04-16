import { describe, expect, it, vi } from "vitest";
import {
  downloadTextFile,
  metricsBundleToCsv,
  metricsBundleToHtml,
} from "../../utils/metricsExport";

describe("metricsExport", () => {
  const minimalBundle = {
    votation: {
      id: 7,
      title: "Test",
      state: "active",
      startDate: "2026-01-01",
      endDate: null,
      txHash: "0xabc",
    },
    metrics: {
      votationId: 7,
      totalVotes: 2,
      registeredCitizens: 10,
      participationRate: 20,
      votesByParty: { 1: 2 },
    },
    votes: [
      {
        id: 1,
        voteHash: "0x" + "c".repeat(64),
        partyId: 1,
        partyName: "P",
        municipalityId: 1,
        blockHash: "0x" + "b".repeat(64),
        txHash: "0x" + "d".repeat(64),
        createdAt: "2026-01-02",
      },
    ],
    blocks: [
      {
        hash: "0x" + "b".repeat(64),
        blockNumber: 3,
        previousHash: null,
        transactions: 1,
        isValid: true,
      },
    ],
    audit: [],
  };

  it("metricsBundleToCsv includes BOM and votation title", () => {
    const csv = metricsBundleToCsv(minimalBundle);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("Test");
    expect(csv).toContain("totalVotes");
    expect(csv).toContain("0x" + "c".repeat(64));
  });

  it("metricsBundleToHtml escapes angle brackets", () => {
    const bundle = {
      ...minimalBundle,
      votation: { ...minimalBundle.votation, title: "A<B>" },
    };
    const html = metricsBundleToHtml(bundle);
    expect(html).toContain("A&lt;B&gt;");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("downloadTextFile triggers anchor click", () => {
    const click = vi.fn();
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") {
        return { click, href: "", download: "" };
      }
      return {};
    });

    downloadTextFile("hello", "t.txt", "text/plain");

    expect(click).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
