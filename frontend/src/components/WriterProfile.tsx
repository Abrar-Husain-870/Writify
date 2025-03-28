import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './Header';

interface Writer {
    id: number;
    name: string;
    rating: number | string;
    total_ratings: number;
    writer_status: 'active' | 'busy' | 'inactive';
    university_stream: string;
    whatsapp_number: string;
    sample_work_image: string;
}

interface AssignmentRequest {
    course_name: string;
    course_code: string;
    assignment_type: string;
    num_pages: number;
    deadline: string;
    estimated_cost: number;
    whatsapp_number: string;
}

const WriterProfile: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [writer, setWriter] = useState<Writer | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<AssignmentRequest>({
        course_name: '',
        course_code: '',
        assignment_type: 'class_assignment',
        num_pages: 1,
        deadline: '',
        estimated_cost: 50,
        whatsapp_number: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetch(`http://localhost:5000/api/writers/${id}`, {
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            setWriter(data);
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching writer:', err);
            setLoading(false);
        });
    }, [id]);

    const validateForm = () => {
        // Validate field lengths based on database constraints
        if (formData.course_name.length > 255) {
            setError('Course name must be less than 255 characters');
            return false;
        }
        
        if (formData.course_code.length > 50) {
            setError('Course code must be less than 50 characters');
            return false;
        }
        
        if (formData.assignment_type.length > 100) {
            setError('Assignment type must be less than 100 characters');
            return false;
        }
        
        // Validate numeric fields
        if (isNaN(parseInt(formData.num_pages.toString())) || parseInt(formData.num_pages.toString()) <= 0) {
            setError('Number of pages must be a positive number');
            return false;
        }
        
        if (isNaN(parseFloat(formData.estimated_cost.toString())) || parseFloat(formData.estimated_cost.toString()) <= 0 || parseFloat(formData.estimated_cost.toString()) % 50 !== 0) {
            setError('Estimated cost must be a positive multiple of 50');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        
        // Validate form before submission
        if (!validateForm()) {
            setSubmitting(false);
            return;
        }
        
        try {
            // Truncate values to match database constraints
            const sanitizedData = {
                ...formData,
                course_name: formData.course_name.substring(0, 255),
                course_code: formData.course_code.substring(0, 50),
                assignment_type: formData.assignment_type.substring(0, 100),
                num_pages: parseInt(formData.num_pages.toString()),
                estimated_cost: parseFloat(formData.estimated_cost.toString())
            };
            
            const response = await fetch('http://localhost:5000/api/assignment-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(sanitizedData)
            });

            if (response.ok) {
                let whatsappNumber = writer?.whatsapp_number || '';
                
                whatsappNumber = whatsappNumber.replace(/\D/g, '');
                
                if (!whatsappNumber.startsWith('+')) {
                    if (!whatsappNumber.startsWith('91')) {
                        whatsappNumber = '91' + whatsappNumber;
                    }
                }
                
                const message = encodeURIComponent(`Hi, I've submitted an assignment request for ${formData.course_name}. Let's discuss the details.`);
                
                setSuccess('Request submitted successfully! Connecting to WhatsApp...');
                
                setTimeout(() => {
                    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                    
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1000);
                }, 500);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to submit request. Please try again.');
                console.error('Error response:', errorData);
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
            </div>
        );
    }

    if (!writer) {
        return <div className="dark:text-white">Writer not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <Header title={writer ? `${writer.name}'s Profile` : 'Writer Profile'} />

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Writer Profile Section */}
                    <div>
                        <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sample Work</h3>
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    <img 
                                        src={writer.sample_work_image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e96ddb7f%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e96ddb7f%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22120%22%20y%3D%22160%22%3ENo%20Sample%20Work%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'} 
                                        alt="Sample work" 
                                        className="w-full object-cover"
                                        style={{ maxHeight: '400px' }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e96ddb7f%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e96ddb7f%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22120%22%20y%3D%22160%22%3EImage%20Not%20Found%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                                            target.onerror = null; // Prevent infinite error loop
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{writer.name}</h2>
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="ml-1 text-gray-600 dark:text-gray-400">{typeof writer.rating === 'number' ? writer.rating.toFixed(1) : writer.rating} ({writer.total_ratings} reviews)</span>
                                    </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">Studying {writer.university_stream}</p>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-gray-600 dark:text-gray-400">Status: {writer.writer_status}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="text-gray-600 dark:text-gray-400">WhatsApp: {writer.whatsapp_number}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assignment Request Form */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Submit Assignment Request</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Name</label>
                                <input
                                    type="text"
                                    name="course_name"
                                    value={formData.course_name}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Code</label>
                                <input
                                    type="text"
                                    name="course_code"
                                    value={formData.course_code}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignment Type</label>
                                <select
                                    name="assignment_type"
                                    value={formData.assignment_type}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="class_assignment">Class Assignment</option>
                                    <option value="lab_files">Lab Files</option>
                                    <option value="graphic_design">Graphic Design</option>
                                    <option value="workshop_files">Workshop Files</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Pages</label>
                                <input
                                    type="number"
                                    name="num_pages"
                                    value={formData.num_pages}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
                                <input
                                    type="datetime-local"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Cost (₹)</label>
                                <input
                                    type="number"
                                    name="estimated_cost"
                                    value={formData.estimated_cost}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        // Round to the nearest multiple of 50
                                        const roundedValue = Math.round(value / 50) * 50;
                                        setFormData({
                                            ...formData,
                                            estimated_cost: roundedValue
                                        });
                                    }}
                                    required
                                    min="50"
                                    step="50"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Cost must be in multiples of ₹50
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your WhatsApp Number</label>
                                <input
                                    type="tel"
                                    name="whatsapp_number"
                                    value={formData.whatsapp_number}
                                    onChange={handleChange}
                                    required
                                    placeholder="+91XXXXXXXXXX"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                <p>Note: Your request will be visible to writers for 7 days. After that, it will expire and no longer be visible in the marketplace.</p>
                            </div>

                            {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
                            {success && <p className="text-green-500 dark:text-green-400">{success}</p>}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {submitting ? 'Submitting...' : 'Submit Request & Connect on WhatsApp'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WriterProfile;
