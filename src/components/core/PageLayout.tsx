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
  { label: 'Youth Stories', href: '/stories' },
  { label: 'Services Map', href: '/map', description: 'Interactive map of youth services in Tennant Creek' },
  { label: 'Research Insights', href: '/insights' },
  { label: 'Systems Map', href: '/systems' },
  { label: 'Documents', href: '/documents' },
  { label: 'Admin', href: '/admin' },
];

const defaultFooterSections: FooterSection[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Youth Voices', href: '/stories' },
      { label: 'Research Insights', href: '/insights' },
      { label: 'Services Map', href: '/map' },
      { label: 'Systems Map', href: '/systems' },
    ],
  },
  {
    title: 'Research',
    links: [
      { label: 'Upload Documents', href: '/admin' },
      { label: 'Document Library', href: '/documents' },
      { label: 'Entity Analysis', href: '/entities' },
      { label: 'Research Methods', href: '/research' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Status', href: '/status' },
      { label: 'Test Upload', href: '/test' },
      { label: 'Documentation', href: '/admin' },
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