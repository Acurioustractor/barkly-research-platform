import { PageLayout } from '@/components/core';
import { Container, Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/core';
import Link from 'next/link';

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 bg-gradient-to-b from-primary/5 to-background">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Barkly Youth Voices
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover the stories, insights, and aspirations of young people from the Barkly region through community-led research and interactive data visualization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/stories">
                <Button size="lg" variant="primary">Explore Youth Stories</Button>
              </Link>
              <Link href="/insights">
                <Button size="lg" variant="secondary">View Research Insights</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Feature Cards */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Youth Voices</CardTitle>
                <CardDescription>
                  Real stories from young people sharing their experiences, challenges, and dreams for the future.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/stories" className="w-full">
                  <Button variant="ghost" className="w-full">Read Stories →</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Systems Thinking</CardTitle>
                <CardDescription>
                  Interactive visualizations showing how services, community, and youth experiences connect.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/systems" className="w-full">
                  <Button variant="ghost" className="w-full">Explore Systems Map →</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Insights</CardTitle>
                <CardDescription>
                  Data-driven insights from the UMEL framework revealing patterns and opportunities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/insights" className="w-full">
                  <Button variant="ghost" className="w-full">View Insights →</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Shape the Future Together
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              This platform showcases the power of community-led research and youth participation in creating positive change.
            </p>
            <Link href="/admin">
              <Button size="lg" variant="accent">Start Research</Button>
            </Link>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}
