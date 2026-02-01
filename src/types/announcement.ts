// types/announcement.ts

export type AnnouncementTarget = 'all' | 'managers' | 'employees' | 'specific';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  target: AnnouncementTarget;
  targetUserIds?: string[]; // For specific user targeting
  createdBy: string; // User ID of creator
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateAnnouncementData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  target: AnnouncementTarget;
  targetUserIds?: string[];
  createdBy: string;
}

export interface UpdateAnnouncementData {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  target?: AnnouncementTarget;
  targetUserIds?: string[];
}
