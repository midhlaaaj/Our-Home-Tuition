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

const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header showToggle={false} />

            <main className="flex-grow">
                <HeroSection />
                <CounterSection />
                <BrowseClasses />
                <PartnerSlider />
                <AffiliatedLogos />
                <MentorsSection />
                <Reviews />
                <FAQs />
                <ContactForm />
            </main>

            <Footer />
        </div>
    );
};

export default Home;
