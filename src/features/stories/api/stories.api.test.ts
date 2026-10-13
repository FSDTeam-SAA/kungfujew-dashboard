import { api } from "@/lib/api";
import { listStories, saveStory, uploadStoryImage } from "./stories.api";
import type { StoryFormValues } from "../schema";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

const values: StoryFormValues = {
  title: "Test story",
  slug: "test-story",
  metaDescription: "A shipment",
  content: "Details",
  pickupLocation: "Texas",
  destination: "Florida",
  shipmentType: "vehicle",
  serviceLine: "vehicle",
  shipmentStatus: "pending",
  imageAlt: "",
  isPublished: false,
  faqs: [{ question: "When?", answer: "Soon." }],
};

describe("story API contract", () => {
  afterEach(() => jest.clearAllMocks());

  it("accepts the content API's raw pagination shape", async () => {
    jest.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
    });
    await expect(
      listStories({ page: 1, isPublished: "all" }),
    ).resolves.toMatchObject({ data: [] });
    expect(api.get).toHaveBeenCalledWith("/real-shipment-stories", {
      params: { page: 1, isPublished: "all", limit: 10, summary: true },
    });
  });

  it("sends FAQ data and publication state in multipart form data", async () => {
    jest.mocked(api.post).mockResolvedValue({
      data: { success: true, data: { _id: "id", ...values } },
    });
    await saveStory(values);
    const body = jest.mocked(api.post).mock.calls[0][1];
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("faqs")).toBe(JSON.stringify(values.faqs));
    expect((body as FormData).get("isPublished")).toBe("false");
  });

  it("uploads an inline image using the existing story endpoint", async () => {
    jest.mocked(api.post).mockResolvedValue({
      data: { success: true, url: "https://images.example.com/story.jpg" },
    });
    const file = new File(["image"], "story.jpg", { type: "image/jpeg" });

    await expect(uploadStoryImage(file)).resolves.toBe(
      "https://images.example.com/story.jpg",
    );
    expect(api.post).toHaveBeenCalledWith(
      "/real-shipment-stories/upload-image",
      expect.any(FormData),
    );
    const body = jest.mocked(api.post).mock.calls[0][1] as FormData;
    expect(body.get("image")).toBe(file);
  });

  it("rejects an invalid inline image response", async () => {
    jest.mocked(api.post).mockResolvedValue({
      data: { success: true, url: "javascript:alert(1)" },
    });
    await expect(
      uploadStoryImage(new File(["x"], "story.png", { type: "image/png" })),
    ).rejects.toThrow();
  });

  it("sends explicit image removal and the original server version on updates", async () => {
    jest.mocked(api.put).mockResolvedValue({
      data: { success: true, data: { _id: "id", ...values, image: "" } },
    });
    const version = "2026-10-12T00:00:00.000Z";
    await saveStory({ ...values, image: "" }, "id", null, version);
    const body = jest.mocked(api.put).mock.calls[0][1] as FormData;
    expect(body.get("image")).toBe("");
    expect(body.get("baseUpdatedAt")).toBe(version);
  });
});
