import React from 'react';
import Link from 'next/link';
import { Container } from './Container';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  sections?: FooterSection[];
  acknowledgement?: string;
}

export const Footer: React.FC<FooterProps> = ({
  sections = [],
  acknowledgement = "We acknowledge the Traditional Owners of the lands on which we work and pay our respects to Elders past, present and emerging."
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-muted/30">
      {/* Acknowledgement */}
      <div className="bg-cultural-respect/10 border-b">
        <Container className="py-6">
          <p className="text-sm text-center text-muted-foreground max-w-3xl mx-auto">
            {acknowledgement}
          </p>
        </Container>
      </div>

      {/* Main Footer Content */}
      <Container>
        <div className="py-12">
          {sections.length > 0 ? (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
              {sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Community-led research platform
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="border-t py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Barkly Youth Research Dashboard. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/accessibility" className="hover:text-primary transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};