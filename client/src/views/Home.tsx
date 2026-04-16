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
                <HeroSection />
                <section aria-label="Tutoring Statistics">
                    <Reveal delay={0.3}>
                        <CounterSection />
                    </Reveal>
                </section>
                <section aria-label="Available Classes">
                    <Reveal>
                        <BrowseClasses />
                    </Reveal>
                </section>
                <section aria-label="Our Partners">
                    <Reveal>
                        <PartnerSlider />
                    </Reveal>
                </section>
                <section aria-label="Accreditations">
                    <Reveal>
                        <AffiliatedLogos />
                    </Reveal>
                </section>
                <section aria-label="Expert Mentors">
                    <Reveal>
                        <MentorsSection />
                    </Reveal>
                </section>
                <section aria-label="Student Reviews">
                    <Reveal>
                        <Reviews />
                    </Reveal>
                </section>
                <section aria-label="Frequently Asked Questions">
                    <Reveal>
                        <FAQs />
                    </Reveal>
                </section>
                <section aria-label="Contact Us">
                    <Reveal>
                        <ContactForm />
                    </Reveal>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Home;
