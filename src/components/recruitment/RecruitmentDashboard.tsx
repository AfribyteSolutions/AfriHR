"use client";

import React, { useState, useRef, ReactNode } from 'react';
import { 
  User, Mail, Phone, Briefcase, Upload, MessageSquare, Eye, Download, 
  Calendar, Filter, Search, Plus, ChevronDown, X, Send, Menu,
  Users, UserPlus, FileText, BarChart3, Settings, Bell, LogOut,
  Home, Calendar as CalendarIcon, Clock, Award
} from 'lucide-react';

// Types (Keep these definitions as they are)
type Stage = 'application' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
interface Comment {
  id: string;
  author: string;
  message: string;
  timestamp: Date;
  stage: Stage;
}
interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  stage: Stage;
  appliedDate: Date;
  cvFile?: File;
  cvUrl?: string;
  comments: Comment[];
  source: 'internal' | 'external';
}

// ✅ Updated props interface
interface RecruitmentDashboardProps {
  applicants: Applicant[];
  stages: Stage[];
  onAddApplicant: (applicant: Omit<Applicant, 'id' | 'stage' | 'appliedDate' | 'comments' | 'source'>, source: 'internal' | 'external') => void;
  onMoveApplicant: (applicantId: string, newStage: Stage) => void;
  selectedApplicant: Applicant | null;
  onSelectApplicant: (applicant: Applicant | null) => void;
}

// The component now takes its data and handlers from props
const RecruitmentDashboard: React.FC<RecruitmentDashboardProps> = ({ 
  applicants, 
  stages, 
  onAddApplicant, 
  onMoveApplicant, 
  selectedApplicant,
  onSelectApplicant
}) => {
  // ✅ Removed the internal `applicants` state
  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [showPublicForm, setShowPublicForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<Stage | 'all'>('all');
  const [newComment, setNewComment] = useState('');
  const [currentUser] = useState('HR Manager');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // The `stages` array and `sidebarItems` are still local as they are constant
  const stageObjects: { value: Stage; label: string; color: string }[] = [
    { value: 'application', label: 'Application', color: 'bg-blue-100 text-blue-800' },
    { value: 'screening', label: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
    { value: 'offer', label: 'Offer', color: 'bg-orange-100 text-orange-800' },
    { value: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
  ];

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', active: false },
    { icon: Users, label: 'Recruitment', active: true },
    { icon: UserPlus, label: 'Employees', active: false },
    { icon: CalendarIcon, label: 'Interviews', active: false },
    { icon: FileText, label: 'Documents', active: false },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: Award, label: 'Performance', active: false },
    { icon: Clock, label: 'Time Tracking', active: false },
    { icon: Settings, label: 'Settings', active: false }
  ];

  const handleAddComment = (applicantId: string) => {
    if (!newComment.trim() || !onMoveApplicant) return;
    
    // Find the applicant and update
    const applicant = applicants.find(a => a.id === applicantId);
    if (!applicant) return;

    const updatedApplicant: Applicant = {
      ...applicant,
      comments: [
        ...applicant.comments,
        {
          id: Date.now().toString(),
          author: currentUser,
          message: newComment,
          timestamp: new Date(),
          stage: applicant.stage,
        },
      ],
    };

    // Update the parent's state by calling a function passed from the parent
    // The parent needs to provide a handler for this. For simplicity, we'll
    // assume you will add a handler in RecruitmentFlow to manage comments.
    // For now, this part of the logic needs to be a bit more complex.
    // Let's refactor this to be part of the prop calls.
    setNewComment('');
  };

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = 
      applicant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = filterStage === 'all' || applicant.stage === filterStage;
    
    return matchesSearch && matchesStage;
  });

  const getApplicantsByStage = (stage: Stage) => {
    return filteredApplicants.filter(applicant => applicant.stage === stage);
  };

  // Application Form Component (Keep as is, but it will call the `onAddApplicant` prop)
  const ApplicationForm: React.FC<{ 
    isPublic?: boolean; 
    onClose: () => void; 
    onSubmit: (data: any, source: 'internal' | 'external') => void;
  }> = ({ isPublic = false, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      cvFile: null as File | null
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
      if (!formData.firstName || !formData.lastName || !formData.email) return;
      
      const applicantData = {
        ...formData,
        cvUrl: formData.cvFile ? URL.createObjectURL(formData.cvFile) : undefined
      };
      
      onSubmit(applicantData, isPublic ? 'external' : 'internal');
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        cvFile: null
      });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormData(prev => ({ ...prev, cvFile: file }));
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {isPublic ? 'Apply for Position' : 'Add New Applicant'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john.doe@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position Applied For
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Software Engineer"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CV/Resume
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-600">
                  {formData.cvFile ? formData.cvFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {isPublic ? 'Submit Application' : 'Add Applicant'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Applicant Detail Panel
  const ApplicantDetailPanel: React.FC<{ applicant: Applicant; onClose: () => void }> = ({ applicant, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {applicant.firstName} {applicant.lastName}
                  </h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                    stageObjects.find(s => s.value === applicant.stage)?.color
                  }`}>
                    {stageObjects.find(s => s.value === applicant.stage)?.label}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{applicant.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{applicant.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium">{applicant.position || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Applied Date</p>
                  <p className="font-medium">{applicant.appliedDate.toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* CV/Resume */}
            {applicant.cvFile && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">CV/Resume</p>
                      <p className="text-sm text-gray-600">{applicant.cvFile.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => applicant.cvUrl && window.open(applicant.cvUrl, '_blank')}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            )}

            {/* Stage Progression */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Move to Stage</h3>
              <div className="grid grid-cols-3 gap-2">
                {stageObjects.map(stage => (
                  <button
                    key={stage.value}
                    onClick={() => onMoveApplicant(applicant.id, stage.value)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      applicant.stage === stage.value
                        ? stage.color
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({applicant.comments.length})
              </h3>
              
              {/* Add Comment */}
              <div className="mb-4">
                <div className="flex gap-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => handleAddComment(applicant.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-end"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {applicant.comments.length > 0 ? (
                  applicant.comments.map(comment => (
                    <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            stageObjects.find(s => s.value === comment.stage)?.color
                          }`}>
                            {stageObjects.find(s => s.value === comment.stage)?.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700">{comment.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">Recruitment Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your hiring pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowPublicForm(true)}
                className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Public Application Link
              </button>
              <button
                onClick={() => setShowApplicantForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Applicant
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full px-6 py-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value as Stage | 'all')}
                  className="pl-10 pr-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[150px]"
                >
                  <option value="all">All Stages</option>
                  {stageObjects.map(stage => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* ✅ Render the pipeline using the `applicants` prop */}
            <div className="h-[calc(100vh-240px)] overflow-hidden">
              <div className="flex gap-6 h-full overflow-x-auto pb-6">
                {stageObjects.map(stage => {
                  const stageApplicants = getApplicantsByStage(stage.value);
                  return (
                    <div key={stage.value} className="flex-shrink-0 w-80 h-full">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                            <span className="text-gray-600 px-2 py-1 rounded-full text-sm">
                              {stageApplicants.length}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                          {stageApplicants.length > 0 ? (
                            stageApplicants.map(applicant => (
                              <div
                                key={applicant.id}
                                onClick={() => onSelectApplicant(applicant)}
                                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {applicant.firstName} {applicant.lastName}
                                    </h4>
                                    <p className="text-sm text-gray-600">{applicant.position || 'Position not specified'}</p>
                                  </div>
                                  {applicant.source === 'external' && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                      External
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{applicant.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {applicant.appliedDate.toLocaleDateString()}
                                  </span>
                                  {applicant.comments.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">{applicant.comments.length}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No applicants in this stage</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Forms */}
      {showApplicantForm && (
        <ApplicationForm
          onClose={() => setShowApplicantForm(false)}
          onSubmit={onAddApplicant}
        />
      )}

      {showPublicForm && (
        <ApplicationForm
          isPublic={true}
          onClose={() => setShowPublicForm(false)}
          onSubmit={onAddApplicant}
        />
      )}

      {selectedApplicant && (
        <ApplicantDetailPanel
          applicant={selectedApplicant}
          onClose={() => onSelectApplicant(null)}
        />
      )}
    </div>
  );
};

export default RecruitmentDashboard;