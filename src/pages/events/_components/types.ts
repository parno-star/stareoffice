import type { Doc } from "@/convex/_generated/dataModel.d.ts";

export type EnrichedEvent = Doc<"events"> & {
  authorName: string;
  authorAvatar: string | null;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  myRsvp: "going" | "maybe" | "not_going" | null;
  bannerUrl: string | null;
  capacityRemaining: number | null;
  rsvpClosed: boolean;
};
