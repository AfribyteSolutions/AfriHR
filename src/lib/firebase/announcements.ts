// lib/firebase/announcements.ts
// Base44-native announcements (no Firebase).

import { base44 } from "@/lib/base44";
import { createNotification } from "../notification";
import {
  Announcement,
  CreateAnnouncementData,
  UpdateAnnouncementData,
  AnnouncementTarget,
} from "@/types/announcement";

function convertTimestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
}

async function getTargetUserIds(
  companyId: string,
  target: AnnouncementTarget,
  specificUserIds?: string[]
): Promise<string[]> {
  if (target === "specific" && specificUserIds) {
    return specificUserIds;
  }

  try {
    const users = await (base44.entities as any).User.filter({ tenant_id: companyId });

    if (target === "all") {
      return (users || []).map((u: any) => u.id);
    } else if (target === "managers") {
      return (users || [])
        .filter((u: any) => u.app_role === "manager" || u.role === "manager")
        .map((u: any) => u.id);
    } else if (target === "employees") {
      return (users || [])
        .filter((u: any) => u.app_role === "employee" || u.role === "employee")
        .map((u: any) => u.id);
    }
  } catch (error) {
    console.error("Error fetching target users:", error);
  }

  return [];
}

export async function createAnnouncementAndNotify(
  data: CreateAnnouncementData & { companyId: string }
): Promise<string> {
  try {
    const result = await (base44.entities as any).Announcement.create({
      title: data.title,
      description: data.description,
      start_date: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
      end_date: data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate,
      target: data.target,
      target_user_ids: data.targetUserIds || [],
      created_by: data.createdBy,
      tenant_id: data.companyId,
    });

    const targetUserIds = await getTargetUserIds(data.companyId, data.target, data.targetUserIds);

    const notificationPromises = targetUserIds.map((userId) =>
      createNotification({
        userId,
        title: "New Announcement",
        message: data.title,
        category: "system",
        link: "/announcement",
      })
    );

    await Promise.all(notificationPromises);
    return result?.id || "";
  } catch (error) {
    console.error("Error creating announcement:", error);
    throw error;
  }
}

export async function updateAnnouncement(
  announcementId: string,
  data: UpdateAnnouncementData
): Promise<void> {
  try {
    const update: Record<string, any> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.startDate !== undefined)
      update.start_date = data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate;
    if (data.endDate !== undefined)
      update.end_date = data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate;
    if (data.target !== undefined) update.target = data.target;
    if (data.targetUserIds !== undefined) update.target_user_ids = data.targetUserIds;

    await (base44.entities as any).Announcement.update(announcementId, update);
  } catch (error) {
    console.error("Error updating announcement:", error);
    throw error;
  }
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  try {
    await (base44.entities as any).Announcement.delete(announcementId);
  } catch (error) {
    console.error("Error deleting announcement:", error);
    throw error;
  }
}

export function subscribeToAnnouncements(
  companyId: string,
  onData: (announcements: Announcement[]) => void,
  onError: (error: any) => void
): () => void {
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;
    try {
      const results = await (base44.entities as any).Announcement.filter(
        { tenant_id: companyId },
        "-created_date"
      );
      if (cancelled) return;

      const announcements: Announcement[] = (results || []).map((r: any) => ({
        id: r.id,
        title: r.title || "",
        description: r.description || "",
        startDate: convertTimestampToDate(r.start_date),
        endDate: convertTimestampToDate(r.end_date),
        target: r.target || "all",
        targetUserIds: r.target_user_ids || [],
        createdBy: r.created_by || "",
        createdAt: convertTimestampToDate(r.created_date),
        updatedAt: r.updated_date ? convertTimestampToDate(r.updated_date) : undefined,
      }));
      onData(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      onError(error);
    }
  };

  poll();
  const interval = setInterval(poll, 30000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}
