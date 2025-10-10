import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { courseTitle, experiments, studentName, registerNumber } = data

    // Import docx
    const docx = await import("docx")

    // Fetch and convert college logo to buffer
    const logoResponse = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample.jpg-CSVdko8BbmuXh3iqvpkHtocVYTrjwY.jpeg",
    )
    const logoBuffer = await logoResponse.arrayBuffer()

    // Generate QR codes and convert to buffers
    const qrCodeBuffers = await Promise.all(
      experiments.map(async (exp: any) => {
        const qrResponse = await fetch(
          `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(exp.githubLink)}`,
        )
        const qrBuffer = await qrResponse.arrayBuffer()
        return {
          id: exp.id,
          buffer: qrBuffer,
        }
      }),
    )

    // Create document
    const doc = new docx.Document({
      creator: "Lab Record Generator",
      title: `${courseTitle} - Table of Contents`,
      description: `Lab Record for ${studentName} (${registerNumber})`,
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: [
            // College Logo
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              spacing: {
                after: 300,
              },
              children: [
                new docx.ImageRun({
                  data: logoBuffer,
                  transformation: {
                    width: 500,
                    height: 125,
                  },
                  type: "png"
                }),
              ],
            }),

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
                  bold: false,
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
                  bold: false,
                }),
              ],
            }),

            // Table
            createExperimentsTable(experiments, qrCodeBuffers, docx),

            // Confirmation text
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              spacing: {
                before: 600,
                after: 400,
              },
              children: [
                new docx.TextRun({
                  text: "I confirm that the experiments and GitHub links provided are entirely my own work.",
                  size: 24, // 12pt
                  font: "Times New Roman",
                  bold: false,
                }),
              ],
            }),

            // Student details table for proper alignment
            new docx.Table({
              width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: docx.BorderStyle.NONE },
                bottom: { style: docx.BorderStyle.NONE },
                left: { style: docx.BorderStyle.NONE },
                right: { style: docx.BorderStyle.NONE },
                insideHorizontal: { style: docx.BorderStyle.NONE },
                insideVertical: { style: docx.BorderStyle.NONE },
              },
              rows: [
                new docx.TableRow({
                  children: [
                    new docx.TableCell({
                      width: {
                        size: 50,
                        type: docx.WidthType.PERCENTAGE,
                      },
                      children: [
                        new docx.Paragraph({
                          spacing: { after: 200 },
                          children: [
                            new docx.TextRun({
                              text: "Name: ",
                              size: 24,
                              font: "Times New Roman",
                              bold: false,
                            }),
                            new docx.TextRun({
                              text: studentName,
                              size: 24,
                              font: "Times New Roman",
                              bold: false,
                            }),
                          ],
                        }),
                        new docx.Paragraph({
                          children: [
                            new docx.TextRun({
                              text: "Date: ",
                              size: 24,
                              font: "Times New Roman",
                              bold: false,
                            }),
                          ],
                        }),
                      ],
                      borders: {
                        top: { style: docx.BorderStyle.NONE },
                        bottom: { style: docx.BorderStyle.NONE },
                        left: { style: docx.BorderStyle.NONE },
                        right: { style: docx.BorderStyle.NONE },
                      },
                    }),
                    new docx.TableCell({
                      width: {
                        size: 50,
                        type: docx.WidthType.PERCENTAGE,
                      },
                      children: [
                        new docx.Paragraph({
                          spacing: { after: 200 },
                          children: [
                            new docx.TextRun({
                              text: "Register Number: ",
                              size: 24,
                              font: "Times New Roman",
                              bold: false,
                            }),
                            new docx.TextRun({
                              text: registerNumber,
                              size: 24,
                              font: "Times New Roman",
                              bold: false,
                            }),
                          ],
                        }),
                        new docx.Paragraph({
                          children: [
                            new docx.TextRun({
                              text: "Learner Signature: ",
                              size: 24,
                              font: "Times New Roman",
                              bold: false,
                            }),
                          ],
                        }),
                      ],
                      borders: {
                        top: { style: docx.BorderStyle.NONE },
                        bottom: { style: docx.BorderStyle.NONE },
                        left: { style: docx.BorderStyle.NONE },
                        right: { style: docx.BorderStyle.NONE },
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    })

    // Generate buffer
    const buffer = await docx.Packer.toBuffer(doc)

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${courseTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Lab_Record.docx"`,
      },
    })
  } catch (error) {
    console.error("Error generating DOCX:", error)
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 })
  }
}

function createExperimentsTable(
  experiments: any[],
  qrCodeBuffers: Array<{ id: string; buffer: ArrayBuffer }>,
  docx: any,
) {
  const rows = [
    // Header row
    new docx.TableRow({
      tableHeader: true,
      height: {
        value: 600,
        rule: docx.HeightRule.ATLEAST,
      },
      children: [
        createHeaderCell("Exp No", docx, 10),
        createHeaderCell("Date", docx, 15),
        createHeaderCell("Experiment Title", docx, 40),
        createHeaderCell("QR Code", docx, 15),
        createHeaderCell("Marks", docx, 10),
        createHeaderCell("Signature", docx, 10),
      ],
    }),

    // Data rows
    ...experiments.map((experiment, index) => {
      const qrCodeBuffer = qrCodeBuffers.find((qr) => qr.id === experiment.id)

      return new docx.TableRow({
        height: {
          value: 1200,
          rule: docx.HeightRule.ATLEAST,
        },
        children: [
          // Exp No
          createCell((index + 1).toString(), docx, 10),
          // Date
          createCell(experiment.date ? new Date(experiment.date).toLocaleDateString() : "", docx, 15),
          // Experiment Title with GitHub link
          createCellWithLink(experiment.title, experiment.githubLink, docx, 40),
          // QR Code
          createQRCodeCell(qrCodeBuffer?.buffer, docx, 15),
          // Marks
          createCell("", docx, 10),
          // Signature
          createCell("", docx, 10),
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
      top: { style: docx.BorderStyle.SINGLE, size: 8, color: "000000" },
      bottom: { style: docx.BorderStyle.SINGLE, size: 8, color: "000000" },
      left: { style: docx.BorderStyle.SINGLE, size: 8, color: "000000" },
      right: { style: docx.BorderStyle.SINGLE, size: 8, color: "000000" },
      insideHorizontal: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      insideVertical: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
    },
    rows,
  })
}

function createHeaderCell(text: string, docx: any, widthPercent: number) {
  return new docx.TableCell({
    width: {
      size: widthPercent,
      type: docx.WidthType.PERCENTAGE,
    },
    shading: {
      fill: "FFFFFF", // White background
    },
    borders: {
      top: { style: docx.BorderStyle.SINGLE, size: 8, color: "000000" },
      bottom: { style: docx.BorderStyle.SINGLE, size: 8, color: "000000" },
      left: { style: docx.BorderStyle.SINGLE, size: 8, color: "000000" },
      right: { style: docx.BorderStyle.SINGLE, size: 8, color: "000000" },
    },
    children: [
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        children: [
          new docx.TextRun({
            text,
            size: 28, // 14pt
            font: "Arial",
            bold: false,
          }),
        ],
      }),
    ],
    verticalAlign: docx.VerticalAlign.CENTER,
  })
}

function createCell(text: string, docx: any, widthPercent: number) {
  return new docx.TableCell({
    width: {
      size: widthPercent,
      type: docx.WidthType.PERCENTAGE,
    },
    shading: {
      fill: "FFFFFF", // White background
    },
    borders: {
      top: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      left: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      right: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
    },
    children: [
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        children: [
          new docx.TextRun({
            text,
            size: 24, // 12pt
            font: "Times New Roman",
            bold: false,
          }),
        ],
      }),
    ],
    verticalAlign: docx.VerticalAlign.CENTER,
  })
}

function createCellWithLink(title: string, link: string, docx: any, widthPercent: number) {
  return new docx.TableCell({
    width: {
      size: widthPercent,
      type: docx.WidthType.PERCENTAGE,
    },
    shading: {
      fill: "FFFFFF", // White background
    },
    borders: {
      top: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      left: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      right: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
    },
    children: [
      new docx.Paragraph({
        alignment: docx.AlignmentType.LEFT,
        spacing: { after: 100 },
        children: [
          new docx.TextRun({
            text: title,
            size: 24, // 12pt
            font: "Times New Roman",
            bold: false,
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
            bold: false,
          }),
        ],
      }),
    ],
    verticalAlign: docx.VerticalAlign.CENTER,
  })
}

function createQRCodeCell(buffer: ArrayBuffer | undefined, docx: any, widthPercent: number) {
  return new docx.TableCell({
    width: {
      size: widthPercent,
      type: docx.WidthType.PERCENTAGE,
    },
    shading: {
      fill: "FFFFFF", // White background
    },
    borders: {
      top: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      left: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
      right: { style: docx.BorderStyle.SINGLE, size: 6, color: "000000" },
    },
    children: [
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        children: buffer
          ? [
              new docx.ImageRun({
                data: buffer,
                transformation: {
                  width: 80,
                  height: 80,
                },
                type: "png",
                alt: {
                  text: "QR Code",
                  name: "QR Code"
                }
              }),
            ]
          : [new docx.TextRun("")],
      }),
    ],
    verticalAlign: docx.VerticalAlign.CENTER,
  })
}
