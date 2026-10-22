import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { StoryCoverEditor } from "./story-cover-editor";

function Preview() {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  return (
    <StoryCoverEditor
      src="https://example.com/cover.jpg"
      alt="A truck"
      position={position}
      onPositionChange={setPosition}
      onRemove={jest.fn()}
    />
  );
}

function pointer(type: string, y: number) {
  return Object.assign(new Event(type, { bubbles: true }), {
    pointerId: 1,
    button: 0,
    isPrimary: true,
    clientX: 100,
    clientY: y,
  });
}

it("drags within the real crop overflow and resets both preview coordinates", async () => {
  render(<Preview />);
  fireEvent.click(screen.getByRole("button", { name: "Reposition image" }));
  const crop = screen.getByRole("group", { name: "Wide card crop" });
  const image = screen.getByRole("img", { name: "A truck" });
  Object.defineProperties(image, {
    naturalWidth: { value: 800 },
    naturalHeight: { value: 400 },
  });
  await act(async () => {
    fireEvent.load(image);
  });
  crop.getBoundingClientRect = () => ({
    width: 400,
    height: 175,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 400,
    bottom: 175,
    toJSON: () => ({}),
  });
  crop.setPointerCapture = jest.fn();
  fireEvent(crop, pointer("pointerdown", 100));
  fireEvent(crop, pointer("pointermove", 125));
  expect(image).toHaveStyle({ objectPosition: "50% 0%" });
  expect(crop.setPointerCapture).toHaveBeenCalledWith(1);
  fireEvent(crop, pointer("pointerup", 125));
  fireEvent(crop, pointer("pointermove", 50));
  expect(image).toHaveStyle({ objectPosition: "50% 0%" });
  fireEvent.click(screen.getByRole("button", { name: "Reset to center" }));
  expect(image).toHaveStyle({ objectPosition: "50% 50%" });
  expect(screen.getByLabelText("Horizontal position")).toHaveValue("50");
  expect(screen.getByLabelText("Vertical position")).toHaveValue("50");
});
