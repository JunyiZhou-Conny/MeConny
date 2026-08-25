import { Contact } from "@/app/components/contact";
import { Featured } from "@/app/components/featured";
import { Footer } from "@/app/components/footer";
import { Header } from "@/app/components/header";
import { Hero } from "@/app/components/hero";
import { Skills } from "@/app/components/skills";
import { Thesis } from "@/app/components/thesis";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Thesis />
        <Featured />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
