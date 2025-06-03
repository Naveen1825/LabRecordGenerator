import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
  limit,
} from "firebase/firestore"
import { db } from "./firebase"

export type DocumentRecord = {
  id?: string
  userId: string
  courseTitle: string
  studentName: string
  registerNumber: string
  experiments: Array<{
    id: string
    title: string
    githubLink: string
    date?: string // Optional date field
  }>
  createdAt: Timestamp
  updatedAt: Timestamp
  expiresAt: Timestamp
  downloadCount: number
}

// Check if Firestore is properly configured
export async function checkFirestoreAccess(userId: string): Promise<boolean> {
  try {
    // Use simple query without ordering to avoid index requirements
    const testQuery = query(collection(db, "documentRecords"), where("userId", "==", userId), limit(1))
    await getDocs(testQuery)
    return true
  } catch (error: any) {
    console.warn("Firestore access check failed:", error.message)
    return false
  }
}

// Save or update document record to Firestore
export async function saveOrUpdateDocumentRecord(
  userId: string,
  courseTitle: string,
  studentName: string,
  registerNumber: string,
  experiments: Array<{ id: string; title: string; githubLink: string; date?: string }>,
  isDownload = false,
): Promise<string> {
  try {
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)) // 15 days from now

    // Use simple query without ordering to avoid index requirements
    const userQuery = query(collection(db, "documentRecords"), where("userId", "==", userId))

    const userDocs = await getDocs(userQuery)

    // Find existing record with same course title in memory
    let existingDoc = null
    userDocs.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      if (data.courseTitle === courseTitle && !existingDoc) {
        existingDoc = { id: docSnapshot.id, data }
      }
    })

    if (existingDoc) {
      // Update existing record
      const existingData = existingDoc.data as DocumentRecord

      await updateDoc(doc(db, "documentRecords", existingDoc.id), {
        studentName,
        registerNumber,
        experiments,
        updatedAt: now,
        expiresAt, // Reset expiration date
        downloadCount: isDownload ? (existingData.downloadCount || 0) + 1 : existingData.downloadCount || 0,
      })

      console.log("Updated existing document record:", existingDoc.id)
      return existingDoc.id
    } else {
      // Create new record
      const docRef = await addDoc(collection(db, "documentRecords"), {
        userId,
        courseTitle,
        studentName,
        registerNumber,
        experiments,
        createdAt: now,
        updatedAt: now,
        expiresAt,
        downloadCount: isDownload ? 1 : 0,
      })

      console.log("Created new document record:", docRef.id)
      return docRef.id
    }
  } catch (error: any) {
    console.error("Error saving document record:", error)
    if (error.code === "permission-denied") {
      throw new Error("Permission denied. Please check Firestore security rules.")
    }
    if (error.message.includes("index")) {
      // If it's an index error, just create a new document instead of trying to find existing ones
      console.log("Index error detected, creating new document instead...")
      try {
        const now = Timestamp.now()
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000))

        const docRef = await addDoc(collection(db, "documentRecords"), {
          userId,
          courseTitle,
          studentName,
          registerNumber,
          experiments,
          createdAt: now,
          updatedAt: now,
          expiresAt,
          downloadCount: isDownload ? 1 : 0,
        })

        console.log("Created new document record (fallback):", docRef.id)
        return docRef.id
      } catch (fallbackError: any) {
        throw new Error(`Failed to save document record: ${fallbackError.message}`)
      }
    }
    throw new Error(`Failed to save document record: ${error.message}`)
  }
}

// Legacy function for backward compatibility
export async function saveDocumentRecord(
  userId: string,
  courseTitle: string,
  studentName: string,
  registerNumber: string,
  experiments: Array<{ id: string; title: string; githubLink: string; date?: string }>,
): Promise<string> {
  return saveOrUpdateDocumentRecord(userId, courseTitle, studentName, registerNumber, experiments, false)
}

// Get document records for a user
export async function getUserDocumentRecords(userId: string): Promise<DocumentRecord[]> {
  try {
    // Use simple query without ordering to avoid index requirements
    const q = query(collection(db, "documentRecords"), where("userId", "==", userId))

    const querySnapshot = await getDocs(q)
    const records: DocumentRecord[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      records.push({
        id: doc.id,
        userId: data.userId,
        courseTitle: data.courseTitle,
        studentName: data.studentName,
        registerNumber: data.registerNumber,
        experiments: data.experiments || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || data.createdAt, // Fallback for old records
        expiresAt: data.expiresAt,
        downloadCount: data.downloadCount || 0,
      } as DocumentRecord)
    })

    // Sort in memory by updatedAt (most recent first)
    records.sort((a, b) => {
      const aTime = a.updatedAt?.toDate() || a.createdAt.toDate()
      const bTime = b.updatedAt?.toDate() || b.createdAt.toDate()
      return bTime.getTime() - aTime.getTime()
    })

    return records
  } catch (error: any) {
    console.error("Error fetching document records:", error)
    if (error.code === "permission-denied") {
      throw new Error("Permission denied. Firestore security rules need to be configured.")
    }
    throw new Error(`Failed to fetch records: ${error.message}`)
  }
}

// Delete expired records (called automatically)
export async function deleteExpiredRecords(): Promise<void> {
  try {
    const now = Timestamp.now()
    const q = query(collection(db, "documentRecords"), where("expiresAt", "<=", now))

    const querySnapshot = await getDocs(q)
    const deletePromises = querySnapshot.docs.map((document) => deleteDoc(doc(db, "documentRecords", document.id)))

    await Promise.all(deletePromises)
  } catch (error: any) {
    console.error("Error deleting expired records:", error)
    throw error
  }
}

// Delete a specific record
export async function deleteDocumentRecord(recordId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "documentRecords", recordId))
  } catch (error: any) {
    console.error("Error deleting document record:", error)
    if (error.code === "permission-denied") {
      throw new Error("Permission denied. Cannot delete this record.")
    }
    throw new Error(`Failed to delete record: ${error.message}`)
  }
}
