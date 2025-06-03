import { jsPDF } from "jspdf"
import "jspdf-autotable"

type Experiment = {
  id: string
  title: string
  githubLink: string
}

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function generatePdf(
  courseTitle: string,
  experiments: Experiment[],
  studentName: string,
  registerNumber: string,
): Promise<Blob> {
  // Create new PDF document
  const doc = new jsPDF()

  // Set fonts
  doc.setFont("helvetica", "normal") // Using helvetica as closest to Arial

  // Add title
  doc.setFontSize(17)
  doc.text("Table of Contents", doc.internal.pageSize.width / 2, 20, { align: "center" })
  doc.text(courseTitle, doc.internal.pageSize.width / 2, 30, { align: "center" })

  // Create table data
  const tableData = experiments.map((exp, index) => [
    index + 1,
    "",
    `${exp.title}\n${exp.githubLink}`,
    "", // QR code would go here
    "",
    "",
  ])

  // Create table with autotable
  doc.autoTable({
    startY: 40,
    head: [["Exp No", "Date", "Experiment Title", "QR Code", "Marks", "Signature"]],
    body: tableData,
    headStyles: {
      fontStyle: "normal",
      fontSize: 14,
      font: "helvetica", // closest to Arial
      fillColor: [242, 242, 242],
      textColor: [0, 0, 0],
      halign: "center",
    },
    bodyStyles: {
      font: "times", // Times New Roman
      fontSize: 12,
      fontStyle: "normal",
    },
    alternateRowStyles: {
      fillColor: [230, 240, 255], // Light blue for even rows
    },
    columnStyles: {
      0: { halign: "center" }, // Exp No
      1: { halign: "center" }, // Date
      2: { halign: "left" }, // Experiment Title
      3: { halign: "center" }, // QR Code
      4: { halign: "center" }, // Marks
      5: { halign: "center" }, // Signature
    },
    margin: { top: 40 },
    didDrawPage: (data) => {
      // Add header on each page if needed
    },
  })

  // Add confirmation text
  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.setFont("times", "normal")
  doc.setFontSize(12)
  doc.text(
    "I confirm that the experiments and GitHub links provided are entirely my own work.",
    doc.internal.pageSize.width / 2,
    finalY,
    { align: "center" },
  )

  // Add student details
  doc.text(`Name: ${studentName}`, 20, finalY + 20)
  doc.text("Date:", 20, finalY + 30)
  doc.text(`Register Number: ${registerNumber}`, doc.internal.pageSize.width / 2 + 10, finalY + 20)
  doc.text("Learner Signature:", doc.internal.pageSize.width / 2 + 10, finalY + 30)

  // Return the PDF as a blob
  return doc.output("blob")
}
