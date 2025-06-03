import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { courseTitle, experiments, studentName, registerNumber } = data

    // Import jsPDF dynamically
    const { jsPDF } = await import("jspdf")

    // Create new PDF document
    const doc = new jsPDF()

    // Fetch and add college logo
    try {
      const logoResponse = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample.jpg-CSVdko8BbmuXh3iqvpkHtocVYTrjwY.jpeg",
      )
      const logoBlob = await logoResponse.blob()
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(logoBlob)
      })

      // Add logo
      const pageWidth = doc.internal.pageSize.width
      doc.addImage(logoBase64, "JPEG", (pageWidth - 100) / 2, 10, 100, 25)
    } catch (error) {
      console.log("Could not load logo, continuing without it")
    }

    // Add title
    doc.setFont("helvetica", "normal")
    doc.setFontSize(17)
    const pageWidth = doc.internal.pageSize.width
    doc.text("Table of Contents", pageWidth / 2, 45, { align: "center" })
    doc.text(courseTitle, pageWidth / 2, 55, { align: "center" })

    // Generate QR codes
    const qrCodes = await Promise.all(
      experiments.map(async (exp: any) => {
        try {
          const qrResponse = await fetch(
            `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(exp.githubLink)}`,
          )
          const qrBlob = await qrResponse.blob()
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(qrBlob)
          })
        } catch (error) {
          return null
        }
      }),
    )

    // Table setup
    const startY = 75
    const rowHeight = 25
    const colWidths = [20, 25, 80, 25, 20, 25] // Column widths
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0)
    const startX = (pageWidth - tableWidth) / 2

    // Draw table headers
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")

    // Header background - white
    doc.setFillColor(255, 255, 255) // White background
    doc.rect(startX, startY, tableWidth, rowHeight, "F")

    // Header borders - thicker borders
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.8)
    doc.rect(startX, startY, tableWidth, rowHeight)

    // Header text
    const headers = ["Exp No", "Date", "Experiment Title", "QR Code", "Marks", "Signature"]
    let currentX = startX

    headers.forEach((header, index) => {
      // Vertical lines
      if (index > 0) {
        doc.line(currentX, startY, currentX, startY + rowHeight)
      }

      // Header text - no bold
      doc.text(header, currentX + colWidths[index] / 2, startY + 15, { align: "center" })
      currentX += colWidths[index]
    })

    // Draw data rows
    doc.setFont("times", "normal")
    doc.setFontSize(12)
    doc.setLineWidth(0.5)

    experiments.forEach((experiment: any, index: number) => {
      const rowY = startY + (index + 1) * rowHeight

      // All rows white
      doc.setFillColor(255, 255, 255) // White background for all rows
      doc.rect(startX, rowY, tableWidth, rowHeight, "F")

      // Row border
      doc.setDrawColor(0, 0, 0)
      doc.rect(startX, rowY, tableWidth, rowHeight)

      // Cell data
      currentX = startX

      // Exp No
      doc.text((index + 1).toString(), currentX + colWidths[0] / 2, rowY + 12, { align: "center" })
      currentX += colWidths[0]
      doc.line(currentX, rowY, currentX, rowY + rowHeight)

      // Date
      const dateText = experiment.date ? new Date(experiment.date).toLocaleDateString() : ""
      doc.text(dateText, currentX + colWidths[1] / 2, rowY + 12, { align: "center" })
      currentX += colWidths[1]
      doc.line(currentX, rowY, currentX, rowY + rowHeight)

      // Experiment Title and GitHub link
      const titleLines = doc.splitTextToSize(experiment.title, colWidths[2] - 4)
      const linkLines = doc.splitTextToSize(experiment.githubLink, colWidths[2] - 4)

      let textY = rowY + 8
      titleLines.forEach((line: string) => {
        doc.text(line, currentX + 2, textY)
        textY += 4
      })

      doc.setTextColor(0, 0, 255) // Blue color for links
      linkLines.forEach((line: string) => {
        doc.text(line, currentX + 2, textY)
        textY += 4
      })
      doc.setTextColor(0, 0, 0) // Reset to black

      currentX += colWidths[2]
      doc.line(currentX, rowY, currentX, rowY + rowHeight)

      // QR Code
      if (qrCodes[index]) {
        try {
          doc.addImage(qrCodes[index], "PNG", currentX + 5, rowY + 2, 15, 15)
        } catch (error) {
          console.log("Could not add QR code for experiment", index + 1)
        }
      }
      currentX += colWidths[3]
      doc.line(currentX, rowY, currentX, rowY + rowHeight)

      // Marks (empty)
      currentX += colWidths[4]
      doc.line(currentX, rowY, currentX, rowY + rowHeight)

      // Signature (empty)
      currentX += colWidths[5]
    })

    // Add confirmation text
    const finalY = startY + (experiments.length + 1) * rowHeight + 20
    doc.setFont("times", "normal")
    doc.setFontSize(12)
    doc.text(
      "I confirm that the experiments and GitHub links provided are entirely my own work.",
      pageWidth / 2,
      finalY,
      { align: "center" },
    )

    // Add student details in proper alignment
    const detailsY = finalY + 20
    doc.text(`Name: ${studentName}`, 20, detailsY)
    doc.text("Date:", 20, detailsY + 10)
    doc.text(`Register Number: ${registerNumber}`, pageWidth / 2 + 10, detailsY)
    doc.text("Learner Signature:", pageWidth / 2 + 10, detailsY + 10)

    // Get PDF as array buffer
    const pdfBuffer = doc.output("arraybuffer")

    // Return as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${courseTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Lab_Record.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
