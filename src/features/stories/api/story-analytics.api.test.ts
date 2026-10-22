import { api } from "@/lib/api";
import { getStoryAnalytics, listStoryAnalytics } from "./story-analytics.api";

jest.mock("@/lib/api", () => ({ api: { get: jest.fn() } }));
const get = jest.mocked(api.get);
const id = "507f1f77bcf86cd799439011";
const envelope = () => ({
  success: true,
  data: {
    days: 30,
    from: "2026-09-23T00:00:00.000Z",
    to: "2026-10-23T00:00:00.000Z",
    trackingStartedAt: null,
    stories: [{ storyId: id, opens: 3, engaged: 2, completed: 1, daily: [] }],
  },
});

beforeEach(() => get.mockReset());

it("returns validated counts without treating a missing story as zero", async () => {
  const response = envelope();
  response.data.stories = [];
  get.mockResolvedValue({ data: response });
  await expect(listStoryAnalytics([id], 30)).resolves.toMatchObject({
    stories: [],
  });
});

it("requests authenticated reports with cancellation and no extra CORS headers", async () => {
  get.mockResolvedValue({ data: envelope() });
  const signal = new AbortController().signal;
  await expect(getStoryAnalytics(id, 30, signal)).resolves.toMatchObject({
    days: 30,
  });
  expect(get).toHaveBeenCalledWith(
    `/real-shipment-stories/${id}/analytics`,
    expect.objectContaining({
      params: { days: 30 },
      signal,
    }),
  );
  expect(get.mock.calls[0][1]).not.toHaveProperty("headers");
});

it.each([
  [
    "negative counts",
    () => {
      const value = envelope();
      value.data.stories[0].opens = -1;
      return value;
    },
  ],
  [
    "impossible engagement",
    () => {
      const value = envelope();
      value.data.stories[0].engaged = 4;
      return value;
    },
  ],
  [
    "wrong range",
    () => {
      const value = envelope();
      value.data.days = 7;
      return value;
    },
  ],
  [
    "another story",
    () => {
      const value = envelope();
      value.data.stories[0].storyId = "507f1f77bcf86cd799439012";
      return value;
    },
  ],
])(
  "rejects %s rather than displaying misleading readership",
  async (_label, response) => {
    get.mockResolvedValue({ data: response() });
    await expect(getStoryAnalytics(id, 30)).rejects.toThrow(
      "Readership data is unavailable. Please try again.",
    );
  },
);

it("rejects invalid or excessive batches before requesting the backend", async () => {
  await expect(listStoryAnalytics(["bad-id"], 30)).rejects.toThrow();
  await expect(
    listStoryAnalytics(
      Array.from({ length: 51 }, (_, index) =>
        index.toString(16).padStart(24, "0"),
      ),
      30,
    ),
  ).rejects.toThrow();
  expect(get).not.toHaveBeenCalled();
});
