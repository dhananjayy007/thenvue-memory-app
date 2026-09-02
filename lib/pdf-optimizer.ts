import { MAX_MEDIA_BYTES } from './memories'

export type PendingPdf = {
  file: File
  originalName: string
  preview: string
}

export async function optimizePdf(source: File): Promise<PendingPdf> {
  if (typeof window === 'undefined') {
    throw new Error('PDF optimization can only be performed in the browser.')
  }

  // Dynamic import to prevent SSR DOMMatrix / window evaluation errors
  const pdfjsLib = await import('pdfjs-dist')
  const { jsPDF } = await import('jspdf')

  // Configure worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  }

  const arrayBuffer = await source.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  // A4 size is roughly 210x297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // We limit to 50 pages to prevent browser crash
  const maxPages = Math.min(pdf.numPages, 50)

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)

    // Calculate a good scale to rasterize at 150 DPI approx
    const scale = 1.5
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not create canvas context for PDF compression.')

    // Fill white background (PDFs might be transparent)
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // @ts-expect-error - PDFJS types are strict but this works at runtime
    await page.render({ canvasContext: context, viewport }).promise

    // Compress canvas to JPEG
    const quality = 0.65 // High compression for documents
    const imgData = canvas.toDataURL('image/jpeg', quality)

    // Add to jsPDF
    if (i > 1) {
      doc.addPage()
    }

    // A4 dimensions in jsPDF (mm)
    const pdfWidth = doc.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
  }

  const pdfBlob = doc.output('blob')

  if (pdfBlob.size > MAX_MEDIA_BYTES) {
    throw new Error('PDF is still too large after compression.')
  }

  const baseName = source.name.replace(/\.[^.]+$/, '').replace(/[\\/\u0000]/g, '_').trim() || 'document'
  const file = new File([pdfBlob], `${baseName}.pdf`, { type: 'application/pdf' })

  return {
    file,
    originalName: source.name.slice(0, 255) || 'document.pdf',
    preview: 'pdf-icon',
  }
}
