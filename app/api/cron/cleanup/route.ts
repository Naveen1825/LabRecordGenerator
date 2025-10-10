import { NextResponse } from 'next/server'
import { deleteExpiredRecords } from '@/lib/firestore'

// This route should only be accessible by Vercel Cron
// It will be called daily to clean up expired records
export const dynamic = 'force-dynamic'
export const revalidate = 0

// This is the secret defined in your Vercel environment variables
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  // Verify the request is coming from Vercel Cron
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    await deleteExpiredRecords()
    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup completed successfully' 
    })
  } catch (error) {
    console.error('Error during cleanup:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clean up records',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
