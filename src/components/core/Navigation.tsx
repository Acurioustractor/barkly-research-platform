'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { Container } from './Container';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from './Button';
import { User, LogOut, Settings } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavigationProps {
  items: NavigationItem[];
  logo?: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({ items, logo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            {logo ? (
              logo
            ) : (
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-primary">Tennant Creek</span>
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
            
            {/* User Menu */}
            <div className="ml-4 relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>{user.email}</span>
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/10"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Profile
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/10"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-2">
            <div className="space-y-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 text-base font-medium transition-colors',
                    isActive(item.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                  {item.description && (
                    <span className="block text-sm font-normal text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
};