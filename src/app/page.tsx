"use client";
import dynamic from 'next/dynamic';

// Dynamically import HomeMainArea to avoid SSR issues
const HomeMainArea = dynamic(
  () => import("@/components/pagesUI/apps/home/HomeMainArea"),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <HomeMainArea />
    </>
  );
}
