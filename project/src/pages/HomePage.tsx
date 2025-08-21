import React from 'react';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import GameModes from '../components/home/GameModes';
import Features from '../components/home/Features';
import Testimonials from '../components/home/Testimonials';
import CTASection from '../components/home/CTASection';
import Footer from '../components/layout/Footer';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <GameModes />
        <Features />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;