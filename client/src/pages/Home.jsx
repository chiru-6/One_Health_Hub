import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">One Health Hub: Connecting Care, Community & Cure</h1>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Problem Statement</h2>
        <p className="text-gray-700">
          Creating a unified healthcare ecosystem that centralizes hospital medical records, 
          enables community knowledge sharing, and provides medication tracking tools.
        </p>
      </div>

      <div className="mb-12">
        <Carousel autoPlay infiniteLoop showThumbs={false}>
          <div>
            <img src="/images/medical1.jpg" alt="Medical Records" />
            <p className="legend">Centralized Medical Records</p>
          </div>
          <div>
            <img src="/images/community.jpg" alt="Community Support" />
            <p className="legend">Community Knowledge Sharing</p>
          </div>
          <div>
            <img src="/images/medication.jpg" alt="Medication Tracking" />
            <p className="legend">Smart Medication Tracking</p>
          </div>
          <div>
            <img src="/images/predictive.jpg" alt="Predictive Health" />
            <p className="legend">AI-Powered Health Predictions</p>
          </div>
        </Carousel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Centralized Records</h3>
          <p className="text-gray-600">Access all your medical records in one place</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Community Support</h3>
          <p className="text-gray-600">Connect with others and share experiences</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Medication Tracking</h3>
          <p className="text-gray-600">Never miss a dose with smart reminders</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Health Predictions</h3>
          <p className="text-gray-600">AI-powered insights for better health</p>
        </div>
      </div>
    </div>
  );
};

export default Home; 