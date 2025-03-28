import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <Header title="Dashboard" showBackButton={false} />

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Welcome to Writify
                    </h2>
                    <p className="mt-2 sm:mt-3 max-w-2xl mx-auto text-base sm:text-xl text-gray-500 dark:text-gray-400">
                        Connect with writers or find assignments
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Find a Writer Card */}
                    <div 
                        onClick={() => navigate('/find-writer')}
                        className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                    >
                        <div className="px-4 py-5 sm:p-6 flex-grow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-blue-500 dark:bg-blue-600 rounded-md p-3">
                                    <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                        Find a Writer
                                    </h3>
                                    <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                        Browse through our talented writers and find the perfect match for your assignment.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-4 sm:px-6">
                            <div className="text-sm">
                                <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                                    Find a writer now <span aria-hidden="true">&rarr;</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Browse Requests Card */}
                    <div 
                        onClick={() => navigate('/browse-requests')}
                        className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                    >
                        <div className="px-4 py-5 sm:p-6 flex-grow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-500 dark:bg-green-600 rounded-md p-3">
                                    <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                        Browse Requests
                                    </h3>
                                    <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                        Browse open assignment requests and offer your writing services.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-4 sm:px-6">
                            <div className="text-sm">
                                <span className="font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300">
                                    Browse requests <span aria-hidden="true">&rarr;</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* My Assignments Card */}
                    <div 
                        onClick={() => navigate('/my-assignments')}
                        className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                    >
                        <div className="px-4 py-5 sm:p-6 flex-grow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-amber-500 dark:bg-amber-600 rounded-md p-3">
                                    <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                        My Assignments
                                    </h3>
                                    <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                        View and manage your current and completed assignments.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-4 sm:px-6">
                            <div className="text-sm">
                                <span className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300">
                                    View assignments <span aria-hidden="true">&rarr;</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* My Profile Card */}
                    <div 
                        onClick={() => navigate('/profile')}
                        className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                    >
                        <div className="px-4 py-5 sm:p-6 flex-grow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-purple-500 dark:bg-purple-600 rounded-md p-3">
                                    <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                        My Profile
                                    </h3>
                                    <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                        View and update your profile information and portfolio.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-4 sm:px-6">
                            <div className="text-sm">
                                <span className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300">
                                    View profile <span aria-hidden="true">&rarr;</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* My Ratings Card */}
                    <div 
                        onClick={() => navigate('/my-ratings')}
                        className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                    >
                        <div className="px-4 py-5 sm:p-6 flex-grow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-yellow-500 dark:bg-yellow-600 rounded-md p-3">
                                    <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                        My Ratings & Reviews
                                    </h3>
                                    <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                        View your ratings and feedback from clients.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-4 sm:px-6">
                            <div className="text-sm">
                                <span className="font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300">
                                    View ratings <span aria-hidden="true">&rarr;</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;