import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MedicalData from './pages/MedicalData';
import PillTracking from './pages/PillTracking';
import PredictMed from './pages/PredictMed';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/medical-data" element={
              <PrivateRoute>
                <MedicalData />
              </PrivateRoute>
            } />
            
            <Route path="/pill-tracking" element={
              <PrivateRoute>
                <PillTracking />
              </PrivateRoute>
            } />
            <Route path="/predict-med" element={
              <PrivateRoute>
                <PredictMed />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 