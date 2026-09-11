// lib/base44-server.ts
// Server-side Base44 client for Next.js API routes.
// Replaces firebase-admin with Base44 SDK entity operations.

import { createClient } from "@base44/sdk";
import { BASE44_APP_ID } from "@/lib/base44";

/**
 * Maps Firestore collection names to Base44 entity names.
 * Unknown collections fall back to their own name.
 */
const COLLECTION_MAP: Record<string, string> = {
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
  onboardingCompany: "Onboarding",
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
  projectDiscussions: "ProjectDiscussion",
  projectDocuments: "ProjectDocument",
  projectMembers: "ProjectMember",
  projectProgress: "ProjectProgress",
  payroll: "Payroll",
  payslips: "Payslip",
};

function entityName(collection: string): string {
  return COLLECTION_MAP[collection] || collection;
}

// Lazy-init the server-side client (anonymous mode — no localStorage needed)
let _client: ReturnType<typeof createClient> | null = null;
export function getServerClient() {
  if (!_client) {
    _client = createClient({ appId: BASE44_APP_ID });
  }
  return _client;
}

// ── Firestore-compatible wrapper types ──

interface DocSnapshot {
  id: string;
  exists: boolean;
  data(): any;
  ref: DocRef;
}

interface QuerySnapshot {
  empty: boolean;
  docs: DocSnapshot[];
  size: number;
}

interface DocRef {
  id: string;
  get(): Promise<DocSnapshot>;
  update(data: any): Promise<void>;
  delete(): Promise<void>;
  set(data: any, opts?: any): Promise<void>;
}

interface QueryBuilder {
  where(field: string, op: string, value: any): QueryBuilder;
  orderBy(field: string, direction?: string): QueryBuilder;
  limit(n: number): QueryBuilder;
  get(): Promise<QuerySnapshot>;
}

class Base44DocRef implements DocRef {
  constructor(public id: string, private collection: string) {}
  private entity() {
    return (getServerClient().entities as any)[entityName(this.collection)];
  }
  async get(): Promise<DocSnapshot> {
    try {
      const rec = await this.entity().read(this.id);
      return { id: this.id, exists: true, data: () => rec, ref: this };
    } catch {
      return { id: this.id, exists: false, data: () => null, ref: this };
    }
  }
  async update(data: any): Promise<void> {
    await this.entity().update(this.id, this._clean(data));
  }
  async delete(): Promise<void> {
    await this.entity().delete(this.id);
  }
  async set(data: any, _opts?: any): Promise<void> {
    await this.entity().update(this.id, this._clean(data));
  }
  private _clean(data: any): any {
    const c: any = {};
    for (const [k, v] of Object.entries(data)) {
      if (v instanceof ServerTimestamp) continue; // skip server timestamps on update
      c[k] = v;
    }
    return c;
  }
}

class Base44QueryBuilder implements QueryBuilder {
  private filters: Record<string, any> = {};
  private sortField: string | null = null;
  private sortDir: string = "asc";
  private maxLimit: number | null = null;

  constructor(private collection: string) {}

  where(field: string, op: string, value: any): QueryBuilder {
    if (op === "==") {
      this.filters[field] = value;
    } else if (op === "in") {
      this.filters[field] = { $in: value };
    } else if (op === "!=") {
      this.filters[field] = { $ne: value };
    } else if (op === ">") {
      this.filters[field] = { $gt: value };
    } else if (op === ">=") {
      this.filters[field] = { $gte: value };
    } else if (op === "<") {
      this.filters[field] = { $lt: value };
    } else if (op === "<=") {
      this.filters[field] = { $lte: value };
    } else {
      this.filters[field] = value;
    }
    return this;
  }

  orderBy(field: string, direction?: string): QueryBuilder {
    this.sortField = field;
    this.sortDir = direction || "asc";
    return this;
  }

  limit(n: number): QueryBuilder {
    this.maxLimit = n;
    return this;
  }

  async get(): Promise<QuerySnapshot> {
    const entity = (getServerClient().entities as any)[entityName(this.collection)];
    const sort = this.sortField
      ? `${this.sortDir === "desc" ? "-" : "+"}${this.sortField}`
      : "-created_date";
    const limit = this.maxLimit || 5000;
    const results = await entity.filter(this.filters, sort, limit);
    const docs: DocSnapshot[] = (results || []).map((rec: any) => ({
      id: rec.id,
      exists: true,
      data: () => rec,
      ref: new Base44DocRef(rec.id, this.collection),
    }));
    return { empty: docs.length === 0, docs, size: docs.length };
  }
}

class Base44CollectionRef {
  constructor(private name: string) {}

  doc(id?: string): DocRef {
    return new Base44DocRef(id || "", this.name);
  }

  async add(data: any): Promise<DocRef> {
    const entity = (getServerClient().entities as any)[entityName(this.name)];
    const clean = this._clean(data);
    const rec = await entity.create(clean);
    return new Base44DocRef(rec.id, this.name);
  }

  where(field: string, op: string, value: any): QueryBuilder {
    const qb = new Base44QueryBuilder(this.name);
    return qb.where(field, op, value);
  }

  orderBy(field: string, direction?: string): QueryBuilder {
    const qb = new Base44QueryBuilder(this.name);
    return qb.orderBy(field, direction);
  }

  limit(n: number): QueryBuilder {
    const qb = new Base44QueryBuilder(this.name);
    return qb.limit(n);
  }

  async get(): Promise<QuerySnapshot> {
    const qb = new Base44QueryBuilder(this.name);
    return qb.get();
  }

  private _clean(data: any): any {
    const c: any = {};
    for (const [k, v] of Object.entries(data)) {
      if (v instanceof ServerTimestamp) {
        c[k] = new Date().toISOString();
      } else if (v instanceof FieldValueDelete) {
        // skip — can't delete fields in Base44
      } else {
        c[k] = v;
      }
    }
    return c;
  }
}

// ── Batch support ──

class Base44Batch {
  private ops: Array<() => Promise<void>> = [];

  set(ref: DocRef, data: any, _opts?: any): void {
    this.ops.push(async () => {
      if (ref instanceof Base44DocRef && !ref.id) {
        // new doc — create
        const entity = (getServerClient().entities as any)[entityName((ref as any).collection)];
        const rec = await entity.create(this._clean(data));
        (ref as any).id = rec.id;
      } else {
        await ref.set(data);
      }
    });
  }

  update(ref: DocRef, data: any): void {
    this.ops.push(async () => {
      await ref.update(this._clean(data));
    });
  }

  delete(ref: DocRef): void {
    this.ops.push(async () => {
      await ref.delete();
    });
  }

  async commit(): Promise<void> {
    for (const op of this.ops) {
      await op();
    }
    this.ops = [];
  }

  private _clean(data: any): any {
    const c: any = {};
    for (const [k, v] of Object.entries(data)) {
      if (v instanceof ServerTimestamp) {
        c[k] = new Date().toISOString();
      } else if (v instanceof FieldValueDelete) {
        // skip
      } else {
        c[k] = v;
      }
    }
    return c;
  }
}

// ── Transaction support ──

class Base44Transaction {
  async get(ref: DocRef): Promise<DocSnapshot> {
    return ref.get();
  }
  update(ref: DocRef, data: any): void {
    // queued — executed in commit
    (this as any)._updates = (this as any)._updates || [];
    (this as any)._updates.push(async () => {
      await ref.update(this._clean(data));
    });
  }
  set(ref: DocRef, data: any, opts?: any): void {
    (this as any)._updates = (this as any)._updates || [];
    (this as any)._updates.push(async () => {
      await ref.set(this._clean(data), opts);
    });
  }
  async _commit(): Promise<void> {
    const updates = (this as any)._updates || [];
    for (const u of updates) {
      await u();
    }
  }
  private _clean(data: any): any {
    const c: any = {};
    for (const [k, v] of Object.entries(data)) {
      if (v instanceof ServerTimestamp) {
        c[k] = new Date().toISOString();
      } else {
        c[k] = v;
      }
    }
    return c;
  }
}

// ── FieldValue stubs ──

class ServerTimestamp {
  toDate() { return new Date(); }
  toISOString() { return new Date().toISOString(); }
}

class FieldValueDelete {}

class FieldValue {
  static serverTimestamp() { return new ServerTimestamp(); }
  static increment(n: number) { return { __increment: n }; }
  static arrayUnion(...items: any[]) { return { __arrayUnion: items }; }
  static arrayRemove(...items: any[]) { return { __arrayRemove: items }; }
  static delete() { return new FieldValueDelete(); }
}

// ── Timestamp stub ──

class Timestamp {
  static now() { return new Date(); }
  static fromDate(d: Date) { return d; }
  static fromMillis(m: number) { return new Date(m); }
}

// ── Firestore-compatible db object ──

const db = {
  collection(name: string): Base44CollectionRef {
    return new Base44CollectionRef(name);
  },
  batch(): Base44Batch {
    return new Base44Batch();
  },
  async runTransaction(cb: (tx: Base44Transaction) => Promise<void>): Promise<void> {
    const tx = new Base44Transaction();
    await cb(tx);
    await tx._commit();
  },
  doc(path: string): DocRef {
    const parts = path.split("/");
    const collection = parts[0];
    const id = parts[1];
    return new Base44DocRef(id, collection);
  },
};

// ── Auth stubs (server-side Base44 auth is limited) ──

const auth = {
  async getUserByEmail(_email: string) {
    throw { code: "auth/user-not-found" };
  },
  async getUser(_uid: string) {
    throw { code: "auth/user-not-found" };
  },
  async getUsers(_identifiers: any[]) {
    return { users: [], notFound: [] };
  },
  async createUser(_data: any) {
    throw new Error("Server-side user creation requires Base44 backend functions");
  },
  async generatePasswordResetLink(_email: string) {
    return "";
  },
  async setCustomUserClaims(_uid: string, _claims: any) {},
  async verifyIdToken(_token: string) {
    return null;
  },
};

// ── Storage stub ──

const bucket = {
  name: "base44-private",
  file(path: string) {
    return {
      save: async (_data: any, _opts?: any) => {},
      makePublic: async () => {},
      getSignedUrl: async () => [""],
      delete: async () => {},
      exists: async () => [false],
      download: async () => [Buffer.from("")],
    };
  },
  upload: async (_path: string, _opts?: any) => ({}) as any,
};

// ── Admin-compatible object ──

const admin = {
  firestore: () => ({
    ...db,
    FieldValue,
    Timestamp,
    collection: db.collection,
    batch: db.batch,
    runTransaction: db.runTransaction,
    doc: db.doc,
    settings: () => {},
  }),
  auth: () => auth,
  storage: () => ({
    bucket: () => bucket,
  }),
  apps: { length: 1 } as any,
  credential: {
    cert: () => ({}),
  },
  initializeApp: () => ({}),
};

export { admin, db, auth, bucket };
