import React from 'react';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const linksCol1 = [
        { label: 'Home', to: '/' },
        { label: 'About Us', to: '/about' },
        { label: 'Classes', to: '/class/1' },
    ];

    const linksCol2 = [
        { label: 'Career', to: '/career' },
        { label: 'Become a Tutor', to: '/career?apply=general' },
        { label: 'Privacy Policy', to: '/privacy' },
    ];

    const socials = [
        { icon: <FaFacebook size={18} />, href: 'https://www.facebook.com/ourhometuition', label: 'Facebook' },
        { icon: <FaInstagram size={18} />, href: 'https://www.instagram.com/ourhometuition', label: 'Instagram' },
        { icon: <FaLinkedin size={18} />, href: '#', label: 'LinkedIn' },
        { icon: <FaYoutube size={18} />, href: '#', label: 'YouTube' },
    ];

    return (
        <footer style={{ backgroundColor: '#1F2937' }}>
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-24 py-14">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">

                    {/* Column 1: Branding */}
                    <div className="flex flex-col items-start gap-4">
                        <div className="bg-white rounded-2xl p-4 shadow-md">
                            <img
                                src="/brand-logo.png"
                                alt="Hour Home"
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* Column 2: Useful Links — split into two sub-cols */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">
                            Useful Links
                        </h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {[...linksCol1, ...linksCol2].map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.to}
                                    className="text-white/70 text-sm hover:text-white transition-colors duration-200"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Follow Us */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">
                            Follow Us
                        </h4>
                        <div className="flex gap-3">
                            {socials.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#1B2A5A] hover:text-white transition-all duration-200"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-24 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-white/40 text-center sm:text-left">
                        © {currentYear} Hour Home. All Rights Reserved.
                    </p>
                    <p className="text-xs text-white/40">
                        Designed with ❤️ for better education
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
