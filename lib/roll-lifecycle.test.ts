import { describe, it, expect } from "vitest";
import {
  STATUS_ORDER,
  getNextStatus,
  getPrevStatus,
  ACTION_KEYS,
  getAdvanceFields,
  getUndoFields,
  STATUS_COLORS,
} from "./roll-lifecycle";
import { ROLL_STATUSES } from "./constants";
import type { RollStatus } from "./types";

describe("STATUS_ORDER", () => {
  it("contains the linear lifecycle statuses (excludes discarded)", () => {
    expect(STATUS_ORDER).toEqual([
      "loaded",
      "active",
      "finished",
      "developed",
      "scanned",
      "archived",
    ]);
  });

  it("is a subset of ROLL_STATUSES", () => {
    for (const s of STATUS_ORDER) {
      expect(ROLL_STATUSES).toContain(s);
    }
  });
});

describe("getNextStatus", () => {
  it("loaded -> active", () => {
    expect(getNextStatus("loaded")).toBe("active");
  });

  it("active -> finished", () => {
    expect(getNextStatus("active")).toBe("finished");
  });

  it("finished -> developed", () => {
    expect(getNextStatus("finished")).toBe("developed");
  });

  it("developed -> scanned", () => {
    expect(getNextStatus("developed")).toBe("scanned");
  });

  it("scanned -> archived", () => {
    expect(getNextStatus("scanned")).toBe("archived");
  });

  it("archived -> null (terminal status)", () => {
    expect(getNextStatus("archived")).toBeNull();
  });

  it("discarded -> null (terminal, not in linear lifecycle)", () => {
    expect(getNextStatus("discarded")).toBeNull();
  });

  it("unknown status -> null", () => {
    expect(getNextStatus("bogus" as RollStatus)).toBeNull();
  });
});

describe("getPrevStatus", () => {
  it("loaded -> null (first status)", () => {
    expect(getPrevStatus("loaded")).toBeNull();
  });

  it("active -> loaded", () => {
    expect(getPrevStatus("active")).toBe("loaded");
  });

  it("finished -> active", () => {
    expect(getPrevStatus("finished")).toBe("active");
  });

  it("developed -> finished", () => {
    expect(getPrevStatus("developed")).toBe("finished");
  });

  it("scanned -> developed", () => {
    expect(getPrevStatus("scanned")).toBe("developed");
  });

  it("archived -> scanned", () => {
    expect(getPrevStatus("archived")).toBe("scanned");
  });

  it("discarded -> null (terminal, not in linear lifecycle)", () => {
    expect(getPrevStatus("discarded")).toBeNull();
  });

  it("unknown status -> null", () => {
    expect(getPrevStatus("bogus" as RollStatus)).toBeNull();
  });
});

describe("ACTION_KEYS", () => {
  it("has keys for actionable transitions", () => {
    expect(ACTION_KEYS["finished"]).toBe("finish");
    expect(ACTION_KEYS["developed"]).toBe("develop");
    expect(ACTION_KEYS["scanned"]).toBe("scan");
    expect(ACTION_KEYS["archived"]).toBe("archive");
  });
});

describe("getAdvanceFields", () => {
  it("sets finish_date for finished", () => {
    const fields = getAdvanceFields("finished");
    expect(fields.status).toBe("finished");
    expect(fields.updated_at).toBeTypeOf("number");
    expect(fields.finish_date).toBeTypeOf("number");
    expect(fields.develop_date).toBeUndefined();
    expect(fields.scan_date).toBeUndefined();
  });

  it("sets develop_date for developed", () => {
    const fields = getAdvanceFields("developed");
    expect(fields.status).toBe("developed");
    expect(fields.develop_date).toBeTypeOf("number");
    expect(fields.finish_date).toBeUndefined();
  });

  it("sets scan_date for scanned", () => {
    const fields = getAdvanceFields("scanned");
    expect(fields.status).toBe("scanned");
    expect(fields.scan_date).toBeTypeOf("number");
  });

  it("sets no date field for active", () => {
    const fields = getAdvanceFields("active");
    expect(fields.status).toBe("active");
    expect(fields.finish_date).toBeUndefined();
    expect(fields.develop_date).toBeUndefined();
    expect(fields.scan_date).toBeUndefined();
  });

  it("always includes status and updated_at", () => {
    for (const s of ROLL_STATUSES) {
      const fields = getAdvanceFields(s);
      expect(fields.status).toBe(s);
      expect(fields.updated_at).toBeTypeOf("number");
    }
  });
});

describe("getUndoFields", () => {
  it("clears finish_date when undoing finished", () => {
    const fields = getUndoFields("finished", "active");
    expect(fields.status).toBe("active");
    expect(fields.finish_date).toBeNull();
  });

  it("clears develop_date, lab_name, dev_notes when undoing developed", () => {
    const fields = getUndoFields("developed", "finished");
    expect(fields.status).toBe("finished");
    expect(fields.develop_date).toBeNull();
    expect(fields.lab_name).toBeNull();
    expect(fields.dev_notes).toBeNull();
  });

  it("clears scan_date when undoing scanned", () => {
    const fields = getUndoFields("scanned", "developed");
    expect(fields.status).toBe("developed");
    expect(fields.scan_date).toBeNull();
  });

  it("clears no date fields when undoing active", () => {
    const fields = getUndoFields("active", "loaded");
    expect(fields.status).toBe("loaded");
    expect(fields.finish_date).toBeUndefined();
    expect(fields.develop_date).toBeUndefined();
    expect(fields.scan_date).toBeUndefined();
  });
});

describe("STATUS_COLORS", () => {
  it("has a mapping for every ROLL_STATUS", () => {
    for (const s of ROLL_STATUSES) {
      expect(STATUS_COLORS[s]).toBeDefined();
      expect(STATUS_COLORS[s].length).toBeGreaterThan(0);
    }
  });
});
