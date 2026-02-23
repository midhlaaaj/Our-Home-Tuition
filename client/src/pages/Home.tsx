import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import ClassesRoadmap from '../components/ClassesRoadmap';
import Reviews from '../components/Reviews';
import CounterSection from '../components/CounterSection';
import AffiliatedLogos from '../components/AffiliatedLogos';
import MentorsSection from '../components/MentorsSection';
import PartnerSlider from '../components/PartnerSlider';

const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header showToggle={false} />

            <main className="flex-grow">
                <HeroSection />
                <CounterSection />
                <ClassesRoadmap />
                <PartnerSlider />
                <AffiliatedLogos />
                <MentorsSection />
                <Reviews />
            </main>

            <Footer />
        </div>
    );
};

export default Home;
