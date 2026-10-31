import { describe, expect, it } from "vitest";
import { paginate, parsePage } from "./paging";

const items = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

describe("parsePage", () => {
  it("reads a positive integer from the query string", () => {
    expect(parsePage("2")).toBe(2);
    expect(parsePage("10")).toBe(10);
  });

  it("falls back to the first page for missing or malformed values", () => {
    expect(parsePage(null)).toBe(1);
    expect(parsePage("")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
  });
});

describe("paginate", () => {
  it("slices the requested page", () => {
    expect(paginate(items, 1, 8)).toEqual({ page: 1, pageCount: 2, items: ["a", "b", "c", "d", "e", "f", "g", "h"] });
    expect(paginate(items, 2, 8)).toEqual({ page: 2, pageCount: 2, items: ["i"] });
  });

  it("is a single page when everything fits", () => {
    expect(paginate(["a", "b"], 1, 8)).toEqual({ page: 1, pageCount: 1, items: ["a", "b"] });
    expect(paginate([], 1, 8)).toEqual({ page: 1, pageCount: 1, items: [] });
  });

  it("clamps out-of-range pages to the last valid page", () => {
    expect(paginate(items, 7, 8)).toEqual({ page: 2, pageCount: 2, items: ["i"] });
    expect(paginate(items, 0, 8).page).toBe(1);
  });

  it("falls back to the last page when the current one empties out", () => {
    // Page 2 existed with 9 cases; after removing one, 8 cases fit on page 1.
    expect(paginate(items.slice(0, 8), 2, 8)).toEqual({ page: 1, pageCount: 1, items: items.slice(0, 8) });
  });
});
