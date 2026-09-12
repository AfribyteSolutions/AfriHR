// lib/firestore-compat.ts
// Client-side Firestore compatibility layer backed by Base44 entities.
// Replaces firebase/firestore imports with Base44 SDK operations.

import { base44 } from "@/lib/base44";

// Collection name → Base44 entity name mapping
const ENTITY_MAP: Record<string, string> = {
  recruitment: "Candidate",
  employees: "Employee",
  users: "User",
  leaves: "LeaveRequest",
  notifications: "Notification",
  companies: "Tenant",
  documents: "EmployeeDocument",
  terminations: "Offboarding",
  resignations: "Offboarding",
  onboarding: "Onboarding",
  onboardingTasks: "OnboardingTask",
  performanceReviews: "PerformanceReview",
  auditLogs: "AuditLog",
  jobOpenings: "JobOpening",
  warnings: "Warning",
  trainings: "Training",
  promotions: "Promotion",
  expenses: "Expense",
  invoices: "Invoice",
  attendance: "Attendance",
  feedback: "Feedback",
  reports: "Report",
  activities: "Activity",
  projects: "Project",
  payroll: "Payroll",
  payslips: "Payslip",
  announcements: "Announcement",
};

function entityName(collection: string): string {
  return ENTITY_MAP[collection] || collection;
}

function entity(collection: string): any {
  return (base44.entities as any)[entityName(collection)];
}

// ── Doc ref ──
export interface CompatDocRef {
  _collection: string;
  _id: string;
  id: string;
}

export function doc(_db: any, collection: string, id: string): CompatDocRef {
  return { _collection: collection, _id: id, id };
}

// ── Collection ref ──
export interface CompatCollectionRef {
  _collection: string;
}

export function collection(_db: any, name: string): CompatCollectionRef {
  return { _collection: name };
}

// ── Query ──
export interface CompatQuery {
  _collection: string;
  _filters: Record<string, any>;
  _sortField?: string;
  _sortDir?: string;
  _limit?: number;
}

export function query(ref: CompatCollectionRef, ...constraints: QueryConstraint[]): CompatQuery {
  const q: CompatQuery = { _collection: ref._collection, _filters: {} };
  for (const c of constraints) {
    if (c._type === "where") {
      q._filters[c._field!] = c._value;
    } else if (c._type === "orderBy") {
      q._sortField = c._field;
      q._sortDir = c._dir;
    } else if (c._type === "limit") {
      q._limit = c._value;
    }
  }
  return q;
}

interface QueryConstraint {
  _type: string;
  _field?: string;
  _value?: any;
  _dir?: string;
}

export function where(field: string, op: string, value: any): QueryConstraint {
  if (op === "==") return { _type: "where", _field: field, _value: value };
  if (op === "in") return { _type: "where", _field: field, _value: { $in: value } };
  if (op === "!=") return { _type: "where", _field: field, _value: { $ne: value } };
  if (op === ">") return { _type: "where", _field: field, _value: { $gt: value } };
  if (op === ">=") return { _type: "where", _field: field, _value: { $gte: value } };
  if (op === "<") return { _type: "where", _field: field, _value: { $lt: value } };
  if (op === "<=") return { _type: "where", _field: field, _value: { $lte: value } };
  return { _type: "where", _field: field, _value };
}

export function orderBy(field: string, direction?: string): QueryConstraint {
  return { _type: "orderBy", _field: field, _dir: direction || "asc" };
}

export function limit(n: number): QueryConstraint {
  return { _type: "limit", _value: n };
}

// ── Get operations ──
export async function getDoc(ref: CompatDocRef): Promise<{ exists: () => boolean; id: string; data: () => any }> {
  try {
    const rec = await entity(ref._collection).read(ref._id);
    return { exists: () => true, id: ref._id, data: () => rec };
  } catch {
    return { exists: () => false, id: ref._id, data: () => null };
  }
}

export async function getDocs(q: CompatQuery | CompatCollectionRef): Promise<{
  empty: boolean;
  docs: Array<{ id: string; data: () => any }>;
  size: number;
}> {
  const collectionName = (q as any)._collection;
  const filters = (q as any)._filters || {};
  const sortField = (q as any)._sortField;
  const sortDir = (q as any)._sortDir;
  const lim = (q as any)._limit;

  const sort = sortField ? `${sortDir === "desc" ? "-" : "+"}${sortField}` : "-created_date";
  const results = await entity(collectionName).filter(filters, sort, lim || 5000);
  const docs = (results || []).map((r: any) => ({ id: r.id, data: () => r }));
  return { empty: docs.length === 0, docs, size: docs.length };
}

// ── Write operations ──
export async function deleteDoc(ref: CompatDocRef): Promise<void> {
  await entity(ref._collection).delete(ref._id);
}

export async function updateDoc(ref: CompatDocRef, data: any): Promise<void> {
  const clean: any = {};
  for (const [k, v] of Object.entries(data)) {
    clean[k] = v instanceof Date ? v.toISOString() : v;
  }
  await entity(ref._collection).update(ref._id, clean);
}

export async function setDoc(ref: CompatDocRef, data: any, _opts?: any): Promise<void> {
  const clean: any = {};
  for (const [k, v] of Object.entries(data)) {
    clean[k] = v instanceof Date ? v.toISOString() : v;
  }
  try {
    await entity(ref._collection).update(ref._id, clean);
  } catch {
    await entity(ref._collection).create({ ...clean, id: ref._id });
  }
}

export async function addDoc(ref: CompatCollectionRef, data: any): Promise<{ id: string }> {
  const clean: any = {};
  for (const [k, v] of Object.entries(data)) {
    clean[k] = v instanceof Date ? v.toISOString() : v;
  }
  const rec = await entity(ref._collection).create(clean);
  return { id: rec.id };
}

// ── onSnapshot (polling-based) ──
export function onSnapshot(
  ref: CompatDocRef | CompatQuery,
  callback: (snap: any) => void,
  onError?: (error: any) => void
): () => void {
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;
    try {
      if ("_id" in ref) {
        // Doc ref
        const rec = await entity((ref as CompatDocRef)._collection).read((ref as CompatDocRef)._id);
        if (cancelled) return;
        callback({ exists: () => true, id: (ref as CompatDocRef)._id, data: () => rec });
      } else {
        // Query
        const q = ref as CompatQuery;
        const sort = q._sortField ? `${q._sortDir === "desc" ? "-" : "+"}${q._sortField}` : "-created_date";
        const results = await entity(q._collection).filter(q._filters || {}, sort, q._limit || 5000);
        if (cancelled) return;
        const docs = (results || []).map((r: any) => ({ id: r.id, data: () => r }));
        callback({ docs, empty: docs.length === 0, size: docs.length });
      }
    } catch (err) {
      if (!cancelled && onError) onError(err);
    }
  };

  poll();
  const interval = setInterval(poll, 15000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

// ── Timestamp ──
export class Timestamp {
  private _date: Date;
  constructor(seconds?: number, nanos?: number) {
    this._date = seconds ? new Date(seconds * 1000) : new Date();
  }
  toDate() { return this._date; }
  toMillis() { return this._date.getTime(); }
  toString() { return this._date.toISOString(); }
  static now() { return new Timestamp(); }
  static fromDate(d: Date) { return new Timestamp(d.getTime() / 1000); }
  static fromMillis(m: number) { return new Timestamp(m / 1000); }
}

// ── FieldValue ──
export const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
  increment: (n: number) => ({ __increment: n }),
  arrayUnion: (...items: any[]) => ({ __arrayUnion: items }),
  arrayRemove: (...items: any[]) => ({ __arrayRemove: items }),
  delete: () => ({ __delete: true }),
};

// ── db marker (operations handled by compat functions) ──
export const db = { _compat: true };
