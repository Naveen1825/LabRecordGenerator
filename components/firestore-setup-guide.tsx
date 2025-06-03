"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, CheckCircle, Zap } from "lucide-react"
import { useState } from "react"
import FirestoreTest from "@/components/firestore-test"

export default function FirestoreSetupGuide() {
  const [copied, setCopied] = useState(false)

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users to read and write all documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`

  const copyRules = async () => {
    try {
      await navigator.clipboard.writeText(firestoreRules)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Start Section */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Zap className="h-5 w-5" />
            Firebase Rules for All Authenticated Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Simple Setup:</strong> These rules allow all authenticated users to access all documents.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Open Firestore Rules</h4>
                <a
                  href="https://console.firebase.google.com/project/record-work-b704c/firestore/rules"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
                >
                  Firebase Console - Firestore Rules <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Copy & Paste These Rules</h4>
                <p className="text-sm text-muted-foreground mb-2">Replace ALL existing content with these rules:</p>
                <div className="relative">
                  <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                    <code>{firestoreRules}</code>
                  </pre>
                  <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={copyRules}>
                    <Copy className="h-3 w-3 mr-1" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Click "Publish"</h4>
                <p className="text-sm text-muted-foreground">Click the blue "Publish" button in Firebase Console</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Test Below</h4>
                <p className="text-sm text-muted-foreground">Wait 30 seconds, then use the test button below</p>
              </div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>What these rules do:</strong> Allow any authenticated user to read and write any document in your
              Firestore database. Perfect for shared applications.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test Section */}
      <FirestoreTest />

      {/* Troubleshooting */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h5 className="font-medium">If you get "permission denied" errors:</h5>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1 ml-4">
              <li>• Make sure you clicked "Publish" after pasting the rules</li>
              <li>• Wait 30-60 seconds after publishing before testing</li>
              <li>• Verify you're in the correct project (record-work-b704c)</li>
              <li>• Make sure you're logged in with the same account</li>
              <li>• Try refreshing the page and testing again</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
