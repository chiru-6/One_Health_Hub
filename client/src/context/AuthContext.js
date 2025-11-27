import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(decoded);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      // Fetch complete user data
      const userResponse = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setToken(token);
      setUser(userResponse.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const signup = async (userData) => {
    try {
      // Transform the medical conditions data to match the backend schema
      const transformedData = {
        ...userData,
        medicalDetails: {
          age: userData.age,
          dateOfBirth: userData.dateOfBirth,
          weight: userData.weight,
          medicalConditions: userData.medicalConditions.map(condition => condition.condition)
        }
      };
      
      const response = await axios.post('/api/auth/register', transformedData);
      const { token } = response.data;
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      setToken(token);
      setUser(decoded);
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.response?.data?.message || 'Signup failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      await axios.post('/api/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to process request' };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await axios.post(`/api/auth/reset-password/${token}`, { password });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to reset password' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      signup,
      logout,
      forgotPassword,
      resetPassword
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};