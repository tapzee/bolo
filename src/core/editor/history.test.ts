import { describe, expect, it } from "vitest";
import {
  canRedo,
  canUndo,
  initHistory,
  pushHistory,
  redo,
  undo,
} from "./history";

describe("history", () => {
  it("starts with nothing to undo or redo", () => {
    const h = initHistory("a");
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("undoes and redoes in order", () => {
    let h = initHistory("a");
    h = pushHistory(h, "b");
    h = pushHistory(h, "c");

    h = undo(h);
    expect(h.present).toBe("b");
    h = undo(h);
    expect(h.present).toBe("a");
    expect(canUndo(h)).toBe(false);

    h = redo(h);
    expect(h.present).toBe("b");
    h = redo(h);
    expect(h.present).toBe("c");
    expect(canRedo(h)).toBe(false);
  });

  it("ignores a push that changes nothing", () => {
    const h = initHistory("a");
    expect(pushHistory(h, "a")).toBe(h);
  });

  it("discards the redo branch once a new edit lands", () => {
    let h = initHistory("a");
    h = pushHistory(h, "b");
    h = undo(h);
    h = pushHistory(h, "c");

    expect(canRedo(h)).toBe(false);
    expect(h.present).toBe("c");
  });

  it("coalesces a run of edits with the same label into one undo step", () => {
    // Typing five characters into one word must be a single Cmd+Z.
    let h = initHistory("");
    for (const value of ["n", "na", "nam", "name"]) {
      h = pushHistory(h, value, { coalesceLabel: "text:0" });
    }

    expect(h.present).toBe("name");
    h = undo(h);
    expect(h.present).toBe("");
  });

  it("does not coalesce edits targeting different words", () => {
    let h = initHistory("start");
    h = pushHistory(h, "a", { coalesceLabel: "text:0" });
    h = pushHistory(h, "b", { coalesceLabel: "text:1" });

    h = undo(h);
    expect(h.present).toBe("a");
  });

  it("does not coalesce across an undo", () => {
    let h = initHistory("a");
    h = pushHistory(h, "b", { coalesceLabel: "text:0" });
    h = undo(h);
    h = pushHistory(h, "c", { coalesceLabel: "text:0" });

    // Would otherwise silently overwrite the step just undone past.
    h = undo(h);
    expect(h.present).toBe("a");
  });

  it("caps depth so a long session cannot grow without bound", () => {
    let h = initHistory(0);
    for (let i = 1; i <= 250; i += 1) h = pushHistory(h, i);

    expect(h.past.length).toBeLessThanOrEqual(100);
    expect(h.present).toBe(250);
  });
});
