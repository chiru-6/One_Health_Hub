import React from 'react';
import { Link } from 'react-router-dom';
import { Carousel } from 'react-responsive-carousel';
import { useAuth } from '../context/AuthContext';
import "react-responsive-carousel/lib/styles/carousel.min.css";

const carouselItems = [
  {
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80",
    title: "Medical Records Management",
    description: "Securely store and access your medical records from multiple hospitals in one place"
  },
  {
    image: "https://images.unsplash.com/photo-1652787544912-137c7f92f99b?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Health Democratization",
    description: "Equal access to health resources and information for everyone regardless of background"
  },
  {
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80",
    title: "Medication Tracking",
    description: "Never miss a dose with our intelligent medication reminder system"
  },
  {
    image: "https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "AI-Powered Health Predictions",
    description: "Get instant insights about your symptoms with our advanced AI system"
  }
];

const benefits = [
  {
    title: "Centralized Health Records",
    description: "Keep all your medical records in one secure place"
  },
  {
    title: "Health Equality Resources",
    description: "Access health resources traditionally limited to privileged populations"
  },
  {
    title: "Smart Medication Management",
    description: "Never miss important medications with our reminder system"
  },
  {
    title: "AI Health Assistant",
    description: "Get quick insights about your symptoms"
  }
];

const reviews = [
  {
    name: "Sarah Johnson",
    rating: 5,
    comment: "This platform has revolutionized how I manage my health records!"
  },
  {
    name: "Michael Chen",
    rating: 5,
    comment: "The health democratization tools gave me access to resources I never knew existed."
  },
  {
    name: "Emily Davis",
    rating: 4,
    comment: "The medication tracker has helped me stay consistent with my treatment."
  },
  // Add more reviews as needed
];

function Home() {
  const { user } = useAuth(); // ✅ Get the current user
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            One Health Hub
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Connecting Care, Equality & Cure
          </p>
          {!user && (
  <Link to="/signup" className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition">
    Get Started
  </Link>
)}
        </div>
      </div>

      {/* Carousel Section */}
      <div className="w-full bg-white">
        <div className="w-full max-w-full mx-auto">
          <Carousel
            showArrows={true}
            showStatus={false}
            showThumbs={false}
            infiniteLoop={true}
            autoPlay={true}
            interval={5000}
            className="w-full"
          >
            {carouselItems.map((item, index) => (
              <div key={index} className="relative h-96">
                <img
                  src={item.image}
                  alt={item.title}
                  className="object-cover h-full w-full"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-white text-center px-4">
                    <h3 className="text-3xl font-bold mb-2">{item.title}</h3>
                    <p className="text-xl">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose One Health Hub?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{review.name}</h4>
                    <div className="flex text-yellow-400">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Get In Touch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-blue-600 text-2xl mb-3">📞</div>
              <h3 className="text-xl font-semibold mb-2">Phone</h3>
              <p className="text-gray-600">+1 (800) 123-4567</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-blue-600 text-2xl mb-3">✉️</div>
              <h3 className="text-xl font-semibold mb-2">Email</h3>
              <p className="text-gray-600">support@onehealthhub.com</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-blue-600 text-2xl mb-3">📍</div>
              <h3 className="text-xl font-semibold mb-2">Address</h3>
              <p className="text-gray-600">123 Health Avenue, Medical District, CA 90210</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Copyright */}
      <footer className="bg-blue-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">One Health Hub</h3>
              <p className="text-blue-200">Making healthcare accessible for everyone.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-blue-200 hover:text-white">Home</Link></li>
                <li><Link to="/about" className="text-blue-200 hover:text-white">About Us</Link></li>
                <li><Link to="/services" className="text-blue-200 hover:text-white">Services</Link></li>
                <li><Link to="/contact" className="text-blue-200 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link to="/blog" className="text-blue-200 hover:text-white">Blog</Link></li>
                <li><Link to="/faq" className="text-blue-200 hover:text-white">FAQ</Link></li>
                <li><Link to="/privacy" className="text-blue-200 hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-blue-200 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-blue-200 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <span className="text-xl">📱</span>
                </a>
                <a href="#" className="text-blue-200 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <span className="text-xl">📱</span>
                </a>
                <a href="#" className="text-blue-200 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <span className="text-xl">📱</span>
                </a>
                <a href="#" className="text-blue-200 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <span className="text-xl">📱</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-700 pt-6 text-center">
            <p className="text-blue-200">
              &copy; {new Date().getFullYear()} One Health Hub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;