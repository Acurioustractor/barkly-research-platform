'use client';

import React, { useState } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Input } from '@/components/core';
import { Badge } from '@/components/core';

interface UserProfile {
  name: string;
  email: string;
  role: 'community-member' | 'researcher' | 'admin' | 'elder';
  community: string;
  permissions: string[];
  joinDate: string;
  lastActive: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Community Member',
    email: 'member@community.org',
    role: 'community-member',
    community: 'Tennant Creek',
    permissions: ['view-public', 'view-community', 'submit-stories'],
    joinDate: '2024-01-15',
    lastActive: new Date().toISOString()
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'community-member': return <Badge variant="success">Community Member</Badge>;
      case 'researcher': return <Badge variant="secondary">Researcher</Badge>;
      case 'admin': return <Badge variant="destructive">Administrator</Badge>;
      case 'elder': return <Badge variant="default">Elder</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'community-member': return 'Can view public and community content, submit stories';
      case 'researcher': return 'Can access research data and generate reports';
      case 'admin': return 'Full platform access and management capabilities';
      case 'elder': return 'Cultural oversight and approval of sensitive content';
      default: return 'Standard user access';
    }
  };

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">User Profile</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Manage your account settings, permissions, and cultural access levels.
            </p>
            <div className="flex items-center space-x-4">
              {getRoleBadge(profile.role)}
              <span className="text-sm text-muted-foreground">
                Member since {new Date(profile.joinDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Profile Information */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Your personal information and account details</CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="space-x-2">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      {isEditing ? (
                        <Input
                          value={editedProfile.name}
                          onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted/30 rounded">{profile.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editedProfile.email}
                          onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted/30 rounded">{profile.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Community</label>
                      {isEditing ? (
                        <select 
                          className="w-full p-2 border rounded-md text-sm"
                          value={editedProfile.community}
                          onChange={(e) => setEditedProfile({...editedProfile, community: e.target.value})}
                        >
                          <option value="Tennant Creek">Tennant Creek</option>
                          <option value="Elliott">Elliott</option>
                          <option value="Ali Curung">Ali Curung</option>
                          <option value="Alpurrurulam">Alpurrurulam</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <p className="text-sm p-2 bg-muted/30 rounded">{profile.community}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Role</label>
                      <div className="p-2">
                        {getRoleBadge(profile.role)}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Role Description</label>
                    <p className="text-sm text-muted-foreground p-2 bg-muted/30 rounded">
                      {getRoleDescription(profile.role)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                  <CardDescription>Your account activity and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Account Status</p>
                    <Badge variant="success">Active</Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Last Active</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.lastActive).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Community</p>
                    <p className="text-sm text-muted-foreground">{profile.community}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Permissions */}
      <section className="py-8 bg-muted/30">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Access Permissions</CardTitle>
              <CardDescription>
                Your current access levels and permissions within the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h4 className="font-medium text-sm">Public Content</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Access to publicly available documents and stories
                  </p>
                  <Badge variant="success" className="mt-2">Granted</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h4 className="font-medium text-sm">Community Content</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Access to community-restricted documents and discussions
                  </p>
                  <Badge variant="success" className="mt-2">Granted</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h4 className="font-medium text-sm">Sacred Content</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Access to sacred knowledge requiring Elder approval
                  </p>
                  <Badge variant="outline" className="mt-2">Request Required</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h4 className="font-medium text-sm">Story Submission</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ability to submit community stories and experiences
                  </p>
                  <Badge variant="success" className="mt-2">Granted</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <h4 className="font-medium text-sm">Document Upload</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload documents for community knowledge base
                  </p>
                  <Badge variant="outline" className="mt-2">Admin Only</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <h4 className="font-medium text-sm">Analytics Access</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    View platform analytics and insights
                  </p>
                  <Badge variant="outline" className="mt-2">Researcher Only</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Cultural Protocols */}
      <section className="py-8">
        <Container>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🛡️</span>
                <span>Cultural Protocols & Data Sovereignty</span>
              </CardTitle>
              <CardDescription>
                Understanding your rights and responsibilities regarding cultural knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Your Rights</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Control over your personal stories and cultural knowledge</li>
                    <li>• Right to withdraw consent for shared content</li>
                    <li>• Access to your data and how it's being used</li>
                    <li>• Cultural protocols respected in all interactions</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Your Responsibilities</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Respect cultural protocols when sharing knowledge</li>
                    <li>• Obtain appropriate permissions for sensitive content</li>
                    <li>• Follow community guidelines for story sharing</li>
                    <li>• Report any cultural protocol violations</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Community Support</h4>
                  <p className="text-sm text-green-700">
                    If you need help understanding cultural protocols or have concerns about 
                    content sharing, please contact our community liaisons or Elder advisors.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Quick Actions */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Share Your Story</CardTitle>
                <CardDescription>Contribute to the community knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => window.location.href = '/stories'}>
                  Share Story
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Request Access</CardTitle>
                <CardDescription>Request access to additional content or features</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Request Access
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Get help with your account or platform usage</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}