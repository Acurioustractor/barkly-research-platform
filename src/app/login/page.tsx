'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout } from '@/components/core/PageLayout'
import { Container } from '@/components/core/Container'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/components/auth/AuthProvider'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <PageLayout>
      <Container>
        <div className="flex items-center justify-center min-h-[60vh] py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome to Barkly Research
              </h1>
              <p className="text-muted-foreground">
                A platform for preserving and sharing cultural knowledge
              </p>
            </div>
            <LoginForm onSuccess={() => router.push('/')} />
          </div>
        </div>
      </Container>
    </PageLayout>
  )
}