'use client';

import React, { useState } from 'react';
import { 
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface FeedbackFormData {
  session_id: string;
  participant_role: string;
  feedback_type: string;
  rating: number;
  comments: string;
  specific_feature?: string;
  improvement_suggestions: string[];
  cultural_concerns: string[];
  privacy_concerns: string[];
  accessibility_issues: string[];
}

interface FeedbackSubmissionFormProps {
  sessionId: string;
  onSubmit: (feedback: FeedbackFormData) => void;
  onCancel: () => void;
}

export default function FeedbackSubmissionForm({ 
  sessionId, 
  onSubmit, 
  onCancel 
}: FeedbackSubmissionFormProps) {
  const [formData, setFormData] = useState<FeedbackFormData>({
    session_id: sessionId,
    participant_role: 'community_member',
    feedback_type: 'general',
    rating: 0,
    comments: '',
    specific_feature: '',
    improvement_suggestions: [],
    cultural_concerns: [],
    privacy_concerns: [],
    accessibility_issues: []
  });

  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [currentConcern, setCurrentConcern] = useState('');
  const [currentPrivacyConcern, setCurrentPrivacyConcern] = useState('');
  const [currentAccessibilityIssue, setCurrentAccessibilityIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const participantRoles = [
    { value: 'community_member', label: 'Community Member' },
    { value: 'elder', label: 'Elder' },
    { value: 'youth', label: 'Youth' },
    { value: 'leader', label: 'Community Leader' },
    { value: 'external', label: 'External Participant' }
  ];

  const feedbackTypes = [
    { value: 'general', label: 'General Feedback' },
    { value: 'feature_usability', label: 'Feature Usability' },
    { value: 'cultural_appropriateness', label: 'Cultural Appropriateness' },
    { value: 'intelligence_accuracy', label: 'Intelligence Accuracy' }
  ];

  const features = [
    'Community Dashboard',
    'Story Submission',
    'AI Analysis',
    'Cultural Safety Review',
    'Community Health Indicators',
    'Service Gap Analysis',
    'Success Patterns',
    'Government Dashboard',
    'Worker/NGO Dashboard',
    'Mobile Interface',
    'Accessibility Features'
  ];

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }));
    }
  };

  const addSuggestion = () => {
    if (currentSuggestion.trim()) {
      setFormData(prev => ({
        ...prev,
        improvement_suggestions: [...prev.improvement_suggestions, currentSuggestion.trim()]
      }));
      setCurrentSuggestion('');
    }
  };

  const removeSuggestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      improvement_suggestions: prev.improvement_suggestions.filter((_, i) => i !== index)
    }));
  };

  const addConcern = () => {
    if (currentConcern.trim()) {
      setFormData(prev => ({
        ...prev,
        cultural_concerns: [...prev.cultural_concerns, currentConcern.trim()]
      }));
      setCurrentConcern('');
    }
  };

  const removeConcern = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cultural_concerns: prev.cultural_concerns.filter((_, i) => i !== index)
    }));
  };

  const addPrivacyConcern = () => {
    if (currentPrivacyConcern.trim()) {
      setFormData(prev => ({
        ...prev,
        privacy_concerns: [...prev.privacy_concerns, currentPrivacyConcern.trim()]
      }));
      setCurrentPrivacyConcern('');
    }
  };

  const removePrivacyConcern = (index: number) => {
    setFormData(prev => ({
      ...prev,
      privacy_concerns: prev.privacy_concerns.filter((_, i) => i !== index)
    }));
  };

  const addAccessibilityIssue = () => {
    if (currentAccessibilityIssue.trim()) {
      setFormData(prev => ({
        ...prev,
        accessibility_issues: [...prev.accessibility_issues, currentAccessibilityIssue.trim()]
      }));
      setCurrentAccessibilityIssue('');
    }
  };

  const removeAccessibilityIssue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      accessibility_issues: prev.accessibility_issues.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Please provide a rating';
    }

    if (!formData.comments.trim()) {
      newErrors.comments = 'Please provide comments';
    }

    if (formData.feedback_type === 'feature_usability' && !formData.specific_feature) {
      newErrors.specific_feature = 'Please select a specific feature';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Submit Preview Feedback</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your feedback helps us improve the Community Intelligence Platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Participant Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Role
          </label>
          <select
            value={formData.participant_role}
            onChange={(e) => setFormData(prev => ({ ...prev, participant_role: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {participantRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Feedback Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback Type
          </label>
          <select
            value={formData.feedback_type}
            onChange={(e) => setFormData(prev => ({ ...prev, feedback_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {feedbackTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Specific Feature (if feature usability feedback) */}
        {formData.feedback_type === 'feature_usability' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Feature
            </label>
            <select
              value={formData.specific_feature}
              onChange={(e) => setFormData(prev => ({ ...prev, specific_feature: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.specific_feature ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a feature</option>
              {features.map(feature => (
                <option key={feature} value={feature}>
                  {feature}
                </option>
              ))}
            </select>
            {errors.specific_feature && (
              <p className="mt-1 text-sm text-red-600">{errors.specific_feature}</p>
            )}
          </div>
        )}

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className="focus:outline-none"
              >
                {star <= formData.rating ? (
                  <StarIconSolid className="h-8 w-8 text-yellow-400" />
                ) : (
                  <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                )}
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {formData.rating > 0 && `${formData.rating} out of 5 stars`}
            </span>
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comments
          </label>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.comments ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Please share your detailed feedback..."
          />
          {errors.comments && (
            <p className="mt-1 text-sm text-red-600">{errors.comments}</p>
          )}
        </div>

        {/* Improvement Suggestions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Improvement Suggestions
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={currentSuggestion}
              onChange={(e) => setCurrentSuggestion(e.target.value)}
              placeholder="Add an improvement suggestion..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSuggestion())}
            />
            <button
              type="button"
              onClick={addSuggestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.improvement_suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                <span className="text-sm text-gray-700">{suggestion}</span>
                <button
                  type="button"
                  onClick={() => removeSuggestion(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cultural Concerns */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ExclamationTriangleIcon className="h-4 w-4 inline mr-1 text-orange-500" />
            Cultural Concerns
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={currentConcern}
              onChange={(e) => setCurrentConcern(e.target.value)}
              placeholder="Add a cultural concern..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addConcern())}
            />
            <button
              type="button"
              onClick={addConcern}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.cultural_concerns.map((concern, index) => (
              <div key={index} className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded-md">
                <span className="text-sm text-gray-700">{concern}</span>
                <button
                  type="button"
                  onClick={() => removeConcern(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Concerns */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Privacy Concerns
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={currentPrivacyConcern}
              onChange={(e) => setCurrentPrivacyConcern(e.target.value)}
              placeholder="Add a privacy concern..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrivacyConcern())}
            />
            <button
              type="button"
              onClick={addPrivacyConcern}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.privacy_concerns.map((concern, index) => (
              <div key={index} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-md">
                <span className="text-sm text-gray-700">{concern}</span>
                <button
                  type="button"
                  onClick={() => removePrivacyConcern(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility Issues */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accessibility Issues
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={currentAccessibilityIssue}
              onChange={(e) => setCurrentAccessibilityIssue(e.target.value)}
              placeholder="Add an accessibility issue..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessibilityIssue())}
            />
            <button
              type="button"
              onClick={addAccessibilityIssue}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.accessibility_issues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-md">
                <span className="text-sm text-gray-700">{issue}</span>
                <button
                  type="button"
                  onClick={() => removeAccessibilityIssue(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}