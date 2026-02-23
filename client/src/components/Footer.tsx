import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-4 text-center">
                <h3 className="text-xl font-semibold mb-4">Our Home Tuition</h3>
                <p className="text-gray-400 mb-4">
                    Empowering students with quality education at home.
                </p>
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                    <a href="#" className="hover:text-white transition-colors">About Us</a>
                    <a href="#" className="hover:text-white transition-colors">Contact</a>
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                </div>
                <div className="mt-8 text-xs text-gray-600">
                    &copy; {new Date().getFullYear()} Our Home Tuition. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
