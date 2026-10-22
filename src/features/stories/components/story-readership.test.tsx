import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StoryReadership } from "./story-readership";
import type {
  AnalyticsDays,
  StoryAnalyticsReport,
} from "../story-analytics.schema";

jest.mock("@/lib/api", () => ({ api: { get: jest.fn() } }));
const get = jest.mocked(api.get);
const id = "507f1f77bcf86cd799439011";
const report = (
  days: AnalyticsDays = 30,
): { success: true; data: StoryAnalyticsReport } => ({
  success: true,
  data: {
    days,
    from: "2026-09-23T00:00:00.000Z",
    to: "2026-10-22T23:59:59.999Z",
    trackingStartedAt: "2026-10-20T23:30:00.000Z",
    stories: [
      {
        storyId: id,
        opens: 3,
        engaged: 2,
        completed: 1,
        daily: [{ date: "2026-10-21", opens: 3, engaged: 2, completed: 1 }],
      },
    ],
  },
});

function renderReadership() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <StoryReadership storyId={id} title="A useful shipment" />
    </QueryClientProvider>,
  );
}

beforeEach(() => get.mockReset());

it("loads on demand and shows UTC daily data and metric limits", async () => {
  get.mockResolvedValue({ data: report() });
  renderReadership();
  expect(get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /readership/i }));
  expect(
    await screen.findByRole("table", { name: /daily readership/i }),
  ).toBeInTheDocument();
  expect(screen.getByText("2026-10-21")).toBeInTheDocument();
  expect(
    screen.getByText(/Tracking started: 2026-10-20 UTC/),
  ).toBeInTheDocument();
  expect(screen.getByText(/Blocked or undelivered events/)).toBeInTheDocument();
  expect(screen.getByLabelText("Readership period")).toHaveValue("30");
  get.mockResolvedValue({ data: report(7) });
  fireEvent.change(screen.getByLabelText("Readership period"), {
    target: { value: "7" },
  });
  await waitFor(() =>
    expect(get).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ params: { days: 7 } }),
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /readership/i })).toHaveFocus(),
  );
});

it("offers retry on errors and never substitutes zero counts", async () => {
  get.mockRejectedValue(new Error("Readership temporarily unavailable."));
  renderReadership();
  fireEvent.click(screen.getByRole("button", { name: /readership/i }));
  expect(
    await screen.findByRole("alert", {}, { timeout: 4000 }),
  ).toHaveTextContent("Readership temporarily unavailable.");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  get.mockResolvedValue({ data: report() });
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("table")).toBeInTheDocument();
});

it("labels omitted records as unavailable", async () => {
  const response = report();
  response.data.stories = [];
  get.mockResolvedValue({ data: response });
  renderReadership();
  fireEvent.click(screen.getByRole("button", { name: /readership/i }));
  expect(
    await screen.findByText("Readership is unavailable for this story."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

it("reports unauthorized access distinctly", async () => {
  get.mockRejectedValue({ isAxiosError: true, response: { status: 403 } });
  renderReadership();
  fireEvent.click(screen.getByRole("button", { name: /readership/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "You do not have access to this action.",
  );
  expect(get).toHaveBeenCalledTimes(1);
});

it("shows recorded zeroes without implying historical readership is known", async () => {
  const response = report(90);
  response.data.stories = [
    { storyId: id, opens: 0, engaged: 0, completed: 0, daily: [] },
  ];
  response.data.trackingStartedAt = null;
  get.mockResolvedValue({ data: response });
  renderReadership();
  fireEvent.click(screen.getByRole("button", { name: /readership/i }));
  fireEvent.change(screen.getByLabelText("Readership period"), {
    target: { value: "90" },
  });
  expect(
    await screen.findByText("No opens recorded in this period."),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/No tracking events recorded yet/),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/historical readership is unavailable/),
  ).toBeInTheDocument();
});
