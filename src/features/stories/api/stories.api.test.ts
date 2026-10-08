import { api } from "@/lib/api";
import { listStories, saveStory } from "./stories.api";
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
      params: { page: 1, isPublished: "all", limit: 10 },
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
});
