"use client"

import { useAuth } from "@/components/auth-provider"
import LoginForm from "@/components/login-form"
import DocumentGenerator from "@/components/document-generator"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lab Record Generator</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Lab Record Generator</h1>
            <p className="text-muted-foreground">Login to generate your lab record table of contents</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <DocumentGenerator />
    </div>
  )
}
