import DocumentGenerator from "@/components/document-generator"

export default function GeneratorPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Lab Record Table of Contents Generator</h1>
      <DocumentGenerator />
    </div>
  )
}
