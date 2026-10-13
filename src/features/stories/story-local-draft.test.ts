import {
  draftKey,
  readStoryDraft,
  removeStoryDraft,
  writeStoryDraft,
} from "./story-local-draft";
import type { StoryFormValues } from "./schema";

const values: StoryFormValues = {
  title: "A shipment in progress",
  slug: "",
  metaDescription: "",
  content: "<p>First notes</p>",
  pickupLocation: "",
  destination: "",
  shipmentType: "",
  serviceLine: "",
  shipmentStatus: "pending",
  imageAlt: "",
  isPublished: false,
  faqs: [{ question: "", answer: "" }],
};

describe("story local recovery", () => {
  beforeEach(() => localStorage.clear());

  it("scopes partial form drafts by account and story", () => {
    const key = draftKey("editor-1", "story-1");
    const draft = {
      version: 1 as const,
      savedAt: "2026-10-10T10:00:00.000Z",
      baseUpdatedAt: "2026-10-09T10:00:00.000Z",
      hadCoverFile: true,
      values,
    };

    expect(writeStoryDraft(key, draft)).toBe(true);
    expect(readStoryDraft(key)).toEqual(draft);
    expect(readStoryDraft(draftKey("editor-2", "story-1"))).toBeNull();
    expect(readStoryDraft(draftKey("editor-1", "story-2"))).toBeNull();
    removeStoryDraft(key);
    expect(readStoryDraft(key)).toBeNull();
  });

  it("ignores malformed or incompatible stored drafts", () => {
    const key = draftKey("editor", null);
    localStorage.setItem(key, JSON.stringify({ version: 2, values }));
    expect(readStoryDraft(key)).toBeNull();
    localStorage.setItem(key, "{invalid-json");
    expect(readStoryDraft(key)).toBeNull();
  });
});
