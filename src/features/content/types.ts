export interface FAQ {
  question: string;
  answer: string;
}
export type ServiceLine = "vehicle" | "freight" | "heavy-equipment";
export interface ShipmentStory {
  _id: string;
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  pickupLocation: string;
  destination: string;
  shipmentType: string;
  serviceLine?: ServiceLine;
  shipmentStatus: "pending" | "in_transit" | "delivered" | "cancelled";
  image?: string;
  imageAlt?: string;
  faqs?: FAQ[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
