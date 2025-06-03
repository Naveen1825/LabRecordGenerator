"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

type Experiment = {
  id: string
  title: string
  githubLink: string
  date?: string
}

type DocumentPreviewProps = {
  courseTitle: string
  experiments: Experiment[]
  studentName: string
  registerNumber: string
}

export default function DocumentPreview({
  courseTitle,
  experiments,
  studentName,
  registerNumber,
}: DocumentPreviewProps) {
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})

  useEffect(() => {
    const generateQRCodes = async () => {
      const codes: Record<string, string> = {}

      for (const exp of experiments) {
        if (exp.githubLink) {
          const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(exp.githubLink)}`
          codes[exp.id] = url
        }
      }

      setQrCodes(codes)
    }

    generateQRCodes()
  }, [experiments])

  return (
    <Card className="p-6 bg-white border-gray-300">
      <div className="max-w-4xl mx-auto">
        {/* College Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/college-logo.jpg"
            alt="Saveetha Engineering College Logo"
            width={320}
            height={80}
            className="object-contain"
          />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-normal text-gray-900 mb-2" style={{ fontFamily: "Arial, sans-serif" }}>
            Table of Contents
          </h2>
          <h3 className="text-lg font-normal text-gray-700" style={{ fontFamily: "Arial, sans-serif" }}>
            {courseTitle}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-white">
                <th
                  className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Exp No
                </th>
                <th
                  className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Date
                </th>
                <th
                  className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Experiment Title
                </th>
                <th
                  className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  QR Code
                </th>
                <th
                  className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Marks
                </th>
                <th
                  className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Signature
                </th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((experiment, index) => (
                <tr key={experiment.id} className="bg-white">
                  <td
                    className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    {index + 1}
                  </td>
                  <td
                    className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    {experiment.date ? new Date(experiment.date).toLocaleDateString() : ""}
                  </td>
                  <td
                    className="border-2 border-gray-400 px-4 py-3 text-sm font-normal text-gray-900"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    <div>
                      <div className="font-normal mb-2">{experiment.title}</div>
                      <div className="text-blue-600 text-xs break-all font-normal">
                        <a
                          href={experiment.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {experiment.githubLink}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-3 text-center bg-white">
                    {qrCodes[experiment.id] && (
                      <div className="flex justify-center">
                        <img
                          src={qrCodes[experiment.id] || "/placeholder.svg"}
                          alt="QR Code"
                          width={60}
                          height={60}
                          className="mx-auto"
                        />
                      </div>
                    )}
                  </td>
                  <td
                    className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900 bg-white"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  ></td>
                  <td
                    className="border-2 border-gray-400 px-4 py-3 text-center text-sm font-normal text-gray-900 bg-white"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  ></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12">
          <p
            className="text-center mb-6 text-sm font-normal text-gray-700"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            I confirm that the experiments and GitHub links provided are entirely my own work.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              className="text-sm font-normal text-gray-700 space-y-2"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              <p>
                <span className="font-normal">Name:</span> {studentName}
              </p>
              <p>
                <span className="font-normal">Date:</span>
              </p>
            </div>
            <div
              className="text-sm font-normal text-gray-700 space-y-2"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              <p>
                <span className="font-normal">Register Number:</span> {registerNumber}
              </p>
              <p>
                <span className="font-normal">Learner Signature:</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
