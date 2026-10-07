import Navbar from "../modules/landingPage/components/Navbar"
import HeroSection from "../modules/landingPage/HeroSection"
import TrustPoints from "../modules/landingPage/TrustPoints"
import FeaturesSection from "../modules/landingPage/FeaturesSection"
import ProcessSection from "../modules/landingPage/ProcessSection"
import CommunicationSection from "../modules/landingPage/CommunicationSection"
import Footer from "../modules/landingPage/components/Footer"

import ScrollToTopButton from "../components/common/widgets/ScrollToTopButton"

export default function LandingPage() {
  return (
    <main className="h-screen scroll-smooth bg-white text-slate-900 transition-colors duration-300 dark:bg-[#0f1724] dark:text-slate-100">
      <Navbar />

      <HeroSection />

      <TrustPoints />

      {/* SERVICES */}
      <section id="services" className="scroll-mt-20">
        <FeaturesSection />
      </section>

      {/* HOW IT WORKS — add this if you have a matching section, otherwise drop the link */}
      <section id="how-it-works" className="scroll-mt-20"><ProcessSection /></section>


      <section id="why-compair" className="scroll-mt-20">
        <CommunicationSection />
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-20">
      <Footer />
      </section>
      <ScrollToTopButton />
    </main>
  )
}
