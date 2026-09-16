import type { Metadata } from "next";
import { tour } from "@/content/tour";
import { Tour } from "./_tour/Tour";
import "./_tour/tour.css";

export const metadata: Metadata = {
  title: tour.title,
  description: tour.description,
  openGraph: {
    title: tour.title,
    description: tour.description,
    type: "website",
  },
};

export default function Home() {
  return (
    <main id="main">
      <Tour />
    </main>
  );
}
