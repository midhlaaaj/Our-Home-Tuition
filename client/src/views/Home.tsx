import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import Reviews from '../components/Reviews';
import CounterSection from '../components/CounterSection';
import AffiliatedLogos from '../components/AffiliatedLogos';
import MentorsSection from '../components/MentorsSection';
import PartnerSlider from '../components/PartnerSlider';
import FAQs from '../components/FAQs';
import BrowseClasses from '../components/BrowseClasses';
import ContactForm from '../components/ContactForm';
import Reveal from '../components/Reveal';

const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header showToggle={false} />

            <main className="flex-grow">
                <Reveal>
                    <HeroSection />
                </Reveal>
                <Reveal delay={0.3}>
                    <CounterSection />
                </Reveal>
                <Reveal>
                    <BrowseClasses />
                </Reveal>
                <Reveal>
                    <PartnerSlider />
                </Reveal>
                <Reveal>
                    <AffiliatedLogos />
                </Reveal>
                <Reveal>
                    <MentorsSection />
                </Reveal>
                <Reveal>
                    <Reviews />
                </Reveal>
                <Reveal>
                    <FAQs />
                </Reveal>
                <Reveal>
                    <ContactForm />
                </Reveal>
            </main>

            <Footer />
        </div>
    );
};

export default Home;
