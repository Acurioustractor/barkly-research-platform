import { PageLayout, Container } from '@/components/core';
import { SimpleUploader } from '@/components/core/SimpleUploader';

export default function TestPage() {
  return (
    <PageLayout>
      <section className="py-12 lg:py-16">
        <Container>
          <h1 className="text-4xl font-bold mb-8">Upload Test Page</h1>
          <SimpleUploader />
          <div className="mt-8 max-w-2xl space-y-4">
            <p>This tests basic file upload without PDF processing.</p>
            <p className="text-sm text-gray-600">
              If this works, the issue is with PDF processing. If this fails, the issue is with the upload itself.
            </p>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}