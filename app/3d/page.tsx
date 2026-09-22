import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { tour } from "@/content/tour";
import { Tour } from "./Tour";
import "./tour.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-tour",
});

export const metadata: Metadata = {
  title: tour.title,
  description: tour.description,
  openGraph: {
    title: tour.title,
    description: tour.description,
    type: "website",
  },
};

export default function TourPage() {
  return (
    <main id="main" className={geist.variable}>
      <Tour />
    </main>
  );
}
