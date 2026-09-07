import type { Id } from "@/convex/_generated/dataModel.d.ts";

export type ConversationPreview = {
  _id: Id<"conversations">;
  _creationTime: number;
  otherUser: {
    _id: Id<"users">;
    name: string | null;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
  };
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageSenderId: Id<"users"> | null;
  unreadCount: number;
};
