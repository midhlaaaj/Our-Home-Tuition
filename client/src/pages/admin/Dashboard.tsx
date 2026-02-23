import React from 'react';

const Dashboard: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Cards Placeholder */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm uppercase font-bold">Total Slides</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm uppercase font-bold">Total Reviews</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">--</p>
                </div>
                {/* Add more stats as needed */}
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome, Admin</h2>
                <p className="text-gray-600">Use the sidebar to manage website content.</p>
            </div>
        </div>
    );
};

export default Dashboard;
