'use client';

import React, { useState } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Input } from '@/components/core';

interface CommunityInput {
  title: string;
  content: string;
  type: 'youth-roundtable' | 'elder-consultation' | 'success-story' | 'systems-change' | 'community-feedback';
  culturalSensitivity: 'public' | 'community' | 'sacred';
  location: string;
  participantCount?: number;
  contactEmail: string;
}

export default function CommunityInputPage() {
  const [formData, setFormData] = useState<CommunityInput>({
    title: '',
    content: '',
    type: 'community-feedback',
    culturalSensitivity: 'public',
    location: '',
    participantCount: undefined,
    contactEmail: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/community-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Reset form
        setFormData({
          title: '',
          content: '',
          type: 'community-feedback',
          culturalSensitivity: 'public',
          location: '',
          participantCount: undefined,
          contactEmail: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting community input:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CommunityInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-green-50 to-emerald-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Share Community Input</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Share your community priorities, success stories, challenges, or feedback to help 
              inform the Barkly Regional Deal and improve services for our community.
            </p>
            <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Cultural Protocols:</strong> All submissions are reviewed according to cultural protocols. 
                Sacred or sensitive cultural content will be handled with appropriate Elder oversight.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Submission Form */}
      <section className="py-8">
        <Container>
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Community Input Form</CardTitle>
                <CardDescription>
                  Help us understand community priorities and experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Brief title for your input (e.g., 'Youth Mental Health Concerns')"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Type of Input <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      required
                    >
                      <option value="community-feedback">Community Feedback</option>
                      <option value="youth-roundtable">Youth Roundtable</option>
                      <option value="elder-consultation">Elder Consultation</option>
                      <option value="success-story">Success Story</option>
                      <option value="systems-change">Systems Change</option>
                    </select>
                  </div>

                  {/* Cultural Sensitivity */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cultural Sensitivity Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.culturalSensitivity}
                      onChange={(e) => handleInputChange('culturalSensitivity', e.target.value)}
                      required
                    >
                      <option value="public">Public - Can be shared openly</option>
                      <option value="community">Community - Restricted to community members</option>
                      <option value="sacred">Sacred - Requires Elder approval</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose the appropriate level based on the cultural sensitivity of your content
                    </p>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      required
                    >
                      <option value="">Select location...</option>
                      <option value="Tennant Creek">Tennant Creek</option>
                      <option value="Elliott">Elliott</option>
                      <option value="Ali Curung">Ali Curung</option>
                      <option value="Alpurrurulam">Alpurrurulam</option>
                      <option value="Barkly Region">Barkly Region (General)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Participant Count (optional) */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Number of Participants (if applicable)
                    </label>
                    <Input
                      type="number"
                      value={formData.participantCount || ''}
                      onChange={(e) => handleInputChange('participantCount', parseInt(e.target.value) || 0)}
                      placeholder="e.g., 15"
                      min="1"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Input <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full p-3 border rounded-md h-40 resize-vertical"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Share your community priorities, experiences, success stories, or feedback. Please include specific details that could help inform decision-making and improve services."
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Be as specific as possible. Include quotes, examples, or data if available.
                    </p>
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Contact Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      For follow-up questions or cultural protocol verification
                    </p>
                  </div>

                  {/* Cultural Protocol Notice */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Cultural Protocol Notice</h4>
                    <div className="text-sm text-purple-700 space-y-1">
                      <p>• All submissions are reviewed according to cultural protocols</p>
                      <p>• Sacred or sensitive content will require Elder approval before sharing</p>
                      <p>• You maintain ownership and control over your cultural knowledge</p>
                      <p>• You can withdraw consent for sharing at any time</p>
                      <p>• Community benefit and appropriate use will be ensured</p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center space-x-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Community Input'}
                    </Button>
                  </div>

                  {/* Status Messages */}
                  {submitStatus === 'success' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">Thank you for your input!</p>
                      <p className="text-green-700 text-sm mt-1">
                        Your submission has been received and will be reviewed according to cultural protocols. 
                        We may contact you for follow-up questions.
                      </p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">Submission Error</p>
                      <p className="text-red-700 text-sm mt-1">
                        There was an error submitting your input. Please try again or contact support.
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Guidelines */}
      <section className="py-8 bg-muted/30">
        <Container>
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Submission Guidelines</CardTitle>
                <CardDescription>
                  How to share your community input effectively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-600 mb-3">What to Include</h4>
                    <ul className="text-sm space-y-2">
                      <li>• Specific community priorities or needs</li>
                      <li>• Success stories with measurable outcomes</li>
                      <li>• Barriers or challenges you've experienced</li>
                      <li>• Ideas for improving services or programs</li>
                      <li>• Community consultation outcomes</li>
                      <li>• Cultural considerations or protocols</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-600 mb-3">How Your Input is Used</h4>
                    <ul className="text-sm space-y-2">
                      <li>• Inform BRD initiative planning and implementation</li>
                      <li>• Identify community priorities for resource allocation</li>
                      <li>• Share success stories to inspire other communities</li>
                      <li>• Improve government services and policies</li>
                      <li>• Support evidence-based decision making</li>
                      <li>• Build community knowledge and connections</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}