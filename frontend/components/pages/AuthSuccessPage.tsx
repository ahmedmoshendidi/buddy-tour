import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token and role from URL params
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');

    if (token) {
      // 1. Store the token in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_role', role || 'guide');

      // 2. Redirect based on role
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/guide-dashboard');
      }
    } else {
      // If no token, something went wrong, go home
      navigate('/');
    }
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold">Authenticating...</h2>
        <p className="text-gray-400 mt-2">Setting up your secure dashboard.</p>
      </div>
    </div>
  );
};

export default AuthSuccessPage;
