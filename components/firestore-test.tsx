"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw, TestTube } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { checkFirestoreAccess, saveDocumentRecord } from "@/lib/firestore"

export default function FirestoreTest() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)
  const { user } = useAuth()

  const runTest = async () => {
    if (!user) return

    setTesting(true)
    setTestResult(null)

    try {
      // Test 1: Check read access
      console.log("Testing Firestore read access...")
      const hasReadAccess = await checkFirestoreAccess(user.uid)

      if (!hasReadAccess) {
        setTestResult({
          success: false,
          message: "Firestore read access failed",
          details: "Security rules are not configured correctly. Please follow the setup guide below.",
        })
        return
      }

      // Test 2: Check write access
      console.log("Testing Firestore write access...")
      const testRecord = await saveDocumentRecord(user.uid, "TEST-COURSE-DELETE-ME", "Test Student", "TEST123", [
        {
          id: "test1",
          title: "Test Experiment",
          githubLink: "https://github.com/test/test",
        },
      ])

      if (testRecord) {
        setTestResult({
          success: true,
          message: "Firestore is working correctly!",
          details: "Both read and write operations succeeded. History feature is now available.",
        })
      }
    } catch (error: any) {
      console.error("Firestore test failed:", error)
      setTestResult({
        success: false,
        message: "Firestore test failed",
        details: error.message || "Unknown error occurred during testing.",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <TestTube className="h-5 w-5" />
          Test Firestore Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-700">
          Click the button below to test if Firestore is properly configured for your account.
        </p>

        <Button onClick={runTest} disabled={testing || !user} className="w-full">
          {testing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Test Firestore Setup
            </>
          )}
        </Button>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{testResult.message}</p>
                {testResult.details && <p className="text-sm">{testResult.details}</p>}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
