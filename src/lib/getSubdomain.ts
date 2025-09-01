
// ===== 2. UPDATED lib/getSubdomain.ts =====
export function getSubdomain(hostname: string): string | null {
  console.log("🔧 getSubdomain: raw hostname =", hostname);
  
  // Strip port if present (e.g., hisense.localhost:3000 => hisense.localhost)
  const hostWithoutPort = hostname.split(':')[0];
  console.log("🔧 getSubdomain: without port =", hostWithoutPort);
  
  // Local development subdomains: *.localhost
  if (hostWithoutPort.endsWith('.localhost')) {
    const parts = hostWithoutPort.split('.');
    const subdomain = parts[0]; // e.g., hisense.localhost → "hisense"
    console.log("🔧 getSubdomain: dev subdomain =", subdomain);
    return subdomain;
  }
  
  // ✅ FIXED: Use correct domain with 'm'
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'afrihrm.com'; // ✅ Changed to afrihrm.com
  
  if (hostWithoutPort.endsWith(`.${baseDomain}`)) {
    const subdomain = hostWithoutPort.replace(`.${baseDomain}`, '');
    console.log("🔧 getSubdomain: prod subdomain =", subdomain);
    return subdomain;
  }
  
  // Edge case: full domain or no subdomain
  if (
    hostWithoutPort === 'localhost' ||
    hostWithoutPort === '127.0.0.1' ||
    hostWithoutPort === baseDomain ||
    hostWithoutPort === `www.${baseDomain}`
  ) {
    console.log("ℹ️ getSubdomain: defaulting to 'the-media-consult'");
    return 'the-media-consult'; // ✅ fallback for dev
  }
  
  console.log("❌ getSubdomain: could not extract subdomain");
  return null;
}




