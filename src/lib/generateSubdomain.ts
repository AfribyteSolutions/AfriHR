// lib/generateSubdomain.ts
export function generateSubdomain(companyName: string) {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")   // replace non-alphanumeric with -
      .replace(/(^-|-$)+/g, "");     // trim starting/ending -
  }
  