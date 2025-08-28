// lib/subdomain-utils.ts
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// For App Router (server components)
export async function getSubdomainFromCookie(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const subdomainCookie = cookieStore.get('subdomain');
    
    console.log("🍪 getSubdomainFromCookie: cookie value:", subdomainCookie?.value);
    return subdomainCookie?.value || null;
  } catch (error) {
    console.error("🔥 Error reading subdomain cookie:", error);
    return null;
  }
}

// For Pages Router (getServerSideProps)
export function getSubdomainFromRequest(req: NextRequest | any): string | null {
  try {
    const subdomain = req.cookies?.subdomain;
    console.log("🍪 getSubdomainFromRequest: cookie value:", subdomain);
    return subdomain || null;
  } catch (error) {
    console.error("🔥 Error reading subdomain from request:", error);
    return null;
  }
}

// Client-side utility (for debugging)
export function getSubdomainFromClientCookie(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    const subdomainCookie = cookies.find(cookie => 
      cookie.trim().startsWith('subdomain=')
    );
    
    const value = subdomainCookie?.split('=')[1] || null;
    console.log("🍪 getSubdomainFromClientCookie: value:", value);
    return value;
  } catch (error) {
    console.error("🔥 Error reading client-side subdomain cookie:", error);
    return null;
  }
}