import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';

function HealthcareDemocratization() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'

  // Check if the server is available
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:5008/test', {
          headers: {
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Server status:', data);
          setServerStatus('online');
        } else {
          console.error('Server returned non-OK status:', response.status);
          setServerStatus('offline');
        }
      } catch (error) {
        console.error('Server connection error:', error);
        setServerStatus('offline');
      }
    };

    checkServerStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error('Please enter your question');
      return;
    }

    if (serverStatus === 'offline') {
      toast.error('Server is currently unavailable. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending request to:', 'http://localhost:5008/api/medical/simplify');
      console.log('Request body:', { text: question.trim() });
      
      const response = await fetch('http://localhost:5008/api/medical/simplify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ text: question }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResponse(data);
      // Don't clear the question field to allow for user to view what they asked
      // setQuestion('');
    } catch (error) {
      console.error('Error details:', error);
      
      // Provide more specific error messages based on the error type
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Could not connect to the server. Please make sure the server is running.');
        setServerStatus('offline');
      } else {
        toast.error(error.message || 'Failed to get response');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Healthcare Information</h1>
            <p className="mt-2 text-gray-600">
              Ask questions about medical procedures and conditions
            </p>
            {serverStatus === 'offline' && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                <p className="font-medium">⚠️ Server is currently unavailable</p>
                <p className="text-sm">Please make sure the backend server is running on port 5008.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex flex-col space-y-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter medical text to simplify (e.g., Hypertension is a condition characterized by elevated blood pressure)"
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                disabled={serverStatus === 'offline'}
              />
              <button
                type="submit"
                disabled={loading || serverStatus === 'offline'}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Simplify Text'}
              </button>
            </div>
          </form>

          {response && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Simplified Text</h2>
              <div className="prose max-w-none">
                {response.answer}
              </div>
              
              {response.explanations && response.explanations.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Medical Terms Explained</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {response.explanations.map((item, index) => (
                      <div key={index} className="p-3 bg-white rounded-md shadow-sm">
                        <strong className="text-blue-700">{item.term}:</strong>
                        <p className="mt-1">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HealthcareDemocratization; 