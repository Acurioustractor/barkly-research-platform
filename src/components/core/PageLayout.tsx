'use client';

import React from 'react';
import { Navigation, NavigationItem } from './Navigation';
import { Footer, FooterSection } from './Footer';

export interface PageLayoutProps {
  children: React.ReactNode;
  navigationItems?: NavigationItem[];
  footerSections?: FooterSection[];
  acknowledgement?: string;
}

const defaultNavItems: NavigationItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Services Map', href: '/services-map', description: 'Tennant Creek services & gaps' },
  { label: 'Documents', href: '/documents', description: 'Community knowledge library' },
  { label: 'Wiki', href: '/wiki', description: 'Curated knowledge and overviews' },
  { label: 'Tasks', href: '/tasks', description: 'Manage and track project tasks' },
  { label: 'Community Voice', href: '/community-voice', description: 'Share priorities & stories' },
  { label: 'What\'s Working', href: '/outcomes', description: 'Success stories & progress' },
  { label: 'Platform Showcase', href: '/showcase', description: 'AI platform capabilities & ROI' },
  { label: 'Quality Control', href: '/admin/quality', description: 'AI processing quality dashboard' },
];

const defaultFooterSections: FooterSection[] = [
  {
    title: 'BRD Intelligence',
    links: [
      { label: 'Community Heat Map', href: '/heat-map' },
      { label: 'Training Pathways', href: '/training-pathways' },
      { label: 'Youth Dashboard', href: '/youth-dashboard' },
      { label: 'Employment Outcomes', href: '/employment-outcomes' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Community Conversations', href: '/conversations' },
      { label: 'Share Your Voice', href: '/community-input' },
      { label: 'Community Stories', href: '/stories' },
      { label: 'Document Library', href: '/documents' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Platform Showcase', href: '/showcase' },
      { label: 'Research Insights', href: '/insights' },
      { label: 'Governance Table', href: '/governance-table' },
      { label: 'Platform Status', href: '/status' },
      { label: 'Admin Tools', href: '/admin' },
    ],
  },
];

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  navigationItems = defaultNavItems,
  footerSections = defaultFooterSections,
  acknowledgement,
}) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation items={navigationItems} />
      <main className="flex-1">
        {children}
      </main>
      <Footer sections={footerSections} acknowledgement={acknowledgement} />
    </div>
  );
};