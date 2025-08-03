'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Globe,
  Shield,
  Crown,
  BookOpen,
  Mic,
  Camera,
  FileText,
  Plus,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Video,
  Settings
} from 'lucide-react';

interface EventCreationFormProps {
  communityId: string;
  organizerId: string;
  organizerName: string;
  onEventCreated: (eventId: string) => void;
  onCancel: () => void;
}

interface RegistrationQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'number';
  options?: string[];
  required: boolean;
  culturalConsideration?: string;
}

export default function EventCreationForm({
  communityId,
  organizerId,
  organizerName,
  onEventCreated,
  onCancel
}: EventCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    description: '',
    eventType: 'workshop',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    isVirtual: false,
    virtualLink: '',
    maxAttendees: '',
    
    // Cultural Considerations
    culturalSafety: 'public',
    requiresElderPresence: false,
    culturalProtocols: [] as string[],
    traditionalElements: [] as string[],
    
    // Workshop Details
    facilitators: [] as string[],
    materials: [] as string[],
    learningObjectives: [] as string[],
    prerequisites: [] as string[],
    
    // Registration
    requiresRegistration: false,
    registrationDeadline: '',
    registrationQuestions: [] as RegistrationQuestion[],
    
    // Knowledge Capture
    knowledgeCaptureEnabled: false,
    captureSettings: {
      allowRecording: false,
      allowPhotos: false,
      allowNotes: true,
      requiresConsent: true
    },
    
    // Metadata
    tags: [] as string[]
  });

  const [tempInputs, setTempInputs] = useState({
    facilitator: '',
    material: '',
    objective: '',
    prerequisite: '',
    culturalProtocol: '',
    traditionalElement: '',
    tag: '',
    questionText: '',
    questionType: 'text' as 'text' | 'select' | 'multiselect' | 'boolean' | 'number',
    questionOptions: ''
  });

  const eventTypes = [
    { value: 'workshop', label: 'Workshop', icon: BookOpen },
    { value: 'meeting', label: 'Meeting', icon: Users },
    { value: 'ceremony', label: 'Ceremony', icon: Crown },
    { value: 'training', label: 'Training', icon: FileText },
    { value: 'consultation', label: 'Consultation', icon: Users },
    { value: 'celebration', label: 'Celebration', icon: Calendar }
  ];

  const culturalSafetyLevels = [
    { 
      value: 'public', 
      label: 'Public', 
      description: 'Open to everyone',
      icon: Globe,
      color: 'text-green-600'
    },
    { 
      value: 'community', 
      label: 'Community', 
      description: 'Community members only',
      icon: Users,
      color: 'text-blue-600'
    },
    { 
      value: 'restricted', 
      label: 'Restricted', 
      description: 'Specific groups only',
      icon: Shield,
      color: 'text-yellow-600'
    },
    { 
      value: 'sacred', 
      label: 'Sacred', 
      description: 'Sacred/ceremonial content',
      icon: Crown,
      color: 'text-red-600'
    }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCaptureSettingsChange = (setting: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      captureSettings: {
        ...prev.captureSettings,
        [setting]: value
      }
    }));
  };

  const addToArray = (arrayField: string, inputField: string) => {
    const value = tempInputs[inputField as keyof typeof tempInputs] as string;
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [arrayField]: [...prev[arrayField as keyof typeof prev] as string[], value.trim()]
      }));
      setTempInputs(prev => ({
        ...prev,
        [inputField]: ''
      }));
    }
  };

  const removeFromArray = (arrayField: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [arrayField]: (prev[arrayField as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addRegistrationQuestion = () => {
    if (tempInputs.questionText.trim()) {
      const question: RegistrationQuestion = {
        id: Date.now().toString(),
        question: tempInputs.questionText,
        type: tempInputs.questionType,
        options: tempInputs.questionType === 'select' || tempInputs.questionType === 'multiselect' 
          ? tempInputs.questionOptions.split(',').map(opt => opt.trim()).filter(opt => opt)
          : undefined,
        required: false
      };

      setFormData(prev => ({
        ...prev,
        registrationQuestions: [...prev.registrationQuestions, question]
      }));

      setTempInputs(prev => ({
        ...prev,
        questionText: '',
        questionType: 'text',
        questionOptions: ''
      }));
    }
  };

  const removeRegistrationQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      registrationQuestions: prev.registrationQuestions.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.startDate && formData.startTime);
      case 2:
        return true; // Cultural considerations are optional but recommended
      case 3:
        return true; // Workshop details are optional
      case 4:
        return !formData.requiresRegistration || 
               (formData.registrationDeadline && formData.registrationQuestions.length > 0);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = formData.endDate && formData.endTime 
        ? new Date(`${formData.endDate}T${formData.endTime}`)
        : new Date(startDateTime.getTime() + 3 * 60 * 60 * 1000); // Default 3 hours

      const eventData = {
        action: 'create',
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: formData.location,
        isVirtual: formData.isVirtual,
        virtualLink: formData.virtualLink || undefined,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        communityId,
        organizerId,
        organizerName,
        culturalSafety: formData.culturalSafety,
        requiresElderPresence: formData.requiresElderPresence,
        culturalProtocols: formData.culturalProtocols,
        traditionalElements: formData.traditionalElements,
        facilitators: formData.facilitators,
        materials: formData.materials,
        learningObjectives: formData.learningObjectives,
        prerequisites: formData.prerequisites,
        requiresRegistration: formData.requiresRegistration,
        registrationDeadline: formData.registrationDeadline 
          ? new Date(formData.registrationDeadline).toISOString() 
          : undefined,
        registrationQuestions: formData.registrationQuestions,
        knowledgeCaptureEnabled: formData.knowledgeCaptureEnabled,
        captureSettings: formData.captureSettings,
        tags: formData.tags
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (result.success) {
        onEventCreated(result.data.eventId);
      } else {
        throw new Error(result.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the event purpose and content"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('eventType', type.value)}
                    className={`p-3 border rounded-lg flex items-center space-x-2 transition-colors ${
                      formData.eventType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isVirtual"
                  checked={formData.isVirtual}
                  onChange={(e) => handleInputChange('isVirtual', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isVirtual" className="text-sm font-medium text-gray-700">
                  Virtual Event
                </label>
              </div>

              {formData.isVirtual ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Virtual Link
                  </label>
                  <Input
                    value={formData.virtualLink}
                    onChange={(e) => handleInputChange('virtualLink', e.target.value)}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter event location"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Attendees (optional)
              </label>
              <Input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cultural Safety Level
              </label>
              <div className="space-y-3">
                {culturalSafetyLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => handleInputChange('culturalSafety', level.value)}
                    className={`w-full p-4 border rounded-lg flex items-start space-x-3 text-left transition-colors ${
                      formData.culturalSafety === level.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <level.icon className={`w-5 h-5 mt-0.5 ${level.color}`} />
                    <div>
                      <div className="font-medium text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresElderPresence"
                checked={formData.requiresElderPresence}
                onChange={(e) => handleInputChange('requiresElderPresence', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="requiresElderPresence" className="text-sm font-medium text-gray-700">
                Requires Elder Presence
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultural Protocols
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={tempInputs.culturalProtocol}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, culturalProtocol: e.target.value }))}
                  placeholder="Enter cultural protocol"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('culturalProtocols', 'culturalProtocol')}
                />
                <Button
                  type="button"
                  onClick={() => addToArray('culturalProtocols', 'culturalProtocol')}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.culturalProtocols.map((protocol, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{protocol}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('culturalProtocols', index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Traditional Elements
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={tempInputs.traditionalElement}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, traditionalElement: e.target.value }))}
                  placeholder="Enter traditional element"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('traditionalElements', 'traditionalElement')}
                />
                <Button
                  type="button"
                  onClick={() => addToArray('traditionalElements', 'traditionalElement')}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.traditionalElements.map((element, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{element}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('traditionalElements', index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facilitators
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={tempInputs.facilitator}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, facilitator: e.target.value }))}
                  placeholder="Enter facilitator name"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('facilitators', 'facilitator')}
                />
                <Button
                  type="button"
                  onClick={() => addToArray('facilitators', 'facilitator')}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.facilitators.map((facilitator, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{facilitator}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('facilitators', index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materials Needed
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={tempInputs.material}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, material: e.target.value }))}
                  placeholder="Enter material or resource"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('materials', 'material')}
                />
                <Button
                  type="button"
                  onClick={() => addToArray('materials', 'material')}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.materials.map((material, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{material}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('materials', index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Objectives
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={tempInputs.objective}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, objective: e.target.value }))}
                  placeholder="Enter learning objective"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('learningObjectives', 'objective')}
                />
                <Button
                  type="button"
                  onClick={() => addToArray('learningObjectives', 'objective')}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.learningObjectives.map((objective, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{objective}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('learningObjectives', index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prerequisites
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={tempInputs.prerequisite}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, prerequisite: e.target.value }))}
                  placeholder="Enter prerequisite"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('prerequisites', 'prerequisite')}
                />
                <Button
                  type="button"
                  onClick={() => addToArray('prerequisites', 'prerequisite')}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.prerequisites.map((prerequisite, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{prerequisite}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('prerequisites', index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresRegistration"
                checked={formData.requiresRegistration}
                onChange={(e) => handleInputChange('requiresRegistration', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="requiresRegistration" className="text-sm font-medium text-gray-700">
                Requires Registration
              </label>
            </div>

            {formData.requiresRegistration && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Deadline
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Questions
                  </label>
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        value={tempInputs.questionText}
                        onChange={(e) => setTempInputs(prev => ({ ...prev, questionText: e.target.value }))}
                        placeholder="Enter question"
                      />
                      <select
                        value={tempInputs.questionType}
                        onChange={(e) => setTempInputs(prev => ({ ...prev, questionType: e.target.value as any }))}
                        className="p-2 border border-gray-300 rounded-md"
                      >
                        <option value="text">Text</option>
                        <option value="select">Select</option>
                        <option value="multiselect">Multi-select</option>
                        <option value="boolean">Yes/No</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                    
                    {(tempInputs.questionType === 'select' || tempInputs.questionType === 'multiselect') && (
                      <Input
                        value={tempInputs.questionOptions}
                        onChange={(e) => setTempInputs(prev => ({ ...prev, questionOptions: e.target.value }))}
                        placeholder="Enter options separated by commas"
                      />
                    )}
                    
                    <Button
                      type="button"
                      onClick={addRegistrationQuestion}
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formData.registrationQuestions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-3 flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{question.question}</p>
                          <p className="text-sm text-gray-600">Type: {question.type}</p>
                          {question.options && (
                            <p className="text-sm text-gray-600">Options: {question.options.join(', ')}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRegistrationQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="knowledgeCaptureEnabled"
                checked={formData.knowledgeCaptureEnabled}
                onChange={(e) => handleInputChange('knowledgeCaptureEnabled', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="knowledgeCaptureEnabled" className="text-sm font-medium text-gray-700">
                Enable Knowledge Capture
              </label>
            </div>

            {formData.knowledgeCaptureEnabled && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowRecording"
                    checked={formData.captureSettings.allowRecording}
                    onChange={(e) => handleCaptureSettingsChange('allowRecording', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="allowRecording" className="text-sm text-gray-700 flex items-center">
                    <Mic className="w-4 h-4 mr-1" />
                    Allow Audio Recording
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowPhotos"
                    checked={formData.captureSettings.allowPhotos}
                    onChange={(e) => handleCaptureSettingsChange('allowPhotos', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="allowPhotos" className="text-sm text-gray-700 flex items-center">
                    <Camera className="w-4 h-4 mr-1" />
                    Allow Photos
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowNotes"
                    checked={formData.captureSettings.allowNotes}
                    onChange={(e) => handleCaptureSettingsChange('allowNotes', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="allowNotes" className="text-sm text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    Allow Note Taking
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiresConsent"
                    checked={formData.captureSettings.requiresConsent}
                    onChange={(e) => handleCaptureSettingsChange('requiresConsent', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="requiresConsent" className="text-sm text-gray-700">
                    Requires Participant Consent
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={tempInputs.tag}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, tag: e.target.value }))}
                  placeholder="Enter tag"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('tags', 'tag')}
                />
                <Button
                  type="button"
                  onClick={() => addToArray('tags', 'tag')}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('tags', index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    'Basic Information',
    'Cultural Considerations',
    'Workshop Details',
    'Registration Settings',
    'Knowledge Capture & Tags'
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Create New Event
        </CardTitle>
        
        {/* Progress Steps */}
        <div className="flex items-center space-x-2 mt-4">
          {stepTitles.map((title, index) => (
            <React.Fragment key={index}>
              <div className={`flex items-center space-x-2 ${
                index + 1 === currentStep 
                  ? 'text-blue-600' 
                  : index + 1 < currentStep 
                    ? 'text-green-600' 
                    : 'text-gray-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index + 1 === currentStep 
                    ? 'bg-blue-100 text-blue-600' 
                    : index + 1 < currentStep 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {index + 1 < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs font-medium hidden md:block">{title}</span>
              </div>
              {index < stepTitles.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  index + 1 < currentStep ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : prevStep}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <div className="flex space-x-2">
            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !validateStep(currentStep)}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}