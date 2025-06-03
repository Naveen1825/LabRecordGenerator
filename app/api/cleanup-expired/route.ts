import { NextResponse } from "next/server"
import { deleteExpiredRecords } from "@/lib/firestore"

export async function POST() {
  try {
    await deleteExpiredRecords()
    return NextResponse.json({ success: true, message: "Expired records cleaned up" })
  } catch (error) {
    console.error("Error cleaning up expired records:", error)
    return NextResponse.json({ error: "Failed to cleanup expired records" }, { status: 500 })
  }
}

// This can be called by a cron job or scheduled function
export async function GET() {
  try {
    await deleteExpiredRecords()
    return NextResponse.json({ success: true, message: "Expired records cleaned up" })
  } catch (error) {
    console.error("Error cleaning up expired records:", error)
    return NextResponse.json({ error: "Failed to cleanup expired records" }, { status: 500 })
  }
}
