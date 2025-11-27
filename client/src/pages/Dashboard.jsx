import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Users, Pill, Brain } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function Dashboard() {
  const { user, token } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        toast.error('Please login to access the dashboard');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/login');
        } else {
          toast.error('Failed to load user data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  const features = [
    {
      title: 'Medical Records',
      description: 'Store and manage your medical reports securely',
      icon: FileText,
      link: '/medical-data',
      color: 'bg-blue-500'
    },
    {
      title: 'Community Forum',
      description: 'Connect with others and share experiences',
      icon: Users,
      link: '/community',
      color: 'bg-green-500'
    },
    {
      title: 'Pill Tracking',
      description: 'Track your medications and get reminders',
      icon: Pill,
      link: '/pill-tracking',
      color: 'bg-purple-500'
    },
    {
      title: 'PredictMed',
      description: 'AI-powered symptom analysis and health predictions',
      icon: Brain,
      link: '/predict-med',
      color: 'bg-red-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {userData?.name || user?.name || 'User'}!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Personal Information</h3>
              <div className="space-y-2 text-gray-600">
                <p>Email: {userData?.email || user?.email || 'Not provided'}</p>
                <p>Username: {userData?.username || user?.username || 'Not provided'}</p>
                <p>Age: {userData?.medicalDetails?.age || user?.medicalDetails?.age || 'Not provided'}</p>
                <p>Weight: {userData?.medicalDetails?.weight ? `${userData.medicalDetails.weight} kg` : 'Not provided'}</p>
                {userData?.medicalDetails?.dateOfBirth && (
                  <p>Date of Birth: {new Date(userData.medicalDetails.dateOfBirth).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Medical History</h3>
              <div className="space-y-2">
                {userData?.medicalDetails?.medicalConditions?.length > 0 ? (
                  userData.medicalDetails.medicalConditions.map((condition, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium text-gray-700">{condition}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No medical conditions recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="transform hover:scale-105 transition-transform duration-200"
            >
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className={`${feature.color} p-4 flex items-center justify-center`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-1 text-gray-600">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;