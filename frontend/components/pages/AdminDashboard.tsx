import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ تم إضافتها
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

export default function AdminDashboard() {
  const [applications, setApplications] = useState<GuideApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<GuideApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // ✅ نستخدمه بدل prop

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
        await fetchApplications();
        setSelectedApplication(null);
        alert(`Application ${newStatus} successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update: ${errorData.message || 'Unknown error'}`);
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Loading applications...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p>{error}</p>
          <Button onClick={fetchApplications}>Retry</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (selectedApplication) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => setSelectedApplication(null)}>← Back</Button>
        <h2 className="text-2xl font-semibold mt-4">{selectedApplication.full_name}</h2>
        <p className="text-gray-600 mb-4">{selectedApplication.email}</p>
        <Button onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')} className="bg-green-600 text-white mr-3">Approve</Button>
        <Button onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')} variant="destructive">Reject</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Manage tour guide applications</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button> {/* ✅ بدل prop */}
        </div>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 border rounded-lg px-3 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredApplications.map(app => (
          <Card key={app.id} className="mb-4">
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <h3 className="font-semibold">{app.full_name}</h3>
                <p className="text-sm text-gray-600">{app.email}</p>
              </div>
              <Button onClick={() => setSelectedApplication(app)} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1" /> Review
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
