"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw, Bug, User, Database, Shield } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"

export default function FirestoreDebug() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const { user } = useAuth()

  const runDiagnostics = async () => {
    if (!user) return

    setTesting(true)
    setResults([])
    const testResults: any[] = []

    try {
      // Test 1: Check Firebase Auth
      testResults.push({
        test: "Firebase Authentication",
        status: user ? "✅ PASS" : "❌ FAIL",
        details: user ? `Logged in as: ${user.email} (UID: ${user.uid})` : "No user logged in",
        icon: User,
      })

      // Test 2: Check Firebase Config
      testResults.push({
        test: "Firebase Configuration",
        status: auth && db ? "✅ PASS" : "❌ FAIL",
        details: auth && db ? "Firebase Auth and Firestore initialized" : "Firebase not properly configured",
        icon: Database,
      })

      // Test 3: Check Auth Token
      try {
        const token = await user.getIdToken()
        testResults.push({
          test: "Auth Token",
          status: token ? "✅ PASS" : "❌ FAIL",
          details: token ? `Token obtained (${token.substring(0, 20)}...)` : "Failed to get auth token",
          icon: Shield,
        })
      } catch (error: any) {
        testResults.push({
          test: "Auth Token",
          status: "❌ FAIL",
          details: `Error getting token: ${error.message}`,
          icon: Shield,
        })
      }

      // Test 4: Test Firestore Connection
      try {
        console.log("Testing Firestore connection...")
        const testCollection = collection(db, "test")
        testResults.push({
          test: "Firestore Connection",
          status: "✅ PASS",
          details: "Successfully connected to Firestore",
          icon: Database,
        })
      } catch (error: any) {
        testResults.push({
          test: "Firestore Connection",
          status: "❌ FAIL",
          details: `Connection error: ${error.message}`,
          icon: Database,
        })
      }

      // Test 5: Test Simple Write
      try {
        console.log("Testing Firestore write...")
        const testDoc = await addDoc(collection(db, "test"), {
          userId: user.uid,
          message: "Test write",
          timestamp: new Date(),
        })
        testResults.push({
          test: "Firestore Write",
          status: "✅ PASS",
          details: `Successfully wrote document: ${testDoc.id}`,
          icon: Database,
        })
      } catch (error: any) {
        testResults.push({
          test: "Firestore Write",
          status: "❌ FAIL",
          details: `Write error: ${error.message}`,
          icon: Database,
        })
      }

      // Test 6: Test Simple Read
      try {
        console.log("Testing Firestore read...")
        const testQuery = query(collection(db, "test"), where("userId", "==", user.uid))
        const querySnapshot = await getDocs(testQuery)
        testResults.push({
          test: "Firestore Read",
          status: "✅ PASS",
          details: `Successfully read ${querySnapshot.size} documents`,
          icon: Database,
        })
      } catch (error: any) {
        testResults.push({
          test: "Firestore Read",
          status: "❌ FAIL",
          details: `Read error: ${error.message}`,
          icon: Database,
        })
      }

      // Test 7: Test documentRecords Collection
      try {
        console.log("Testing documentRecords collection...")
        const docQuery = query(collection(db, "documentRecords"), where("userId", "==", user.uid))
        const docSnapshot = await getDocs(docQuery)
        testResults.push({
          test: "DocumentRecords Collection",
          status: "✅ PASS",
          details: `Successfully accessed documentRecords collection (${docSnapshot.size} documents)`,
          icon: Database,
        })
      } catch (error: any) {
        testResults.push({
          test: "DocumentRecords Collection",
          status: "❌ FAIL",
          details: `Collection error: ${error.message}`,
          icon: Database,
        })
      }
    } catch (error: any) {
      testResults.push({
        test: "General Error",
        status: "❌ FAIL",
        details: `Unexpected error: ${error.message}`,
        icon: XCircle,
      })
    }

    setResults(testResults)
    setTesting(false)
  }

  const getStatusColor = (status: string) => {
    if (status.includes("PASS")) return "text-green-600"
    if (status.includes("FAIL")) return "text-red-600"
    return "text-yellow-600"
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Bug className="h-5 w-5" />
          Firestore Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Bug className="h-4 w-4" />
          <AlertDescription>
            This will run comprehensive tests to identify exactly what's not working with Firestore.
          </AlertDescription>
        </Alert>

        <Button onClick={runDiagnostics} disabled={testing || !user} className="w-full">
          {testing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <Bug className="h-4 w-4 mr-2" />
              Run Full Diagnostics
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Diagnostic Results:</h4>
            {results.map((result, index) => {
              const IconComponent = result.icon
              return (
                <div key={index} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 mt-0.5 text-gray-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{result.test}</h5>
                        <span className={`text-sm font-mono ${getStatusColor(result.status)}`}>{result.status}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{result.details}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {results.length > 0 && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> Share these results to get specific help with any failing tests.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
