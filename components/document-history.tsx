"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Trash2,
  Upload,
  FileText,
  Calendar,
  User,
  Hash,
  AlertCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Download,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  getUserDocumentRecords,
  deleteDocumentRecord,
  checkFirestoreAccess,
  saveOrUpdateDocumentRecord,
  type DocumentRecord,
} from "@/lib/firestore"
import { formatDistanceToNow } from "date-fns"
import FirestoreSetupGuide from "@/components/firestore-setup-guide"

type DocumentHistoryProps = {
  onLoadRecord: (record: DocumentRecord) => void
}

export default function DocumentHistory({ onLoadRecord }: DocumentHistoryProps) {
  const [records, setRecords] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasFirestoreAccess, setHasFirestoreAccess] = useState<boolean | null>(null)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [downloadingRecords, setDownloadingRecords] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      checkAccess()
    }
  }, [user])

  const checkAccess = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError("")

      console.log("Checking Firestore access for user:", user.uid)

      // First check if we have access
      const hasAccess = await checkFirestoreAccess(user.uid)
      console.log("Firestore access result:", hasAccess)
      setHasFirestoreAccess(hasAccess)

      if (hasAccess) {
        await loadRecords()
      } else {
        setShowSetupGuide(true)
      }
    } catch (error: any) {
      console.error("Error checking Firestore access:", error)
      setHasFirestoreAccess(false)
      setShowSetupGuide(true)
    } finally {
      setLoading(false)
    }
  }

  const loadRecords = async () => {
    if (!user) return

    try {
      console.log("Loading records for user:", user.uid)
      const userRecords = await getUserDocumentRecords(user.uid)
      console.log("Loaded records:", userRecords.length)
      setRecords(userRecords)
      setHasFirestoreAccess(true)
    } catch (error: any) {
      console.error("Error loading records:", error)
      setHasFirestoreAccess(false)
      if (error.message.includes("Permission denied")) {
        setError("Firestore security rules need to be configured to enable document history.")
        setShowSetupGuide(true)
      } else {
        setError("Failed to load document history. Please check your internet connection and try again.")
      }
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!recordId) return

    try {
      await deleteDocumentRecord(recordId)
      setRecords(records.filter((record) => record.id !== recordId))
    } catch (error: any) {
      console.error("Error deleting record:", error)
      setError("Failed to delete record. Please try again.")
    }
  }

  const handleLoadRecord = (record: DocumentRecord) => {
    onLoadRecord(record)
  }

  const handleDownloadRecord = async (record: DocumentRecord) => {
    if (!record.id) return

    try {
      setDownloadingRecords((prev) => new Set(prev).add(record.id!))

      console.log("Downloading PDF for record:", record.id)

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseTitle: record.courseTitle,
          experiments: record.experiments,
          studentName: record.studentName,
          registerNumber: record.registerNumber,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${record.courseTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Lab_Record.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Update download count in Firestore
      if (user && hasFirestoreAccess) {
        try {
          await saveOrUpdateDocumentRecord(
            user.uid,
            record.courseTitle,
            record.studentName,
            record.registerNumber,
            record.experiments,
            true, // isDownload = true to increment counter
          )

          // Update local state to reflect new download count
          setRecords((prevRecords) =>
            prevRecords.map((r) => (r.id === record.id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r)),
          )
        } catch (error) {
          console.warn("Failed to update download count:", error)
        }
      }

      console.log("PDF download completed for:", record.courseTitle)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("There was an error generating your PDF. Please try again.")
    } finally {
      setDownloadingRecords((prev) => {
        const newSet = new Set(prev)
        newSet.delete(record.id!)
        return newSet
      })
    }
  }

  const getDaysUntilExpiry = (expiresAt: any) => {
    const expiryDate = expiresAt.toDate()
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <p>Checking Firestore access...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show setup guide if no Firestore access
  if (hasFirestoreAccess === false || showSetupGuide) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document History
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSetupGuide(!showSetupGuide)}>
                  <Settings className="h-4 w-4 mr-1" />
                  {showSetupGuide ? "Hide" : "Show"} Setup Guide
                </Button>
                <Button variant="ghost" size="sm" onClick={checkAccess}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Document history is not available. Firestore security rules need to be configured.
                <br />
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm underline mt-1"
                  onClick={() => setShowSetupGuide(true)}
                >
                  Click here to see setup instructions
                </Button>
              </AlertDescription>
            </Alert>

            {!showSetupGuide && (
              <div className="mt-4 text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">History feature unavailable</p>
                <p className="text-sm text-muted-foreground">
                  Documents can still be generated and downloaded normally.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {showSetupGuide && <FirestoreSetupGuide />}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document History ({records.length})
          </span>
          <Button variant="ghost" size="sm" onClick={checkAccess}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {records.length === 0 && !error ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No document records found.</p>
            <p className="text-sm text-muted-foreground">
              Start adding experiments or download a document to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => {
              const daysUntilExpiry = getDaysUntilExpiry(record.expiresAt)
              const isExpiringSoon = daysUntilExpiry <= 3
              const isDownloading = downloadingRecords.has(record.id!)

              return (
                <div key={record.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold text-lg">{record.courseTitle}</h3>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="truncate">{record.studentName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="h-4 w-4" />
                          {record.registerNumber}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(record.updatedAt?.toDate() || record.createdAt.toDate(), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {record.experiments.length} experiment{record.experiments.length !== 1 ? "s" : ""}
                        </Badge>
                        {record.downloadCount > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {record.downloadCount} download{record.downloadCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        <Badge variant={isExpiringSoon ? "destructive" : "outline"}>
                          {daysUntilExpiry > 0
                            ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`
                            : "Expired"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadRecord(record)}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Load
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownloadRecord(record)}
                        disabled={isDownloading}
                        className="w-full sm:w-auto"
                      >
                        {isDownloading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download PDF
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => record.id && handleDeleteRecord(record.id)}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Experiments:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                      {record.experiments.map((exp, index) => (
                        <li key={exp.id} className="flex items-start gap-2">
                          <span className="font-medium text-xs mt-0.5 min-w-[1.5rem]">{index + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium break-words">{exp.title}</span>
                              {exp.date && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {new Date(exp.date).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-blue-600 break-all mt-1">
                              <a
                                href={exp.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {exp.githubLink}
                              </a>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
