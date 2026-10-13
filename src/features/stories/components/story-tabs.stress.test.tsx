import * as React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useForm, FormProvider, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { generateSlug, SeoSocialTab } from "./tabs/seo-social-tab";
import { FaqsTab } from "./tabs/faqs-tab";
import { NarrativeTab } from "./tabs/narrative-tab";
import { ShipmentDetailsTab } from "./tabs/shipment-details-tab";
import { StoryEditorHeader } from "./story-editor-header";
import { StoryEditorSkeleton } from "./story-editor-skeleton";
import { storyFormSchema, type StoryFormValues } from "../schema";

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
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const defaultValues: StoryFormValues = {
  title: "Cross Country Logistics Mastery",
  slug: "cross-country-logistics-mastery",
  metaDescription:
    "An in-depth case study exploring enclosed vehicle transport from Miami to Seattle with guaranteed on-time delivery.",
  content: "<p>Shipment narrative details</p>",
  pickupLocation: "Miami, FL",
  destination: "Seattle, WA",
  shipmentType: "Enclosed Carrier (Ferrari 488)",
  serviceLine: "vehicle",
  shipmentStatus: "delivered",
  imageAlt: "Exotic car strapped in enclosed trailer",
  isPublished: false,
  faqs: [
    {
      question: "How long did transit take?",
      answer: "Total transit was 4 days.",
    },
    {
      question: "Was insurance included?",
      answer: "Full cargo coverage up to $1M.",
    },
  ],
};

function TestFormWrapper({
  initialValues = defaultValues,
  children,
}: {
  initialValues?: Partial<StoryFormValues>;
  children: (
    form: ReturnType<typeof useForm<StoryFormValues>>,
  ) => React.ReactNode;
}) {
  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
    mode: "onChange",
  });

  return <FormProvider {...form}>{children(form)}</FormProvider>;
}

describe("Empirical Stress Testing: generateSlug", () => {
  it("handles standard alphanumeric titles", () => {
    expect(generateSlug("Coast to Coast Classic Haul (2026)")).toBe(
      "coast-to-coast-classic-haul-2026",
    );
    expect(generateSlug("Cross Country Freight")).toBe("cross-country-freight");
    expect(generateSlug("Heavy Equipment: CAT D6 Bulldozer")).toBe(
      "heavy-equipment-cat-d6-bulldozer",
    );
  });

  it("handles multiple hyphens, leading, and trailing hyphens", () => {
    expect(generateSlug("---test---slug---")).toBe("test-slug");
    expect(generateSlug("-leading-and-trailing-")).toBe("leading-and-trailing");
    expect(generateSlug("middle----multiple-----hyphens")).toBe(
      "middle-multiple-hyphens",
    );
  });

  it("handles whitespace variations: tabs, newlines, multiple spaces, underscores", () => {
    expect(generateSlug("hello   world")).toBe("hello-world");
    expect(generateSlug("hello\t\nworld")).toBe("hello-world");
    expect(generateSlug("under_score_test")).toBe("under-score-test");
    expect(generateSlug("   trimmed   start   end   ")).toBe(
      "trimmed-start-end",
    );
  });

  it("handles special characters and symbols", () => {
    expect(generateSlug("Haul $500,000 & 100% On-Time! (NY -> LA) #1")).toBe(
      "haul-500000-100-on-time-ny-la-1",
    );
    expect(generateSlug("Special @#$% Characters!???")).toBe(
      "special-characters",
    );
    expect(generateSlug("\"Quotes\" & 'Apostrophes'")).toBe(
      "quotes-apostrophes",
    );
  });

  it("handles empty strings and whitespace-only strings", () => {
    expect(generateSlug("")).toBe("");
    expect(generateSlug("   ")).toBe("");
    expect(generateSlug("\t\n")).toBe("");
  });

  it("handles emoji and non-Latin unicode characters", () => {
    // Emoji characters
    expect(generateSlug("Delivery 🚀 Fast!")).toBe("delivery-fast");
    expect(generateSlug("🔥📦🚀")).toBe("");

    // Non-Latin characters (ASCII-only regex strips non-ASCII)
    expect(generateSlug("你好世界")).toBe("");
    expect(generateSlug("Привет мир")).toBe("");
    expect(generateSlug("مرحبا")).toBe("");
    expect(generateSlug("שלום עולם")).toBe("");
  });
});

describe("Empirical Component Stress Testing: SeoSocialTab", () => {
  it("renders slug and SEO configuration fields", () => {
    render(
      <TestFormWrapper>
        {(form) => <SeoSocialTab form={form} />}
      </TestFormWrapper>,
    );

    expect(screen.getByLabelText("URL Slug")).toBeInTheDocument();
    expect(screen.getByLabelText("Meta Description")).toBeInTheDocument();
    expect(
      screen.getByText("Search Engine Optimization (SEO)"),
    ).toBeInTheDocument();
  });

  it("generates slug from current title upon clicking 'Generate slug'", async () => {
    render(
      <TestFormWrapper
        initialValues={{ title: "New Exotic Car Delivery 2026!", slug: "" }}
      >
        {(form) => <SeoSocialTab form={form} />}
      </TestFormWrapper>,
    );

    const generateBtn = screen.getByRole("button", { name: /Generate slug/i });
    const slugInput = screen.getByLabelText("URL Slug");

    expect(slugInput).toHaveValue("");

    await act(async () => {
      fireEvent.click(generateBtn);
    });

    expect(slugInput).toHaveValue("new-exotic-car-delivery-2026");
  });

  it("shows error when clicking 'Generate slug' with empty title", async () => {
    render(
      <TestFormWrapper initialValues={{ title: "", slug: "" }}>
        {(form) => <SeoSocialTab form={form} />}
      </TestFormWrapper>,
    );

    const generateBtn = screen.getByRole("button", { name: /Generate slug/i });

    await act(async () => {
      fireEvent.click(generateBtn);
    });

    expect(
      screen.getByText("Enter a story title first to generate a slug"),
    ).toBeInTheDocument();
  });

  it("sets empty slug when title consists purely of emoji or unsupported characters", async () => {
    render(
      <TestFormWrapper
        initialValues={{ title: "🚀🔥📦", slug: "existing-slug" }}
      >
        {(form) => <SeoSocialTab form={form} />}
      </TestFormWrapper>,
    );

    const generateBtn = screen.getByRole("button", { name: /Generate slug/i });
    const slugInput = screen.getByLabelText("URL Slug");

    await act(async () => {
      fireEvent.click(generateBtn);
    });

    // generateSlug("🚀🔥📦") returns ""
    expect(slugInput).toHaveValue("");
  });

  it("evaluates meta description character counter thresholds: 0, 149, 150, 160, 161", async () => {
    let testForm: ReturnType<typeof useForm<StoryFormValues>> | null = null;

    render(
      <TestFormWrapper initialValues={{ metaDescription: "" }}>
        {(form) => {
          testForm = form;
          return <SeoSocialTab form={form} />;
        }}
      </TestFormWrapper>,
    );

    const textarea = screen.getByLabelText("Meta Description");

    // 0 characters threshold
    expect(screen.getByText("0 / 160 characters")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Recommended: 150–160 characters for search engine snippets.",
      ),
    ).toBeInTheDocument();

    // 149 characters threshold (too short by 1 char)
    const text149 = "a".repeat(149);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: text149 } });
    });
    expect(screen.getByText("149 / 160 characters")).toBeInTheDocument();
    expect(
      screen.getByText(
        "1 more characters recommended for ideal Google SERP display.",
      ),
    ).toBeInTheDocument();

    // 150 characters threshold (optimal min)
    const text150 = "a".repeat(150);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: text150 } });
    });
    expect(screen.getByText("150 / 160 characters")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Optimal length! Fits search snippet guidelines without truncation.",
      ),
    ).toBeInTheDocument();

    // 160 characters threshold (optimal max)
    const text160 = "a".repeat(160);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: text160 } });
    });
    expect(screen.getByText("160 / 160 characters")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Optimal length! Fits search snippet guidelines without truncation.",
      ),
    ).toBeInTheDocument();

    // 161 characters threshold (too long by 1 char)
    const text161 = "a".repeat(161);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: text161 } });
    });
    expect(screen.getByText("161 / 160 characters")).toBeInTheDocument();
    expect(
      screen.getByText(
        "1 characters over 160. Google may truncate text with an ellipsis (…).",
      ),
    ).toBeInTheDocument();
  });

  it("toggles between Google SERP and Social Card previews", async () => {
    render(
      <TestFormWrapper>
        {(form) => <SeoSocialTab form={form} />}
      </TestFormWrapper>,
    );

    expect(
      screen.getByText("Google Search Snippet (Desktop / Mobile)"),
    ).toBeInTheDocument();

    const socialTabBtn = screen.getByRole("button", { name: /Social Card/i });
    await act(async () => {
      fireEvent.click(socialTabBtn);
    });

    expect(screen.getByText("Social share banner preview")).toBeInTheDocument();
    expect(screen.getByText("kungfujew.com")).toBeInTheDocument();

    const serpTabBtn = screen.getByRole("button", { name: /Google SERP/i });
    await act(async () => {
      fireEvent.click(serpTabBtn);
    });

    expect(
      screen.getByText("Google Search Snippet (Desktop / Mobile)"),
    ).toBeInTheDocument();
  });
});

describe("Empirical Component Stress Testing: FaqsTab", () => {
  it("renders empty state when faqs is empty and allows adding first FAQ", async () => {
    render(
      <TestFormWrapper initialValues={{ faqs: [] }}>
        {(form) => <FaqsTab form={form} />}
      </TestFormWrapper>,
    );

    expect(
      screen.getByText("No Frequently Asked Questions Yet"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 FAQs")).toBeInTheDocument();

    const addFirstBtn = screen.getByRole("button", { name: /Add First FAQ/i });
    await act(async () => {
      fireEvent.click(addFirstBtn);
    });

    expect(
      screen.queryByText("No Frequently Asked Questions Yet"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 FAQ")).toBeInTheDocument();
    expect(screen.getByLabelText("Question")).toBeInTheDocument();
    expect(screen.getByLabelText("Answer")).toBeInTheDocument();
  });

  it("allows reordering and removing FAQ items", async () => {
    let formRef: UseFormReturn<StoryFormValues> | undefined;

    render(
      <TestFormWrapper
        initialValues={{
          faqs: [
            { question: "First Question?", answer: "First Answer" },
            { question: "Second Question?", answer: "Second Answer" },
          ],
        }}
      >
        {(form) => {
          formRef = form;
          return <FaqsTab form={form} />;
        }}
      </TestFormWrapper>,
    );

    expect(screen.getByText("2 FAQs")).toBeInTheDocument();

    // Check reorder buttons
    const moveDownButtons = screen.getAllByTitle("Move question down");
    const moveUpButtons = screen.getAllByTitle("Move question up");

    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveDownButtons[0]).not.toBeDisabled();
    expect(moveUpButtons[1]).not.toBeDisabled();
    expect(moveDownButtons[1]).toBeDisabled();

    // Click Move Down on the first question
    await act(async () => {
      fireEvent.click(moveDownButtons[0]);
    });

    // Verify form values swapped
    const currentFaqs = (
      formRef as unknown as UseFormReturn<StoryFormValues>
    ).getValues("faqs");
    expect(currentFaqs?.[0]?.question).toBe("Second Question?");
    expect(currentFaqs?.[1]?.question).toBe("First Question?");

    // Remove the first item
    const removeButtons = screen.getAllByTitle("Remove question");
    await act(async () => {
      fireEvent.click(removeButtons[0]);
    });

    expect(
      (formRef as unknown as UseFormReturn<StoryFormValues>).getValues("faqs")
        ?.length,
    ).toBe(1);
    expect(
      (formRef as unknown as UseFormReturn<StoryFormValues>).getValues(
        "faqs",
      )?.[0]?.question,
    ).toBe("First Question?");

    // Remove the remaining item -> should return to empty state
    const remainingRemoveButtons = screen.getAllByTitle("Remove question");
    await act(async () => {
      fireEvent.click(remainingRemoveButtons[0]);
    });

    expect(
      screen.getByText("No Frequently Asked Questions Yet"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 FAQs")).toBeInTheDocument();
  });

  it("stress tests multi-step reordering with 3 FAQ items", async () => {
    let formRef: UseFormReturn<StoryFormValues> | undefined;

    render(
      <TestFormWrapper
        initialValues={{
          faqs: [
            { question: "Q1", answer: "A1" },
            { question: "Q2", answer: "A2" },
            { question: "Q3", answer: "A3" },
          ],
        }}
      >
        {(form) => {
          formRef = form;
          return <FaqsTab form={form} />;
        }}
      </TestFormWrapper>,
    );

    expect(screen.getByText("3 FAQs")).toBeInTheDocument();

    const getFaqs = () =>
      (formRef as unknown as UseFormReturn<StoryFormValues>)
        .getValues("faqs")
        .map((f) => f.question);

    // Initial order: Q1, Q2, Q3
    expect(getFaqs()).toEqual(["Q1", "Q2", "Q3"]);

    // Move middle item (Q2) up -> order should become Q2, Q1, Q3
    const moveUpButtons = screen.getAllByTitle("Move question up");
    await act(async () => {
      fireEvent.click(moveUpButtons[1]);
    });
    expect(getFaqs()).toEqual(["Q2", "Q1", "Q3"]);

    // Move middle item (now Q1) down -> order should become Q2, Q3, Q1
    const moveDownButtons = screen.getAllByTitle("Move question down");
    await act(async () => {
      fireEvent.click(moveDownButtons[1]);
    });
    expect(getFaqs()).toEqual(["Q2", "Q3", "Q1"]);
  });
});

describe("Empirical Component Stress Testing: StoryEditorHeader", () => {
  it("renders status badge and actions based on props", () => {
    const handleTogglePreview = jest.fn();
    const handleClose = jest.fn();
    const handleSave = jest.fn();

    render(
      <TestFormWrapper
        initialValues={{ isPublished: false, title: "Custom Headline" }}
      >
        {(form) => (
          <StoryEditorHeader
            control={form.control}
            isEditing={false}
            isPending={false}
            preview={false}
            onTogglePreview={handleTogglePreview}
            onClose={handleClose}
            recoveryStatus="ready"
            onSave={handleSave}
          />
        )}
      </TestFormWrapper>,
    );

    // Title and status badge
    expect(screen.getByText("Custom Headline")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getAllByText("Draft saved locally").length).toBeGreaterThan(
      0,
    );

    // Review story button
    const reviewBtn = screen.getByRole("button", { name: /Review story/i });
    expect(reviewBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(reviewBtn);
    expect(handleTogglePreview).toHaveBeenCalledTimes(1);

    // Back button
    const backBtn = screen.getByRole("button", { name: /Stories/i });
    fireEvent.click(backBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Save draft button
    const saveBtn = screen.getByRole("button", { name: /Save draft/i });
    fireEvent.click(saveBtn);
    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  it("handles preview=true button state", () => {
    const handleToggle = jest.fn();

    render(
      <TestFormWrapper>
        {(form) => (
          <StoryEditorHeader
            control={form.control}
            isEditing={false}
            isPending={false}
            preview={true}
            onTogglePreview={handleToggle}
            onClose={jest.fn()}
            recoveryStatus="idle"
          />
        )}
      </TestFormWrapper>,
    );

    const continueBtn = screen.getByRole("button", {
      name: /Continue writing/i,
    });
    expect(continueBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(continueBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("reflects published status and editing modes on save button", () => {
    // Mode A: isPublished: true, isEditing: false -> "Publish story"
    const { rerender } = render(
      <TestFormWrapper initialValues={{ isPublished: true }}>
        {(form) => (
          <StoryEditorHeader
            control={form.control}
            isEditing={false}
            isPending={false}
            preview={false}
            onTogglePreview={jest.fn()}
            onClose={jest.fn()}
            recoveryStatus="saved"
          />
        )}
      </TestFormWrapper>,
    );
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Publish story/i }),
    ).toBeInTheDocument();

    // Mode B: isPublished: true, isEditing: true -> "Save changes"
    rerender(
      <TestFormWrapper initialValues={{ isPublished: true }}>
        {(form) => (
          <StoryEditorHeader
            control={form.control}
            isEditing={true}
            isPending={false}
            preview={false}
            onTogglePreview={jest.fn()}
            onClose={jest.fn()}
            recoveryStatus="saved"
          />
        )}
      </TestFormWrapper>,
    );
    expect(
      screen.getByRole("button", { name: /Save changes/i }),
    ).toBeInTheDocument();

    // Mode C: isPending: true -> Disabled and "Saving…"
    rerender(
      <TestFormWrapper initialValues={{ isPublished: true }}>
        {(form) => (
          <StoryEditorHeader
            control={form.control}
            isEditing={true}
            isPending={true}
            preview={false}
            onTogglePreview={jest.fn()}
            onClose={jest.fn()}
            recoveryStatus="saved"
          />
        )}
      </TestFormWrapper>,
    );
    const pendingBtn = screen.getByRole("button", { name: /Saving…/i });
    expect(pendingBtn).toBeDisabled();
  });

  it("displays different recovery status indicators", () => {
    const statuses = [
      { status: "stale" as const, text: "Newer server version" },
      { status: "pending" as const, text: "Saving draft…" },
      { status: "unavailable" as const, text: "Local backup offline" },
      { status: "idle" as const, isDirty: false, text: "All changes saved" },
      { status: "idle" as const, isDirty: true, text: "Unsaved changes" },
    ];

    for (const item of statuses) {
      const { unmount } = render(
        <TestFormWrapper>
          {(form) => (
            <StoryEditorHeader
              control={form.control}
              isEditing={false}
              isPending={false}
              preview={false}
              onTogglePreview={jest.fn()}
              onClose={jest.fn()}
              recoveryStatus={item.status}
              isDirty={item.isDirty}
            />
          )}
        </TestFormWrapper>,
      );
      expect(screen.getAllByText(item.text).length).toBeGreaterThan(0);
      unmount();
    }
  });

  it("sets submit type and form attribute when formId is provided", () => {
    render(
      <TestFormWrapper>
        {(form) => (
          <StoryEditorHeader
            control={form.control}
            isEditing={false}
            isPending={false}
            preview={false}
            onTogglePreview={jest.fn()}
            onClose={jest.fn()}
            recoveryStatus="idle"
            formId="story-form-id"
          />
        )}
      </TestFormWrapper>,
    );

    const saveBtn = screen.getByRole("button", { name: /Save draft/i });
    expect(saveBtn).toHaveAttribute("type", "submit");
    expect(saveBtn).toHaveAttribute("form", "story-form-id");
  });
});

describe("Empirical Component Stress Testing: NarrativeTab & ShipmentDetailsTab & Skeleton", () => {
  it("renders NarrativeTab with coverFile, remove action, and reselection callout", async () => {
    const handleCoverChange = jest.fn();
    const mockFile = new File(["binary-content"], "carrier-trailer.jpg", {
      type: "image/jpeg",
    });

    const { rerender } = render(
      <TestFormWrapper>
        {(form) => (
          <NarrativeTab
            form={form}
            coverFile={mockFile}
            onCoverChange={handleCoverChange}
            coverPreviewUrl="blob:http://localhost/blob-123"
            preview={false}
          />
        )}
      </TestFormWrapper>,
    );

    // New file ready badge and file name
    expect(screen.getByText("New file ready")).toBeInTheDocument();
    expect(screen.getByText("carrier-trailer.jpg")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Replace/i }),
    ).toBeInTheDocument();

    // Click remove button
    const removeBtn = screen.getByRole("button", { name: /Remove/i });
    fireEvent.click(removeBtn);
    expect(handleCoverChange).toHaveBeenCalledWith(null);

    // Reselection alert state
    rerender(
      <TestFormWrapper>
        {(form) => (
          <NarrativeTab
            form={form}
            coverFile={null}
            onCoverChange={handleCoverChange}
            coverPreviewUrl={null}
            preview={false}
            coverNeedsReselection={true}
          />
        )}
      </TestFormWrapper>,
    );

    expect(
      screen.getByText("Re-select the cover image from the restored draft."),
    ).toBeInTheDocument();
  });

  it("renders NarrativeTab in edit mode and preview mode", () => {
    const handleCoverChange = jest.fn();

    // Edit mode
    const { rerender } = render(
      <TestFormWrapper>
        {(form) => (
          <NarrativeTab
            form={form}
            coverFile={null}
            onCoverChange={handleCoverChange}
            coverPreviewUrl={null}
            preview={false}
          />
        )}
      </TestFormWrapper>,
    );

    expect(screen.getByLabelText("Story title")).toBeInTheDocument();
    expect(screen.getByText("Click to upload cover photo")).toBeInTheDocument();
    expect(screen.getByLabelText("Image alt text")).toBeInTheDocument();

    // Preview mode
    rerender(
      <TestFormWrapper>
        {(form) => (
          <NarrativeTab
            form={form}
            coverFile={null}
            onCoverChange={handleCoverChange}
            coverPreviewUrl={null}
            preview={true}
          />
        )}
      </TestFormWrapper>,
    );

    expect(
      screen.getByText("Cross Country Logistics Mastery"),
    ).toBeInTheDocument();
    expect(screen.getByText("No cover image selected")).toBeInTheDocument();
    expect(screen.getByText("Miami, FL")).toBeInTheDocument();
    expect(screen.getByText("Seattle, WA")).toBeInTheDocument();
    expect(screen.getByText("Common questions")).toBeInTheDocument();
  });

  it("renders ShipmentDetailsTab and updates live route banner", async () => {
    render(
      <TestFormWrapper>
        {(form) => <ShipmentDetailsTab form={form} />}
      </TestFormWrapper>,
    );

    expect(screen.getByLabelText("Pickup location")).toHaveValue("Miami, FL");
    expect(screen.getByLabelText("Destination")).toHaveValue("Seattle, WA");
    expect(
      screen.getByText("Transport Route & Classification"),
    ).toBeInTheDocument();

    // Verify route banner
    expect(screen.getByText("Miami, FL")).toBeInTheDocument();
    expect(screen.getByText("Seattle, WA")).toBeInTheDocument();

    // Change pickup location
    const pickupInput = screen.getByLabelText("Pickup location");
    await act(async () => {
      fireEvent.change(pickupInput, { target: { value: "Houston, TX" } });
    });

    expect(screen.getByText("Houston, TX")).toBeInTheDocument();
  });

  it("renders StoryEditorSkeleton without throwing and with accessible status role", () => {
    render(<StoryEditorSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByText("Loading shipment story editor…"),
    ).toBeInTheDocument();
  });
});
