"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DocumentPreview from "@/components/document-preview"
import DocumentHistory from "@/components/document-history"
import { useAuth } from "@/components/auth-provider"
import { saveOrUpdateDocumentRecord, checkFirestoreAccess, type DocumentRecord } from "@/lib/firestore"
import { debounce } from "lodash"

type Experiment = {
  id: string
  title: string
  githubLink: string
  date?: string
}

export default function DocumentGenerator() {
  const [courseTitle, setCourseTitle] = useState("")
  const [studentName, setStudentName] = useState("")
  const [registerNumber, setRegisterNumber] = useState("")
  const [experiments, setExperiments] = useState<Experiment[]>([{ id: "1", title: "", githubLink: "", date: "" }])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [historyVisible, setHistoryVisible] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasFirestoreAccess, setHasFirestoreAccess] = useState<boolean | null>(null)
  const { user, logout } = useAuth()

  // Auto-save function with debouncing
  const autoSave = useCallback(
    debounce(async () => {
      if (!user || !isFormValid() || !hasFirestoreAccess) return

      try {
        setIsSaving(true)
        setSaveError("")

        console.log("Auto-saving document record...")
        await saveOrUpdateDocumentRecord(user.uid, courseTitle, studentName, registerNumber, experiments, false)

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
        console.log("Auto-save successful")
      } catch (error: any) {
        console.error("Auto-save failed:", error)
        if (!error.message.includes("index")) {
          setSaveError("Auto-save failed: " + error.message)
        }
      } finally {
        setIsSaving(false)
      }
    }, 2000),
    [user, courseTitle, studentName, registerNumber, experiments, hasFirestoreAccess],
  )

  // Check Firestore access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        try {
          const hasAccess = await checkFirestoreAccess(user.uid)
          setHasFirestoreAccess(hasAccess)
          console.log("Firestore access:", hasAccess)
        } catch (error) {
          console.error("Error checking Firestore access:", error)
          setHasFirestoreAccess(false)
        }
      }
    }
    checkAccess()
  }, [user])

  // Auto-save when form data changes
  useEffect(() => {
    if (hasFirestoreAccess && isFormValid()) {
      autoSave()
    }
  }, [courseTitle, studentName, registerNumber, experiments, hasFirestoreAccess, autoSave])

  const addExperiment = () => {
    const newExperiment = { id: Date.now().toString(), title: "", githubLink: "", date: "" }
    setExperiments([...experiments, newExperiment])
    console.log("Added new experiment, will auto-save...")
  }

  const removeExperiment = (id: string) => {
    if (experiments.length > 1) {
      setExperiments(experiments.filter((exp) => exp.id !== id))
      console.log("Removed experiment, will auto-save...")
    }
  }

  const updateExperiment = (id: string, field: keyof Experiment, value: string) => {
    setExperiments(experiments.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)))
    console.log("Updated experiment, will auto-save...")
  }

  const saveToHistoryOnDownload = async (): Promise<boolean> => {
    if (!user || !isFormValid()) return false

    try {
      setSaveError("")

      if (hasFirestoreAccess === null) {
        const hasAccess = await checkFirestoreAccess(user.uid)
        setHasFirestoreAccess(hasAccess)
        if (!hasAccess) {
          console.log("History feature not available, but download will continue")
          return true
        }
      }

      if (!hasFirestoreAccess) {
        console.log("Firestore not available, skipping history save")
        return true
      }

      console.log("Saving to history on download...")
      await saveOrUpdateDocumentRecord(user.uid, courseTitle, studentName, registerNumber, experiments, true)
      console.log("Download save successful")
      return true
    } catch (error: any) {
      console.error("Error saving to history on download:", error)
      console.log("History save failed, but download will continue")
      return true
    }
  }

  const handleManualSave = async () => {
    if (!user || !isFormValid()) return

    try {
      setIsSaving(true)
      setSaveError("")

      if (hasFirestoreAccess === null) {
        const hasAccess = await checkFirestoreAccess(user.uid)
        setHasFirestoreAccess(hasAccess)
        if (!hasAccess) {
          setSaveError("History feature not available. Firestore rules need to be configured.")
          return
        }
      }

      console.log("Manual save triggered...")
      await saveOrUpdateDocumentRecord(user.uid, courseTitle, studentName, registerNumber, experiments, false)

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      console.log("Manual save successful")
    } catch (error: any) {
      console.error("Manual save failed:", error)
      setSaveError(error.message || "Failed to save to history")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadDocx = async () => {
    try {
      setIsGenerating(true)
      setSaveError("")

      const response = await fetch("/api/generate-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseTitle,
          experiments,
          studentName,
          registerNumber,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate document")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${courseTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Lab_Record.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      saveToHistoryOnDownload().catch((error) => {
        console.warn("Could not save to history:", error)
      })
    } catch (error) {
      console.error("Error generating DOCX:", error)
      alert("There was an error generating your document. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true)
      setSaveError("")

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseTitle,
          experiments,
          studentName,
          registerNumber,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${courseTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Lab_Record.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      saveToHistoryOnDownload().catch((error) => {
        console.warn("Could not save to history:", error)
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating your PDF. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const loadFromHistory = (record: DocumentRecord) => {
    setCourseTitle(record.courseTitle)
    setStudentName(record.studentName)
    setRegisterNumber(record.registerNumber)
    setExperiments(
      record.experiments.map((exp) => ({
        ...exp,
        date: exp.date || "",
      })),
    )
    setHistoryVisible(false)
  }

  const togglePreview = () => {
    setPreviewVisible(!previewVisible)
  }

  const toggleHistory = () => {
    setHistoryVisible(!historyVisible)
  }

  const isFormValid = () => {
    return (
      courseTitle.trim() !== "" &&
      studentName.trim() !== "" &&
      registerNumber.trim() !== "" &&
      experiments.every((exp) => exp.title.trim() !== "" && exp.githubLink.trim() !== "")
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lab Record Generator</h1>
            <p className="text-gray-600">Welcome, {user?.email}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={toggleHistory}
              className="border-gray-400 hover:bg-gray-200 text-gray-700"
            >
              {historyVisible ? "Hide History" : "Show History"}
            </Button>
            <Button variant="ghost" onClick={logout} className="hover:bg-gray-200 text-gray-700">
              Logout
            </Button>
          </div>
        </div>

        {/* Save Status */}
        {hasFirestoreAccess && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-white rounded-lg border border-gray-300">
            <div className="flex items-center gap-2">
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              )}
              {saveSuccess && <div className="flex items-center gap-2 text-sm text-green-600">Saved to history</div>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={!isFormValid() || isSaving}
              className="border-gray-400 hover:bg-gray-200 text-gray-700"
            >
              Save Now
            </Button>
          </div>
        )}

        {/* Alerts */}
        {hasFirestoreAccess === false && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertDescription className="text-amber-800">
              Document history is not available. Documents can still be generated and downloaded normally.
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {/* History Panel */}
        {historyVisible && <DocumentHistory onLoadRecord={loadFromHistory} />}

        {/* Main Form */}
        <Card className="border-gray-300 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseTitle" className="text-gray-700">
                Course Title and Code
              </Label>
              <Input
                id="courseTitle"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. 19AI404-Analysis of Algorithms"
                required
                className="border-gray-400 focus:border-purple-500 focus:ring-purple-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentName" className="text-gray-700">
                  Student Name
                </Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="border-gray-400 focus:border-purple-500 focus:ring-purple-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registerNumber" className="text-gray-700">
                  Register Number
                </Label>
                <Input
                  id="registerNumber"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  placeholder="Your register number"
                  required
                  className="border-gray-400 focus:border-purple-500 focus:ring-purple-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiments */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Experiments</h2>

          {experiments.map((experiment, index) => (
            <Card key={experiment.id} className="border-gray-300 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Experiment {index + 1}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExperiment(experiment.id)}
                    disabled={experiments.length === 1}
                    className="hover:bg-gray-200 text-gray-600"
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${experiment.id}`} className="text-gray-700">
                      Experiment Title
                    </Label>
                    <Input
                      id={`title-${experiment.id}`}
                      value={experiment.title}
                      onChange={(e) => updateExperiment(experiment.id, "title", e.target.value)}
                      placeholder="Enter experiment title"
                      required
                      className="border-gray-400 focus:border-purple-500 focus:ring-purple-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`date-${experiment.id}`} className="text-gray-700">
                        Date (Optional)
                      </Label>
                      <Input
                        id={`date-${experiment.id}`}
                        type="date"
                        value={experiment.date || ""}
                        onChange={(e) => updateExperiment(experiment.id, "date", e.target.value)}
                        className="border-gray-400 focus:border-purple-500 focus:ring-purple-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`github-${experiment.id}`} className="text-gray-700">
                        GitHub Link
                      </Label>
                      <Input
                        id={`github-${experiment.id}`}
                        value={experiment.githubLink}
                        onChange={(e) => updateExperiment(experiment.id, "githubLink", e.target.value)}
                        placeholder="https://github.com/username/repository"
                        required
                        className="border-gray-400 focus:border-purple-500 focus:ring-purple-200"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={addExperiment}
            variant="outline"
            className="w-full border-dashed border-gray-400 hover:bg-gray-200 text-gray-700"
          >
            + Add Experiment
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            onClick={togglePreview}
            variant="outline"
            disabled={!isFormValid()}
            className="border-gray-400 hover:bg-gray-200 text-gray-700"
          >
            {previewVisible ? "Hide Preview" : "Show Preview"}
          </Button>

          <Button
            onClick={handleDownloadDocx}
            disabled={!isFormValid() || isGenerating}
            className="bg-pink-400 hover:bg-pink-500 text-white"
          >
            Download DOCX
          </Button>

          <Button
            onClick={handleDownloadPdf}
            disabled={!isFormValid() || isGenerating}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            Download PDF
          </Button>
        </div>

        {previewVisible && isFormValid() && (
          <DocumentPreview
            courseTitle={courseTitle}
            experiments={experiments}
            studentName={studentName}
            registerNumber={registerNumber}
          />
        )}
      </div>
    </div>
  )
}
