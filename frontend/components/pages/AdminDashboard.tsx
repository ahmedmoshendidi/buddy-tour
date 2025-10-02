import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Filter,
  Search,
  Calendar,
  MapPin,
  Languages,
  GraduationCap
} from 'lucide-react';


interface Language {
  language: string;
  proficiency: string;
}

interface GuideApplication {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  current_city: string;
  education_level: string;
  current_occupation: string;
  tour_experience: string;
  languages: Language[];
  licenses: string;
  preferred_cities: string[];
  available_days: string[];
  tour_types: string[];
  group_size_preference: string;
  knowledge_areas: string[];
  special_skills: string;
  motivation: string;
  unique_value: string;
  portfolio: string;
  references: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

interface AdminDashboardProps {
  onBackToHome: () => void;
}

export default function AdminDashboard({ onBackToHome }: AdminDashboardProps) {
  const [applications, setApplications] = useState<GuideApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<GuideApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch applications from API
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tour-guide-applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'admin_secret_token_2024'}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setApplications(data.applications || []);
      } else {
        setError(data.message || 'Failed to load applications');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: number, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/tour-guide-applications/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'admin_secret_token_2024'}`
        },
        body: JSON.stringify({ status: newStatus, reviewedBy: 'Admin' }),
      });

      if (response.ok) {
        // Refresh applications list
        await fetchApplications();
        // Close detail view
        setSelectedApplication(null);
        alert(`Application ${newStatus} successfully! Email notification sent to applicant.`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update application status: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.current_city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchApplications}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedApplication) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedApplication(null)}
              className="mb-4"
            >
              ← Back to Applications
            </Button>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
                <p className="text-gray-600">{selectedApplication.full_name}</p>
              </div>
              <Badge className={getStatusColor(selectedApplication.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(selectedApplication.status)}
                  {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                </span>
              </Badge>
            </div>
          </div>

          {/* Application Details */}
          <div className="grid gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedApplication.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{selectedApplication.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Age</label>
                  <p className="text-gray-900">{selectedApplication.age}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="text-gray-900">{selectedApplication.current_city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Education</label>
                  <p className="text-gray-900">{selectedApplication.education_level}</p>
                </div>
              </CardContent>
            </Card>

            {/* Professional Background */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Professional Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Occupation</label>
                  <p className="text-gray-900">{selectedApplication.current_occupation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tour Experience</label>
                  <p className="text-gray-900">{selectedApplication.tour_experience}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Languages</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {/* {selectedApplication.languages.map((lang, index) => (
                      <Badge key={index} variant="outline">{lang}</Badge>
                    ))} */}
                    {selectedApplication.languages?.map((lang, index) => (
                      <Badge key={index} variant="outline">
                        {lang.language} ({lang.proficiency})
                      </Badge>
                    ))}

                  </div>
                </div>
                {selectedApplication.licenses && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Licenses/Certifications</label>
                    <p className="text-gray-900">{selectedApplication.licenses}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tour Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Tour Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Preferred Cities</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.preferred_cities.map((city, index) => (
                      <Badge key={index} variant="outline">{city}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Available Days</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.available_days.map((day, index) => (
                      <Badge key={index} variant="outline">{day}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tour Types</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.tour_types.map((type, index) => (
                      <Badge key={index} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Group Size Preference</label>
                  <p className="text-gray-900">{selectedApplication.group_size_preference}</p>
                </div>
              </CardContent>
            </Card>

            {/* Qualifications & Motivation */}
            <Card>
              <CardHeader>
                <CardTitle>Qualifications & Motivation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Knowledge Areas</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.knowledge_areas.map((area, index) => (
                      <Badge key={index} variant="outline">{area}</Badge>
                    ))}
                  </div>
                </div>
                {selectedApplication.special_skills && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Special Skills</label>
                    <p className="text-gray-900">{selectedApplication.special_skills}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Motivation</label>
                  <p className="text-gray-900">{selectedApplication.motivation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unique Value Proposition</label>
                  <p className="text-gray-900">{selectedApplication.unique_value}</p>
                </div>
                {selectedApplication.portfolio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Portfolio/Examples</label>
                    <p className="text-gray-900">{selectedApplication.portfolio}</p>
                  </div>
                )}
                {selectedApplication.references && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">References</label>
                    <p className="text-gray-900">{selectedApplication.references}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {selectedApplication.status === 'pending' && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white px-8"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Application
                    </Button>
                    <Button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                      variant="destructive"
                      className="px-8"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage tour guide applications</p>
            </div>
            <Button variant="outline" onClick={onBackToHome}>
              Back to Home
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {applications.filter(app => app.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {applications.filter(app => app.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {applications.filter(app => app.status === 'rejected').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        <div className="grid gap-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Applications will appear here once submitted.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.full_name}
                        </h3>
                        <Badge className={getStatusColor(application.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {application.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {application.current_city}
                        </div>
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4" />
                          {application.languages.length} languages
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(application.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {application.preferred_cities.slice(0, 3).map((city, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {city}
                          </Badge>
                        ))}
                        {application.preferred_cities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{application.preferred_cities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedApplication(application)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}