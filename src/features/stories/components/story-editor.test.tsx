import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StoryEditor } from "./story-editor";
import { draftKey, writeStoryDraft } from "../story-local-draft";
import type { Story, StoryFormValues } from "../schema";

const mockSave = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "staff-1" } } }),
}));
jest.mock("../hooks/use-stories", () => ({
  useStoryActions: () => ({
    save: { mutateAsync: mockSave, isPending: false },
  }),
}));
jest.mock("./story-rich-text-editor", () => ({
  StoryRichTextEditor: ({
    value,
    onChange,
    preview,
  }: {
    value: string;
    onChange: (value: string) => void;
    preview: boolean;
  }) => (
    <textarea
      aria-label="Story content"
      value={value}
      readOnly={preview}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const formValues: StoryFormValues = {
  title: "Coast to coast delivery",
  slug: "coast-to-coast",
  metaDescription: "A careful vehicle delivery",
  content: "<p>Shipment details</p>",
  pickupLocation: "Dallas",
  destination: "Seattle",
  shipmentType: "Classic car",
  serviceLine: "vehicle",
  shipmentStatus: "delivered",
  imageAlt: "Vehicle on carrier",
  isPublished: false,
  faqs: [{ question: "How long?", answer: "Five days." }],
};

const story: Story = {
  ...formValues,
  serviceLine: "vehicle",
  _id: "story-1",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-09T00:00:00.000Z",
};

describe("story editorial workflow", () => {
  beforeEach(() => {
    localStorage.clear();
    mockSave.mockReset();
  });

  it("reviews the full unsaved story and returns to the form", () => {
    render(
      <StoryEditor story={story} onClose={jest.fn()} onSaved={jest.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Story title"), {
      target: { value: "Updated story title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review story" }));

    expect(screen.getByText("Updated story title")).toBeInTheDocument();
    expect(screen.getByText("Dallas")).toBeInTheDocument();
    expect(screen.getByText("Seattle")).toBeInTheDocument();
    expect(screen.getByText("How long?")).toBeInTheDocument();
    expect(screen.getByText("Five days.")).toBeInTheDocument();
    expect(screen.getByLabelText("Story content")).toHaveAttribute("readonly");

    fireEvent.click(screen.getByRole("button", { name: "Continue writing" }));
    expect(screen.getByLabelText("Story title")).toHaveValue(
      "Updated story title",
    );
  });

  it("converts manually entered slug spaces into hyphens", () => {
    render(
      <StoryEditor story={story} onClose={jest.fn()} onSaved={jest.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "SEO & Social" }));
    fireEvent.change(screen.getByLabelText("URL slug"), {
      target: { value: "Dallas to Seattle delivery" },
    });

    expect(screen.getByLabelText("URL slug")).toHaveValue(
      "dallas-to-seattle-delivery",
    );
  });

  it("fills a new story slug from its title until the editor customizes it", () => {
    render(<StoryEditor onClose={jest.fn()} onSaved={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Story title"), {
      target: { value: "Dallas to Seattle delivery" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEO & Social" }));

    expect(screen.getByLabelText("URL slug")).toHaveValue(
      "dallas-to-seattle-delivery",
    );
  });

  it("preserves a custom slug when the title changes", () => {
    render(<StoryEditor onClose={jest.fn()} onSaved={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Story title"), {
      target: { value: "Dallas to Seattle delivery" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEO & Social" }));
    fireEvent.change(screen.getByLabelText("URL slug"), {
      target: { value: "priority-route" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Narrative & Editor" }));
    fireEvent.change(screen.getByLabelText("Story title"), {
      target: { value: "Dallas to Miami delivery" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SEO & Social" }));

    expect(screen.getByLabelText("URL slug")).toHaveValue("priority-route");
  });

  it("offers recovery and flags a newer server version", async () => {
    writeStoryDraft(draftKey("staff-1", story._id), {
      version: 1,
      savedAt: "2026-10-10T00:00:00.000Z",
      baseUpdatedAt: "2026-10-08T00:00:00.000Z",
      hadCoverFile: true,
      values: { ...formValues, title: "Recovered headline" },
    });
    render(
      <StoryEditor story={story} onClose={jest.fn()} onSaved={jest.fn()} />,
    );

    expect(
      await screen.findByText(/The server story changed/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore version" }));
    expect(screen.getByLabelText("Story title")).toHaveValue(
      "Recovered headline",
    );
    expect(screen.getByText(/Re-select the cover image/)).toBeInTheDocument();
  });

  it("discards a local version without changing the server values", async () => {
    const key = draftKey("staff-1", story._id);
    writeStoryDraft(key, {
      version: 1,
      savedAt: "2026-10-10T00:00:00.000Z",
      baseUpdatedAt: story.updatedAt ?? null,
      hadCoverFile: false,
      values: { ...formValues, title: "Discard this headline" },
    });
    render(
      <StoryEditor story={story} onClose={jest.fn()} onSaved={jest.fn()} />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Discard version" }),
    );
    expect(screen.getByLabelText("Story title")).toHaveValue(story.title);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it("keeps a local draft when a server save fails", async () => {
    mockSave.mockRejectedValue(new Error("Server unavailable"));
    render(
      <StoryEditor story={story} onClose={jest.fn()} onSaved={jest.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Story title"), {
      target: { value: "Edited before failure" },
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("alert", { name: "" })).toHaveTextContent(
      "Server unavailable",
    );
    await waitFor(() => {
      expect(localStorage.getItem(draftKey("staff-1", story._id))).toContain(
        "Edited before failure",
      );
    });
  });

  it("removes a saved cover and sends the clearing value", async () => {
    mockSave.mockResolvedValue(story);
    render(
      <StoryEditor
        story={{ ...story, image: "https://example.com/cover.jpg" }}
        onClose={jest.fn()}
        onSaved={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({ image: "" }),
        }),
      ),
    );
  });

  it("opens the invalid section after saving from another tab", async () => {
    render(
      <StoryEditor
        story={{ ...story, destination: "" }}
        onClose={jest.fn()}
        onSaved={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "SEO & Social" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByLabelText("Destination")).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("flushes the newest fields before leaving the page", async () => {
    render(
      <StoryEditor story={story} onClose={jest.fn()} onSaved={jest.fn()} />,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled(),
    );
    fireEvent.change(screen.getByLabelText("Story title"), {
      target: { value: "Last keystroke before leaving" },
    });
    fireEvent(window, new Event("pagehide"));
    expect(localStorage.getItem(draftKey("staff-1", story._id))).toContain(
      "Last keystroke before leaving",
    );
  });

  it("preserves a pending recovery version when returning to the list", async () => {
    const key = draftKey("staff-1", story._id);
    writeStoryDraft(key, {
      version: 1,
      savedAt: "2026-10-10T00:00:00.000Z",
      baseUpdatedAt: story.updatedAt ?? null,
      hadCoverFile: false,
      values: { ...formValues, title: "Keep this recovery version" },
    });
    const onClose = jest.fn();
    render(<StoryEditor story={story} onClose={onClose} onSaved={jest.fn()} />);
    await screen.findByText(/An unsaved version is available/);
    fireEvent.click(screen.getByRole("button", { name: "Stories" }));
    expect(onClose).toHaveBeenCalled();
    expect(localStorage.getItem(key)).toContain("Keep this recovery version");
  });

  it("keeps the original edit version when a background refresh changes props", async () => {
    mockSave.mockResolvedValue(story);
    const props = { onClose: jest.fn(), onSaved: jest.fn() };
    const { rerender } = render(<StoryEditor story={story} {...props} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled(),
    );
    fireEvent.change(screen.getByLabelText("Story title"), {
      target: { value: "Unsaved version one edit" },
    });
    rerender(
      <StoryEditor
        story={{ ...story, updatedAt: "2026-10-12T00:00:00.000Z" }}
        {...props}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({ baseUpdatedAt: story.updatedAt }),
      ),
    );
  });
});
