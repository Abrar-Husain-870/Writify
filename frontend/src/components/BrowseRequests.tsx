import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

interface Client {
    id: number;
    name: string;
    rating: number | string;
    total_ratings: number;
}

interface AssignmentRequest {
    id: number;
    client: Client;
    course_name: string;
    course_code: string;
    assignment_type: string;
    num_pages: number;
    deadline: string;
    expiration_deadline: string;
    estimated_cost: number;
    status: 'open' | 'assigned' | 'completed';
    created_at: string;
}

const BrowseRequests: React.FC = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<AssignmentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/assignment-requests', {
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            // Ensure data is an array before setting it
            if (Array.isArray(data)) {
                setRequests(data);
            } else {
                console.error('Expected array but got:', data);
                setRequests([]);
                setError('Received invalid data format from server');
            }
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching requests:', err);
            setRequests([]);
            setError(`Failed to load requests: ${err.message}`);
            setLoading(false);
        });
    }, []);

    const getAssignmentTypeIcon = (type: string) => {
        switch (type) {
            case 'class_assignment':
                return (
                    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                );
            case 'lab_files':
                return (
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                );
            case 'graphic_design':
                return (
                    <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
            case 'workshop_files':
                return (
                    <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const formatAssignmentType = (type: string) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleAcceptRequest = async (requestId: number) => {
        try {
            setAcceptingId(requestId);
            const response = await fetch(`http://localhost:5000/api/assignment-requests/${requestId}/accept`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                // Open WhatsApp with the client's number
                const message = encodeURIComponent(`Hi, I've accepted your assignment request for ${data.course_name}. Let's discuss the details.`);
                window.open(`https://wa.me/${data.client_whatsapp}?text=${message}`, '_blank');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error accepting request:', error);
        } finally {
            setAcceptingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header title="Browse Requests" />

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="col-span-full text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Requests</h3>
                        <p className="mt-1 text-sm text-gray-500">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignment requests</h3>
                                <p className="mt-1 text-sm text-gray-500">There are no open assignment requests at the moment.</p>
                            </div>
                        ) : (
                            requests.map(request => (
                                <div key={request.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{request.course_name}</h3>
                                                <p className="text-sm text-gray-600">{request.course_code}</p>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {request.assignment_type}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-4 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Pages:</span>
                                                <span className="text-sm font-medium text-gray-900">{request.num_pages}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Deadline:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {new Date(request.deadline).toLocaleDateString()} 
                                                    ({Math.ceil((new Date(request.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Estimated Cost:</span>
                                                <span className="text-sm font-medium text-gray-900">₹{request.estimated_cost}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Expires:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {new Date(request.expiration_deadline).toLocaleDateString()} 
                                                    ({Math.ceil((new Date(request.expiration_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {request.client.name}
                                                    </p>
                                                    <div className="flex items-center">
                                                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                        <span className="ml-1 text-sm text-gray-500">
                                                            {request.client.rating 
                                                                ? (typeof request.client.rating === 'number' 
                                                                    ? request.client.rating.toFixed(1) 
                                                                    : parseFloat(String(request.client.rating)).toFixed(1))
                                                                : 'N/A'} ({request.client.total_ratings || 0})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6">
                                            <button
                                                onClick={() => handleAcceptRequest(request.id)}
                                                disabled={acceptingId === request.id}
                                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                {acceptingId === request.id ? 'Accepting...' : 'Accept Request'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default BrowseRequests;
