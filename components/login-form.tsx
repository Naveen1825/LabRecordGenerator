"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
    } catch (error: any) {
      setError(error.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)

    try {
      await signInWithGoogle()
    } catch (error: any) {
      setError(error.message || "An error occurred with Google sign-in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lab Record Generator</h1>
          <p className="text-gray-600">Create professional lab documentation</p>
        </div>

        {/* Login Card */}
        <Card className="border-gray-300 shadow-sm bg-white">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSignUp ? "Sign up to start creating lab records" : "Sign in to access your account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-300 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-400 hover:bg-gray-50 text-gray-700"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-500">Or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-11 border-gray-400 focus:border-purple-500 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    className="h-11 pr-10 border-gray-400 focus:border-purple-500 focus:ring-purple-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-purple-500 hover:bg-purple-600 text-white font-medium"
                disabled={loading}
              >
                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Create one"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
