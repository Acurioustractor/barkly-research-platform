'use client';

import React from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';

export default function SupportPage() {
  return (
    <PageLayout>
      <section className="py-8 bg-gradient-to-r from-blue-50 to-green-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Get Support</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Find help, services, and support available in Tennant Creek right now.
            </p>
            <Button variant="primary">Emergency Support</Button>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Services</CardTitle>
                <CardDescription>Immediate help and crisis support</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Police: 000</li>
                  <li>• Ambulance: 000</li>
                  <li>• Crisis Support: 13 11 14</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Healthcare</CardTitle>
                <CardDescription>Medical and health services</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Tennant Creek Hospital</li>
                  <li>• Community Health Centre</li>
                  <li>• Aboriginal Health Service</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}