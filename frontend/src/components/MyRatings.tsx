import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import config from '../config';

interface Rating {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  rater_id: number;
  rater_name: string;
  rater_profile_picture: string;
  course_name: string;
  course_code: string;
  assignment_type: string;
}

const MyRatings: React.FC = () => {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${config.apiUrl}/api/my-ratings`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.error('Authentication error');
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Ratings data:', data);
        setRatings(data.ratings);
        setAverageRating(parseFloat(data.averageRating) || 0);
        setTotalRatings(data.totalRatings);
      } catch (error) {
        console.error('Error fetching ratings:', error);
        setError('Failed to load ratings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg 
          key={i} 
          className={`h-5 w-5 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="My Ratings & Reviews" />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Overall Rating</h2>
                  <p className="text-gray-600 dark:text-gray-400">Based on {totalRatings} review{totalRatings !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center">
                  <div className="flex mr-2">
                    {renderStars(averageRating)}
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {ratings.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No ratings yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You haven't received any ratings yet. As you complete assignments, clients will be able to rate your work.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {ratings.map((rating) => (
                    <li key={rating.id} className="p-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {rating.rater_profile_picture ? (
                            <img 
                              className="h-12 w-12 rounded-full" 
                              src={rating.rater_profile_picture} 
                              alt={`${rating.rater_name}'s profile`} 
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                                {rating.rater_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{rating.rater_name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(rating.created_at)}</p>
                          </div>
                          <div className="mt-1 flex">
                            {renderStars(rating.rating)}
                          </div>
                          <div className="mt-2">
                            <p className="text-gray-700 dark:text-gray-300">{rating.comment || 'No comment provided'}</p>
                          </div>
                          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                            <p>Assignment: {rating.course_name} ({rating.course_code}) - {rating.assignment_type}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyRatings;
