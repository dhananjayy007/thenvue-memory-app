/**
 * Mobile Photo Date and EXIF Metadata Extractor
 * 
 * Implements strict date priority:
 * 1. DateTimeOriginal / EXIF original capture date
 * 2. EXIF CreateDate
 * 3. EXIF DateTimeDigitized
 * 4. Native/platform media creation date (if reliable)
 * 5. Filename-derived date (e.g. WhatsApp, Pixel, iOS camera, screenshot names)
 * 6. Date status = 'unknown' (requires user manual selection)
 */

export type DateSource =
  | 'exif_original'
  | 'exif_create'
  | 'exif_digitized'
  | 'native_creation'
  | 'filename'
  | 'user_selected'
  | 'unknown'

export type DateStatus = 'exact' | 'inferred' | 'unknown'

export type ExtractedPhotoMetadata = {
  capturedAt: string | null
  capturedDate: string | null
  capturedTime: string | null
  dateSource: DateSource
  dateStatus: DateStatus
  importedAt: string
  exifDateTimeOriginal?: string | null
  exifCreateDate?: string | null
  nativeCreationDate?: string | null
  filenameDerivedDate?: string | null
  latitude?: number | null
  longitude?: number | null
}

export function extractPhotoMetadataMobile({
  bytes,
  fileName,
  nativeCreationDate,
}: {
  bytes?: Uint8Array | null
  fileName?: string
  nativeCreationDate?: string | number | Date | null
}): ExtractedPhotoMetadata {
  const importedAt = new Date().toISOString()
  const exif = bytes ? parseJpegExif(bytes) : null

  const exifDateTimeOriginal = exif?.dateTimeOriginal || null
  const exifCreateDate = exif?.createDate || null
  const filenameResult = fileName ? parseDateFromFilename(fileName) : null
  const filenameDerivedDate = filenameResult ? filenameResult.isoString : null

  let validNativeDate: string | null = null
  if (nativeCreationDate) {
    try {
      const d = new Date(nativeCreationDate)
      if (!isNaN(d.getTime())) {
        validNativeDate = d.toISOString()
      }
    } catch {
      // ignore
    }
  }

  let selectedIso: string | null = null
  let selectedDate: string | null = null
  let selectedTime: string | null = null
  let dateSource: DateSource = 'unknown'
  let dateStatus: DateStatus = 'unknown'

  // Priority 1: EXIF DateTimeOriginal
  if (exifDateTimeOriginal) {
    const parsed = parseExifDateString(exifDateTimeOriginal, exif?.offsetTimeOriginal)
    if (parsed) {
      selectedIso = parsed.isoString
      selectedDate = parsed.date
      selectedTime = parsed.time
      dateSource = 'exif_original'
      dateStatus = 'exact'
    }
  }

  // Priority 2: EXIF CreateDate
  if (!selectedDate && exifCreateDate) {
    const parsed = parseExifDateString(exifCreateDate)
    if (parsed) {
      selectedIso = parsed.isoString
      selectedDate = parsed.date
      selectedTime = parsed.time
      dateSource = 'exif_create'
      dateStatus = 'exact'
    }
  }

  // Priority 3: Native creation date (if not current minute)
  if (!selectedDate && validNativeDate) {
    const nativeTimeMs = new Date(validNativeDate).getTime()
    const diffSeconds = Math.abs(Date.now() - nativeTimeMs) / 1000
    if (diffSeconds > 120 || validNativeDate.slice(0, 10) !== importedAt.slice(0, 10)) {
      const d = new Date(validNativeDate)
      selectedIso = validNativeDate
      selectedDate = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-')
      selectedTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      dateSource = 'native_creation'
      dateStatus = 'exact'
    }
  }

  // Priority 4: Filename (e.g. IMG-20260203-WA0002.jpg)
  if (!selectedDate && filenameResult) {
    selectedIso = filenameResult.isoString
    selectedDate = filenameResult.date
    selectedTime = filenameResult.time
    dateSource = 'filename'
    dateStatus = filenameResult.hasTime ? 'exact' : 'inferred'
  }

  return {
    capturedAt: selectedIso,
    capturedDate: selectedDate,
    capturedTime: selectedTime,
    dateSource,
    dateStatus,
    importedAt,
    exifDateTimeOriginal,
    exifCreateDate,
    nativeCreationDate: validNativeDate,
    filenameDerivedDate,
    latitude: exif?.latitude ?? null,
    longitude: exif?.longitude ?? null,
  }
}

export function parseExifDateString(dateStr: string, tzOffset?: string | null) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const match = dateStr.trim().match(/^(\d{4})[:\-\/](\d{2})[:\-\/](\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return null

  const [, year, month, day, hour, minute, second = '00'] = match
  const y = parseInt(year, 10)
  const m = parseInt(month, 10)
  const d = parseInt(day, 10)
  if (y < 1970 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) return null

  const date = `${year}-${month}-${day}`
  const time = `${hour}:${minute}:${second}`
  const offset = tzOffset && /^[+\-]\d{2}:\d{2}$/.test(tzOffset) ? tzOffset : 'Z'
  return { isoString: `${date}T${time}${offset === 'Z' ? '.000Z' : offset}`, date, time }
}

export function parseDateFromFilename(fileName: string) {
  if (!fileName) return null
  const baseName = fileName.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || fileName

  // WhatsApp
  const waMatch = baseName.match(/(?:IMG|VID)[-_](\d{4})(\d{2})(\d{2})[-_]WA(\d+)/i)
  if (waMatch) {
    const [, y, m, d] = waMatch
    const yNum = parseInt(y, 10)
    const mNum = parseInt(m, 10)
    const dNum = parseInt(d, 10)
    if (yNum >= 1970 && yNum <= 2099 && mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      const date = `${y}-${m}-${d}`
      const time = '12:00:00'
      return { isoString: `${date}T${time}.000Z`, date, time, hasTime: false }
    }
  }

  // Camera / Pixel timestamp YYYYMMDD_HHMMSS
  const fullTimestampMatch = baseName.match(/(?:(?:PXL|IMG|VID|MVIMG|Screenshot|Screen_Recording)[-_])?(\d{4})(\d{2})(\d{2})[-_T\s](\d{2})(\d{2})(\d{2})/i)
  if (fullTimestampMatch) {
    const [, y, m, d, hh, mm, ss] = fullTimestampMatch
    const date = `${y}-${m}-${d}`
    const time = `${hh}:${mm}:${ss}`
    return { isoString: `${date}T${time}.000Z`, date, time, hasTime: true }
  }

  // General Date YYYY-MM-DD
  const dateOnlyMatch = baseName.match(/(?:^|[^0-9])(19\d{2}|20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])(?:[^0-9]|$)/)
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch
    const date = `${y}-${m}-${d}`
    const time = '12:00:00'
    return { isoString: `${date}T${time}.000Z`, date, time, hasTime: false }
  }

  return null
}

function parseJpegExif(bytes: Uint8Array) {
  try {
    if (bytes.length < 12 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
    let offset = 2
    let app1Offset = -1

    while (offset < bytes.length - 4) {
      if (bytes[offset] !== 0xff) { offset++; continue }
      const marker = bytes[offset + 1]
      if (marker === 0xe1) { app1Offset = offset + 2; break }
      if (marker === 0xda || marker === 0xd9) break
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
      if (length <= 0) break
      offset += 2 + length
    }

    if (app1Offset === -1 || app1Offset + 14 > bytes.length) return null
    const app1Length = (bytes[app1Offset] << 8) | bytes[app1Offset + 1]
    const tiffHeaderOffset = app1Offset + 2
    const exifHeader = String.fromCharCode(bytes[tiffHeaderOffset], bytes[tiffHeaderOffset + 1], bytes[tiffHeaderOffset + 2], bytes[tiffHeaderOffset + 3])
    if (exifHeader !== 'Exif') return null

    const tiffStart = tiffHeaderOffset + 6
    const tiffBytes = bytes.subarray(tiffStart, Math.min(bytes.length, tiffHeaderOffset + app1Length))
    if (tiffBytes.length < 8) return null

    const view = new DataView(tiffBytes.buffer, tiffBytes.byteOffset, tiffBytes.byteLength)
    const littleEndian = view.getUint16(0, false) === 0x4949
    if (view.getUint16(2, littleEndian) !== 42) return null
    const firstIfdOffset = view.getUint32(4, littleEndian)
    if (firstIfdOffset >= tiffBytes.length) return null

    const tags: Record<number, any> = {}
    const entryCount = view.getUint16(firstIfdOffset, littleEndian)
    let curr = firstIfdOffset + 2
    for (let i = 0; i < entryCount && curr + 12 <= view.byteLength; i++, curr += 12) {
      const tag = view.getUint16(curr, littleEndian)
      const type = view.getUint16(curr + 2, littleEndian)
      const count = view.getUint32(curr + 4, littleEndian)
      if (type === 2 && count > 0) {
        let valOff = curr + 8
        if (count > 4) valOff = view.getUint32(valOff, littleEndian)
        if (valOff + count <= view.byteLength) {
          const chars: string[] = []
          for (let j = 0; j < count; j++) {
            const c = view.getUint8(valOff + j)
            if (c === 0) break
            chars.push(String.fromCharCode(c))
          }
          tags[tag] = chars.join('').trim()
        }
      }
    }

    // SubIFD
    if (tags[0x8769]) {
      const subOff = Number(tags[0x8769])
      if (subOff < tiffBytes.length) {
        const subCount = view.getUint16(subOff, littleEndian)
        let subCurr = subOff + 2
        for (let i = 0; i < subCount && subCurr + 12 <= view.byteLength; i++, subCurr += 12) {
          const tag = view.getUint16(subCurr, littleEndian)
          const type = view.getUint16(subCurr + 2, littleEndian)
          const count = view.getUint32(subCurr + 4, littleEndian)
          if (type === 2 && count > 0) {
            let valOff = subCurr + 8
            if (count > 4) valOff = view.getUint32(valOff, littleEndian)
            if (valOff + count <= view.byteLength) {
              const chars: string[] = []
              for (let j = 0; j < count; j++) {
                const c = view.getUint8(valOff + j)
                if (c === 0) break
                chars.push(String.fromCharCode(c))
              }
              tags[tag] = chars.join('').trim()
            }
          }
        }
      }
    }

    return {
      dateTimeOriginal: tags[0x9003] || null,
      createDate: tags[0x9004] || tags[0x0132] || null,
      offsetTimeOriginal: tags[0x9011] || null,
      latitude: null,
      longitude: null,
    }
  } catch {
    return null
  }
}
