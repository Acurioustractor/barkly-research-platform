/**
 * Entity Validation Page
 * Dedicated page for reviewing and validating AI-extracted entities
 */

import { Container } from '@/components/core/Container';
import { PageLayout } from '@/components/core/PageLayout';
import { EntityValidationDashboard } from '@/components/entities/EntityValidationDashboard';

export default function EntityValidationPage() {
  return (
    <PageLayout>
      <Container>
        <EntityValidationDashboard />
      </Container>
    </PageLayout>
  );
}

export const metadata = {
  title: 'Entity Validation - Barkley Backbone',
  description: 'Review and validate AI-extracted entities from research documents',
}; 