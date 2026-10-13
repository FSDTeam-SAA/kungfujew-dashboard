"use client";

import { useWatch } from "react-hook-form";
import { Truck, MapPin, ArrowRight, Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { serviceLines, shipmentStatuses } from "../../schema";
import type { ShipmentDetailsTabProps } from "../../types";

const inputClass =
  "w-full bg-white text-sm border-[#d7deea] text-[#1d2b4f] focus-visible:border-[#012055] focus-visible:ring-[#012055]/20";
const selectClass =
  "h-10 w-full rounded-md border border-[#d7deea] bg-white px-3 text-sm text-[#25324a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#012055] transition-colors";

export function ShipmentDetailsTab({ form }: ShipmentDetailsTabProps) {
  const pickup = useWatch({
    control: form.control,
    name: "pickupLocation",
  });
  const dest = useWatch({
    control: form.control,
    name: "destination",
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#d7deea] bg-white p-5 shadow-sm sm:p-7 md:p-8">
        {/* Section Header */}
        <div className="border-b border-[#eef2f7] pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#66748a]">
            <Truck className="size-4 text-[#012055]" aria-hidden="true" />
            <span>Shipment Facts & Logistics</span>
          </div>
          <h3 className="mt-1 text-lg font-serif text-[#1d2b4f] sm:text-xl">
            Transport Route & Classification
          </h3>
          <p className="mt-1 text-xs text-[#59677c]">
            These details describe the route, equipment, and service category
            for readers and search filters.
          </p>
        </div>

        {/* Live Route Banner Preview */}
        {(pickup || dest) && (
          <div className="mt-5 flex flex-wrap items-center gap-2.5 rounded-lg border border-[#b6c7dd] bg-[#eaf0f8] px-4 py-3 text-xs font-medium text-[#012055]">
            <MapPin
              className="size-4 text-[#012055] shrink-0"
              aria-hidden="true"
            />
            <span className="font-semibold">{pickup || "Origin (TBD)"}</span>
            <ArrowRight
              className="size-3.5 text-[#59677c]"
              aria-hidden="true"
            />
            <span className="font-semibold">{dest || "Destination (TBD)"}</span>
          </div>
        )}

        {/* 2-Column Responsive Form Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Pickup Location */}
          <FormField
            control={form.control}
            name="pickupLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="pickupLocation"
                  className="text-sm font-semibold text-[#1d2b4f]"
                >
                  Pickup location
                </FormLabel>
                <FormControl>
                  <Input
                    id="pickupLocation"
                    placeholder="e.g. Dallas, TX or Port of Los Angeles"
                    {...field}
                    className={inputClass}
                  />
                </FormControl>
                <FormDescription className="text-xs text-[#59677c]">
                  City, state, terminal, or origin facility where cargo was
                  loaded.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Destination */}
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="destination"
                  className="text-sm font-semibold text-[#1d2b4f]"
                >
                  Destination
                </FormLabel>
                <FormControl>
                  <Input
                    id="destination"
                    placeholder="e.g. Seattle, WA or JFK Cargo Center"
                    {...field}
                    className={inputClass}
                  />
                </FormControl>
                <FormDescription className="text-xs text-[#59677c]">
                  Final delivery city, terminal, or distribution address.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Service Line Selector */}
          <FormField
            control={form.control}
            name="serviceLine"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="serviceLine"
                  className="text-sm font-semibold text-[#1d2b4f]"
                >
                  Service line
                </FormLabel>
                <FormControl>
                  <select id="serviceLine" {...field} className={selectClass}>
                    <option value="">Select service line</option>
                    {serviceLines.map((line) => {
                      const labelMap: Record<string, string> = {
                        vehicle: "Vehicle Transport",
                        freight: "Freight Transport",
                        "heavy-equipment": "Heavy Equipment",
                      };
                      return (
                        <option key={line} value={line}>
                          {labelMap[line] ?? line}
                        </option>
                      );
                    })}
                  </select>
                </FormControl>
                <FormDescription className="text-xs text-[#59677c]">
                  Primary business line under which this story is categorized.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Shipment Status Selector */}
          <FormField
            control={form.control}
            name="shipmentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="shipmentStatus"
                  className="text-sm font-semibold text-[#1d2b4f]"
                >
                  Shipment status
                </FormLabel>
                <FormControl>
                  <select
                    id="shipmentStatus"
                    {...field}
                    className={selectClass}
                  >
                    {shipmentStatuses.map((status) => {
                      const statusMap: Record<string, string> = {
                        pending: "Pending (Scheduled)",
                        in_transit: "In Transit (En Route)",
                        delivered: "Delivered (Completed)",
                        cancelled: "Cancelled",
                      };
                      return (
                        <option key={status} value={status}>
                          {statusMap[status] ?? status}
                        </option>
                      );
                    })}
                  </select>
                </FormControl>
                <FormDescription className="text-xs text-[#59677c]">
                  Current fulfillment state displayed on the public case study
                  badge.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Shipment Type / Cargo Description */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="shipmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    htmlFor="shipmentType"
                    className="text-sm font-semibold text-[#1d2b4f]"
                  >
                    Shipment type
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="shipmentType"
                      placeholder="e.g. Classic car (1968 Shelby GT500), 40ft Container, CAT D6 Bulldozer"
                      {...field}
                      className={inputClass}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-[#59677c]">
                    Specify the exact vehicle make/model, equipment class,
                    trailer type, or special cargo characteristics.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Context Information Box */}
        <div className="mt-8 flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 text-xs text-[#4f5c70]">
          <Info
            className="size-4 shrink-0 text-[#012055] mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="font-semibold text-[#1d2b4f]">
              Logistics Display Integration
            </p>
            <p className="leading-relaxed">
              These attributes automatically populate the route header, service
              pill filters, and search indexes on the public customer portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
