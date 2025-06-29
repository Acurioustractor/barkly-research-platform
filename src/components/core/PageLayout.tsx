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
  { label: 'Data Insights', href: '/data-insights' },
  { label: 'Systems Map', href: '/systems' },
  { label: 'Documents', href: '/documents' },
  { label: 'Admin', href: '/admin' },
];

const defaultFooterSections: FooterSection[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Youth Voices', href: '/stories' },
      { label: 'Community Insights', href: '/data-insights' },
      { label: 'Interactive Map', href: '/systems' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'UMEL Framework', href: '/about/umel' },
      { label: 'Research Methods', href: '/about/methods' },
      { label: 'Cultural Protocols', href: '/about/protocols' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Partners', href: '/partners' },
      { label: 'Get Involved', href: '/get-involved' },
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