"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { Move, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CoverPosition } from "../schema";

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export function StoryCoverEditor({
  src,
  alt,
  position,
  onPositionChange,
  onRemove,
}: {
  src: string;
  alt: string;
  position: CoverPosition;
  onPositionChange: (position: CoverPosition) => void;
  onRemove: () => void;
}) {
  const [repositioning, setRepositioning] = useState(false);
  const naturalSize = useRef({ width: 0, height: 0 });
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    position: CoverPosition;
    overflowX: number;
    overflowY: number;
  } | null>(null);
  const objectPosition = `${position.x}% ${position.y}%`;
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!repositioning || event.button !== 0 || event.isPrimary === false)
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    const size = naturalSize.current;
    if (!size.width || !size.height) return;
    const scale = Math.max(rect.width / size.width, rect.height / size.height);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      position: { ...position },
      overflowX: size.width * scale - rect.width,
      overflowY: size.height * scale - rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    onPositionChange({
      x:
        current.overflowX > 1
          ? clamp(
              current.position.x -
                ((event.clientX - current.x) / current.overflowX) * 100,
            )
          : current.position.x,
      y:
        current.overflowY > 1
          ? clamp(
              current.position.y -
                ((event.clientY - current.y) / current.overflowY) * 100,
            )
          : current.position.y,
    });
  };
  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Wide card crop"
        aria-describedby={repositioning ? "cover-position-help" : undefined}
        className="relative aspect-[16/7] overflow-hidden rounded-lg bg-[#e9edf3]"
        style={{
          touchAction: repositioning ? "none" : "auto",
          cursor: repositioning ? "move" : undefined,
        }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        <Image
          src={src}
          alt={alt || "Story cover"}
          fill
          unoptimized
          draggable={false}
          className="object-cover"
          style={{ objectPosition }}
          sizes="(max-width: 768px) 100vw, 700px"
          onLoad={(event) => {
            naturalSize.current = {
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            };
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          aria-label="Reposition image"
          aria-pressed={repositioning}
          onClick={() => setRepositioning((value) => !value)}
        >
          <Move aria-hidden="true" />
          {repositioning ? "Done positioning" : "Reposition"}
        </Button>
        <Button type="button" variant="outline" onClick={onRemove}>
          <Trash2 aria-hidden="true" />
          Remove image
        </Button>
      </div>
      {repositioning && (
        <div className="space-y-4 rounded-lg border border-[#d7deea] p-4">
          <p id="cover-position-help" className="text-sm text-[#59677c]">
            Drag the wide image or use the sliders to frame the subject. The
            original image stays unchanged.
          </p>
          {(["x", "y"] as const).map((axis) => (
            <div key={axis}>
              <label
                htmlFor={`cover-position-${axis}`}
                className="block text-sm font-medium text-[#1d2b4f]"
              >
                {axis === "x" ? "Horizontal position" : "Vertical position"}
              </label>
              <input
                id={`cover-position-${axis}`}
                className="mt-2 w-full accent-[#012055]"
                type="range"
                min="0"
                max="100"
                step="1"
                value={position[axis]}
                aria-valuetext={`${position[axis]} percent`}
                onChange={(event) =>
                  onPositionChange({
                    ...position,
                    [axis]: Number(event.target.value),
                  })
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => onPositionChange({ x: 50, y: 50 })}
          >
            Reset to center
          </Button>
          <div className="max-w-xs">
            <p className="mb-2 text-xs text-[#59677c]">
              Mobile / detail crop preview
            </p>
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#e9edf3]">
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                draggable={false}
                className="object-cover"
                style={{ objectPosition }}
                sizes="320px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
