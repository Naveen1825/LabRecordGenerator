type Experiment = {
  id: string
  title: string
  githubLink: string
}

export async function generateDocx(
  courseTitle: string,
  experiments: Experiment[],
  studentName: string,
  registerNumber: string,
): Promise<Blob> {
  // Import docx dynamically since it's a client-side only library
  const docx = await import("docx")

  // Create document
  const doc = new docx.Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            spacing: {
              after: 200,
            },
            children: [
              new docx.TextRun({
                text: "Table of Contents",
                size: 34, // 17pt
                font: "Arial",
              }),
            ],
          }),

          // Course Title
          new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            spacing: {
              after: 400,
            },
            children: [
              new docx.TextRun({
                text: courseTitle,
                size: 34, // 17pt
                font: "Arial",
              }),
            ],
          }),

          // Table
          createExperimentsTable(experiments),

          // Confirmation text
          new docx.Paragraph({
            alignment: docx.AlignmentType.LEFT,
            spacing: {
              before: 400,
              after: 400,
            },
            children: [
              new docx.TextRun({
                text: "I confirm that the experiments and GitHub links provided are entirely my own work.",
                size: 24, // 12pt
                font: "Times New Roman",
              }),
            ],
          }),

          // Student details
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "Name: ",
                size: 24, // 12pt
                font: "Times New Roman",
              }),
              new docx.TextRun({
                text: studentName,
                size: 24, // 12pt
                font: "Times New Roman",
              }),
            ],
          }),

          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "Date: ",
                size: 24, // 12pt
                font: "Times New Roman",
              }),
            ],
          }),

          new docx.Paragraph({
            spacing: {
              before: 200,
            },
            children: [
              new docx.TextRun({
                text: "Register Number: ",
                size: 24, // 12pt
                font: "Times New Roman",
              }),
              new docx.TextRun({
                text: registerNumber,
                size: 24, // 12pt
                font: "Times New Roman",
              }),
            ],
          }),

          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "Learner Signature: ",
                size: 24, // 12pt
                font: "Times New Roman",
              }),
            ],
          }),
        ],
      },
    ],
  })

  // Generate and return the document as a blob
  const buffer = await docx.Packer.toBlob(doc)
  return buffer
}

function createExperimentsTable(experiments: Experiment[]) {
  // Import docx dynamically
  const docx = require("docx")

  const rows = [
    // Header row
    new docx.TableRow({
      tableHeader: true,
      children: [
        createHeaderCell("Exp No"),
        createHeaderCell("Date"),
        createHeaderCell("Experiment Title"),
        createHeaderCell("QR Code"),
        createHeaderCell("Marks"),
        createHeaderCell("Signature"),
      ],
    }),

    // Data rows
    ...experiments.map((experiment, index) => {
      return new docx.TableRow({
        height: {
          value: 600,
          rule: docx.HeightRule.ATLEAST,
        },
        shading: {
          fill: index % 2 === 0 ? "E6F0FF" : "FFFFFF",
        },
        children: [
          // Exp No
          createCell((index + 1).toString()),
          // Date
          createCell(""),
          // Experiment Title with GitHub link
          createCellWithLink(experiment.title, experiment.githubLink),
          // QR Code - we'll leave this empty since embedding images is problematic
          createCell(""),
          // Marks
          createCell(""),
          // Signature
          createCell(""),
        ],
      })
    }),
  ]

  return new docx.Table({
    width: {
      size: 100,
      type: docx.WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows,
  })
}

function createHeaderCell(text: string) {
  // Import docx dynamically
  const docx = require("docx")

  return new docx.TableCell({
    shading: {
      fill: "F2F2F2",
    },
    children: [
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        children: [
          new docx.TextRun({
            text,
            size: 28, // 14pt
            font: "Arial",
          }),
        ],
      }),
    ],
    verticalAlign: docx.VerticalAlign.CENTER,
  })
}

function createCell(text: string) {
  // Import docx dynamically
  const docx = require("docx")

  return new docx.TableCell({
    children: [
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        children: [
          new docx.TextRun({
            text,
            size: 24, // 12pt
            font: "Times New Roman",
          }),
        ],
      }),
    ],
    verticalAlign: docx.VerticalAlign.CENTER,
  })
}

function createCellWithLink(title: string, link: string) {
  // Import docx dynamically
  const docx = require("docx")

  return new docx.TableCell({
    children: [
      new docx.Paragraph({
        alignment: docx.AlignmentType.LEFT,
        children: [
          new docx.TextRun({
            text: title,
            size: 24, // 12pt
            font: "Times New Roman",
          }),
        ],
      }),
      new docx.Paragraph({
        alignment: docx.AlignmentType.LEFT,
        children: [
          new docx.TextRun({
            text: link,
            size: 24, // 12pt
            font: "Times New Roman",
            color: "0000FF",
          }),
        ],
      }),
    ],
    verticalAlign: docx.VerticalAlign.CENTER,
  })
}
