import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StoryRichTextEditor } from "./story-rich-text-editor";
import { uploadStoryImage } from "../api/stories.api";

jest.mock("../api/stories.api", () => ({
  uploadStoryImage: jest.fn(),
}));

describe("story rich text editor", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers accessible formatting and preserves the document in preview", async () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <StoryRichTextEditor
        value="<p>Hello shipment</p>"
        onChange={onChange}
        preview={false}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Bold" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 words")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Story content" }),
    ).toHaveAttribute("contenteditable", "true");
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    rerender(
      <StoryRichTextEditor
        value="<p>Hello shipment</p>"
        onChange={onChange}
        preview
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: "Story content" }),
      ).toHaveAttribute("contenteditable", "false");
    });
    expect(screen.getByText("Hello shipment")).toBeInTheDocument();
  });

  it("validates image details and inserts the uploaded URL", async () => {
    jest
      .mocked(uploadStoryImage)
      .mockResolvedValue("https://images.example.com/story.jpg");
    const onChange = jest.fn();
    render(
      <StoryRichTextEditor value="" onChange={onChange} preview={false} />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Image" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert image" }));
    expect(
      screen.getByText("Describe the image for readers."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Image file"), {
      target: {
        files: [new File(["image"], "story.jpg", { type: "image/jpeg" })],
      },
    });
    fireEvent.change(screen.getByLabelText("Alt text"), {
      target: { value: "Vehicle on a carrier" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Insert image" }));

    await waitFor(() => expect(uploadStoryImage).toHaveBeenCalled());
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.stringContaining('alt="Vehicle on a carrier"'),
      );
    });
  });

  it("rejects unsafe links and adds an HTTPS link with visible text", async () => {
    const onChange = jest.fn();
    render(
      <StoryRichTextEditor value="" onChange={onChange} preview={false} />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Link" }));
    fireEvent.change(screen.getByLabelText("Link text"), {
      target: { value: "Track shipment" },
    });
    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save link" }));
    expect(
      screen.getByText("Enter an HTTP or HTTPS link."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: "https://example.com/track" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save link" }));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.stringContaining('href="https://example.com/track"'),
      );
    });
  });

  it("keeps the image dialog open when upload fails", async () => {
    jest
      .mocked(uploadStoryImage)
      .mockRejectedValue(new Error("Upload unavailable"));
    render(
      <StoryRichTextEditor value="" onChange={jest.fn()} preview={false} />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Image" }));
    fireEvent.change(screen.getByLabelText("Image file"), {
      target: {
        files: [new File(["image"], "story.jpg", { type: "image/jpeg" })],
      },
    });
    fireEvent.change(screen.getByLabelText("Alt text"), {
      target: { value: "Vehicle on a carrier" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Insert image" }));

    expect(await screen.findByText("Upload unavailable")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
