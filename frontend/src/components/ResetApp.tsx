import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const ResetApp: React.FC = () => {
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset the application? This will delete ALL assignments, ratings, and reset user ratings. This action cannot be undone.')) {
      return;
    }

    try {
      setIsResetting(true);
      setMessage(null);
      setError(null);

      const response = await fetch('http://localhost:5000/api/reset-app', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('You are not authorized to perform this action');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessage(data.message);
      
      // Wait 3 seconds before redirecting to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error resetting application:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset application');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Reset Application" />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Reset Application Data
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>
                This will delete all assignments, ratings, and reset user ratings. This action cannot be undone.
              </p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className={`inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white ${
                  isResetting 
                    ? 'bg-red-300 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                } sm:text-sm`}
              >
                {isResetting ? 'Resetting...' : 'Reset Application'}
              </button>
            </div>
            
            {message && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {message}
                    </p>
                    <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                      Redirecting to dashboard in a few seconds...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400 dark:text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetApp;
