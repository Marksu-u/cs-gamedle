import { describe, expect, it } from "vitest";
import {
  availableLengths,
  dailyTags,
  getGroup,
  isValidGuess,
  practiceTags,
  pickRandom,
} from "./selection";
import { SLOT_COUNT, type WordleData } from "./types";

const data: WordleData = {
  game: "test",
  words: { "3": ["CAT", "DOG", "BAT"], "5": ["HELLO"] },
};

describe("availableLengths", () => {
  it("retourne les longueurs triées (numériques)", () => {
    expect(availableLengths(data)).toEqual([3, 5]);
  });
});

describe("getGroup", () => {
  it("retourne le groupe demandé", () => {
    expect(getGroup(data, 3)).toEqual(["CAT", "DOG", "BAT"]);
  });
  it("retourne [] pour une longueur absente", () => {
    expect(getGroup(data, 4)).toEqual([]);
  });
});

describe("isValidGuess", () => {
  it("vrai si le mot est dans le groupe (insensible à la casse)", () => {
    expect(isValidGuess(getGroup(data, 3), "cat")).toBe(true);
  });
  it("faux sinon", () => {
    expect(isValidGuess(getGroup(data, 3), "XYZ")).toBe(false);
  });
});

describe("pickRandom", () => {
  it("retourne un élément du groupe", () => {
    const group = getGroup(data, 3);
    expect(group).toContain(pickRandom(group));
  });
  it("évite le mot exclu quand c'est possible", () => {
    expect(pickRandom(["A", "B"], "A")).toBe("B");
  });
  it("garde-fou : retourne quand même l'unique mot si tout est exclu", () => {
    expect(pickRandom(["A"], "A")).toBe("A");
  });
});

// A dictionary wide enough for the daily draw: it consumes SLOT_COUNT tags a day
// (one more when the leak guard has to drop one).
const dico: WordleData = {
  game: "test",
  words: {
    "3": Array.from({ length: 20 }, (_, i) => `A${String(i).padStart(2, "0")}`),
    "4": Array.from({ length: 20 }, (_, i) => `B${String(i).padStart(3, "0")}`),
    "5": Array.from({ length: 20 }, (_, i) => `C${String(i).padStart(4, "0")}`),
  },
};

describe("dailyTags", () => {
  it("serves one tag per slot", () => {
    expect(dailyTags(dico, 30)).toHaveLength(SLOT_COUNT);
  });

  it("never repeats a tag inside a day", () => {
    for (let day = 0; day < 200; day++) {
      const tags = dailyTags(dico, day);
      expect(new Set(tags).size).toBe(tags.length);
    }
  });

  it("is stable for a given day", () => {
    expect(dailyTags(dico, 30)).toEqual(dailyTags(dico, 30));
  });

  it("moves from one day to the next", () => {
    expect(dailyTags(dico, 30)).not.toEqual(dailyTags(dico, 31));
  });

  it("draws from the dictionary and nowhere else", () => {
    const tous = new Set(Object.values(dico.words).flat());
    for (const tag of dailyTags(dico, 30)) expect(tous.has(tag)).toBe(true);
  });

  it("leaves out the excluded tag", () => {
    // The day's Guessr answer must not also be a Wordle answer: solving one
    // would hand over the other. The two games draw on independent streams, so
    // nothing rules the collision out on its own.
    const victime = dailyTags(dico, 30)[2];
    const sans = dailyTags(dico, 30, victime);
    expect(sans).not.toContain(victime);
    expect(sans).toHaveLength(SLOT_COUNT);
  });

  it("still serves a full day when the excluded tag was never drawn", () => {
    const tags = dailyTags(dico, 30, "PAS-UN-PSEUDO");
    expect(tags).toEqual(dailyTags(dico, 30));
  });
});

describe("practiceTags", () => {
  it("serves SLOT_COUNT distinct tags", () => {
    const tags = practiceTags(dico);
    expect(tags).toHaveLength(SLOT_COUNT);
    expect(new Set(tags).size).toBe(SLOT_COUNT);
  });

  it("varies from call to call", () => {
    expect(practiceTags(dico).join()).not.toBe(practiceTags(dico).join());
  });

  it("avoids the tags it was told to skip", () => {
    const dejaVus = practiceTags(dico);
    const suivants = practiceTags(dico, dejaVus);
    for (const tag of suivants) expect(dejaVus).not.toContain(tag);
  });
});
