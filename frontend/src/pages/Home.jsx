import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Categories from "../components/Categories";
import FeaturedVehicles from "../components/FeaturedVehicles";
import WhyChooseUs from "../components/WhyChooseUs";
import Testimonials from "../components/Testimonials";
import DownloadApp from "../components/DownloadApp";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <section id="categories">
        <Categories />
      </section>

      <section id="vehicles">
        <FeaturedVehicles />
      </section>

      <section id="features">
        <WhyChooseUs />
      </section>

      <section id="reviews">
        <Testimonials />
      </section>

      <section id="download">
        <DownloadApp />
      </section>

      <Footer />
    </>
  );
}