import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import RatingModal from './RatingModal';
import config from '../config';

interface User {
  id: number;
  name: string;
  email: string;
  profile_picture: string;
  rating: number;
  total_ratings: number;
  whatsapp_number?: string;
}

interface Assignment {
  id: number;
  request_id: number;
  writer: User | null;
  client: User;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  course_name: string;
  course_code: string;
  assignment_type: string;
  num_pages: number;
  deadline: string;
  estimated_cost: number;
  has_rated_writer: boolean;
  has_rated_client: boolean;
}

const MyAssignments: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'client' | 'writer' | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [updatingWhatsApp, setUpdatingWhatsApp] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${config.apiUrl}/api/my-assignments`, {
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
        console.log('Assignments data:', data);
        setAssignments(data.assignments);
        setUserRole(data.role);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError('Failed to load assignments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [navigate]);

  const handleCompleteAssignment = async (assignmentId: number) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/assignments/${assignmentId}/complete`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to complete assignment');
      }

      // Update the assignment status in the local state
      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, status: 'completed', completed_at: new Date().toISOString() } 
            : assignment
        )
      );
    } catch (error) {
      console.error('Error completing assignment:', error);
      setError('Failed to complete assignment. Please try again.');
    }
  };

  const openRatingModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowRatingModal(true);
  };

  const handleRatingSubmitted = () => {
    if (!selectedAssignment) return;
    
    // Update the local state to reflect that the user has rated
    setAssignments(prevAssignments => 
      prevAssignments.map(assignment => {
        if (assignment.id === selectedAssignment.id) {
          if (userRole === 'client') {
            return { ...assignment, has_rated_writer: true };
          } else {
            return { ...assignment, has_rated_client: true };
          }
        }
        return assignment;
      })
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingButtonText = (assignment: Assignment) => {
    // Don't show rating button for pending assignments
    if (!assignment.writer) {
      return 'Pending Writer';
    }
    if (userRole === 'client' && assignment.has_rated_writer) {
      return 'Writer Rated';
    } else if (userRole === 'writer' && assignment.has_rated_client) {
      return 'Client Rated';
    } else {
      return userRole === 'client' ? 'Rate Writer' : 'Rate Client';
    }
  };

  const isRatingDisabled = (assignment: Assignment) => {
    // Disable rating if no writer assigned or already rated
    return !assignment.writer || 
           (userRole === 'client' && assignment.has_rated_writer) || 
           (userRole === 'writer' && assignment.has_rated_client);
  };

  // Helper function to safely format a rating
  const formatRating = (rating: any): string => {
    if (rating === null || rating === undefined) return '0.0';
    if (typeof rating === 'number') return rating.toFixed(1);
    try {
      const numRating = parseFloat(String(rating));
      return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
    } catch (e) {
      return '0.0';
    }
  };

  const updateWhatsAppNumber = async () => {
    try {
      setUpdatingWhatsApp(true);
      const response = await fetch(`${config.apiUrl}/api/update-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ whatsapp_number: whatsappNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to update WhatsApp number');
      }

      alert('WhatsApp number updated successfully! Please refresh the page.');
      setShowWhatsAppModal(false);
    } catch (error) {
      console.error('Error updating WhatsApp number:', error);
      alert('Failed to update WhatsApp number. Please try again.');
    } finally {
      setUpdatingWhatsApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="My Assignments" />

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
        ) : assignments.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {userRole === 'client' 
                ? "You haven't created any assignment requests yet." 
                : "You haven't accepted any assignments yet."}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate(userRole === 'client' ? '/create-assignment' : '/browse-requests')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {userRole === 'client' ? 'Create Assignment Request' : 'Browse Requests'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Rating Instructions</h2>
              <p className="text-gray-600 dark:text-gray-300">
                You can rate {userRole === 'client' ? 'writers' : 'clients'} once an assignment has been accepted. 
                Your ratings help build trust in our community and provide valuable feedback.
              </p>
              <ul className="mt-2 list-disc list-inside text-gray-600 dark:text-gray-300">
                <li>Ratings are on a scale of 1-5 stars</li>
                <li>You can only rate each {userRole === 'client' ? 'writer' : 'client'} once per assignment</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {assignments.map((assignment) => (
                  <li key={assignment.id}>
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                            {assignment.course_name} ({assignment.course_code})
                          </h3>
                          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            {assignment.assignment_type} - {assignment.num_pages} pages
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            assignment.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                              : assignment.status === 'cancelled' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
                                : assignment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                          }`}>
                            {assignment.status.replace('_', ' ').charAt(0).toUpperCase() + assignment.status.replace('_', ' ').slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {assignment.writer && assignment.writer.profile_picture ? (
                                <img 
                                  className="h-10 w-10 rounded-full" 
                                  src={assignment.writer.profile_picture} 
                                  alt="" 
                                />
                              ) : (
                                <svg className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {assignment.writer ? 'Writer' : 'Client'}: {assignment.writer ? assignment.writer.name : assignment.client.name}
                              </p>
                              <div className="flex items-center">
                                <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                                  {assignment.writer ? 
                                    formatRating(assignment.writer.rating) : 
                                    formatRating(assignment.client.rating)} 
                                  ({assignment.writer ? 
                                    assignment.writer.total_ratings || 0 : 
                                    assignment.client.total_ratings || 0})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Created:</span>
                            <span className="text-sm text-gray-900 dark:text-white">{formatDate(assignment.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Deadline:</span>
                            <span className="text-sm text-gray-900 dark:text-white">{formatDate(assignment.deadline)}</span>
                          </div>
                          {assignment.completed_at && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Completed:</span>
                              <span className="text-sm text-gray-900 dark:text-white">{formatDate(assignment.completed_at)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Cost:</span>
                            <span className="text-sm text-gray-900 dark:text-white">₹{assignment.estimated_cost}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 flex justify-end space-x-3">
                        {userRole === 'writer' && assignment.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteAssignment(assignment.id)}
                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Mark as Completed
                          </button>
                        )}
                        
                        <button
                          onClick={() => openRatingModal(assignment)}
                          disabled={isRatingDisabled(assignment)}
                          className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                            isRatingDisabled(assignment)
                              ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                              : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          }`}
                        >
                          {getRatingButtonText(assignment)}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* WhatsApp Number Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Update WhatsApp Number</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Your WhatsApp number is missing or incorrect. Please enter your WhatsApp number with country code (e.g., 919876543210 for India).
            </p>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="WhatsApp number with country code"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={updateWhatsAppNumber}
                disabled={updatingWhatsApp || !whatsappNumber}
                className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  updatingWhatsApp || !whatsappNumber
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {updatingWhatsApp ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && selectedAssignment && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          ratedUserId={selectedAssignment && (userRole === 'client' ? selectedAssignment.writer?.id || 0 : selectedAssignment.client.id)}
          ratedUserName={selectedAssignment && (userRole === 'client' ? selectedAssignment.writer?.name || 'Unknown' : selectedAssignment.client.name)}
          assignmentRequestId={selectedAssignment?.request_id || 0}
          onRatingSubmitted={handleRatingSubmitted}
          userType={userRole === 'client' ? 'writer' : 'client'}
        />
      )}
    </div>
  );
};

export default MyAssignments;
