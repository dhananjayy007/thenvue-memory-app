/**
 * Photo Date and EXIF Metadata Extractor
 * 
 * Strict Date Priority:
 * 1. DateTimeOriginal / EXIF original capture date
 * 2. EXIF CreateDate
 * 3. EXIF DateTimeDigitized
 * 4. Reliable native platform media creation date (e.g. mobile photo library metadata)
 * 5. Filename-derived date (e.g. WhatsApp, Pixel, iOS camera, screenshot names)
 * 6. Date status = 'unknown' (requires user to choose date during review)
 * 
 * STRICT RULES:
 * - Never use file.lastModified as capture date.
 * - Never use import/processing timestamps (new Date(), created_at, uploaded_at, job_created_at) as capture date.
 * - Keep captured_at and imported_at strictly separate.
 * - Filename parsing extracts date, but leaves time null unless filename explicitly contains time.
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
  capturedAt: string | null // ISO string if available e.g. "2026-02-03T02:22:00.000Z"
  capturedDate: string | null // YYYY-MM-DD
  capturedTime: string | null // HH:MM:SS or HH:MM or null
  hasTime: boolean
  dateSource: DateSource
  dateStatus: DateStatus
  importedAt: string // ISO timestamp of import into Thenvue
  exifDateTimeOriginal?: string | null
  exifCreateDate?: string | null
  exifDateTimeDigitized?: string | null
  nativeCreationDate?: string | null
  filenameDerivedDate?: string | null
  latitude?: number | null
  longitude?: number | null
  rawExifTags?: Record<string, any>
}

/**
 * Extract comprehensive capture date & metadata from binary buffer and/or filename.
 */
export function extractPhotoMetadata({
  buffer,
  fileName,
  nativeCreationDate,
}: {
  buffer?: Uint8Array | ArrayBuffer | Buffer | null
  fileName?: string
  nativeCreationDate?: string | number | Date | null
}): ExtractedPhotoMetadata {
  const importedAt = new Date().toISOString()
  let uint8: Uint8Array | null = null

  if (buffer) {
    if (buffer instanceof Uint8Array) {
      uint8 = buffer
    } else if (buffer instanceof ArrayBuffer) {
      uint8 = new Uint8Array(buffer)
    } else {
      const b = buffer as any
      if (b && b.buffer) {
        uint8 = new Uint8Array(b.buffer, b.byteOffset || 0, b.byteLength || b.length)
      }
    }
  }

  // 1. Parse EXIF from buffer (APP1 / TIFF headers)
  const exif = uint8 ? parseJpegExif(uint8) : null

  const exifDateTimeOriginal = exif?.dateTimeOriginal || null
  const exifCreateDate = exif?.createDate || null
  const exifDateTimeDigitized = exif?.dateTimeDigitized || null

  // 2. Parse filename date (e.g. IMG-20260203-WA0002.jpg)
  const filenameResult = fileName ? parseDateFromFilename(fileName) : null
  const filenameDerivedDate = filenameResult ? filenameResult.date : null

  // 3. Reliable native creation date (only if explicitly supplied and not modern web file.lastModified)
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
  let hasTime = false
  let dateSource: DateSource = 'unknown'
  let dateStatus: DateStatus = 'unknown'

  // Priority 1: EXIF DateTimeOriginal (Original capture moment)
  if (exifDateTimeOriginal) {
    const parsed = parseExifDateString(exifDateTimeOriginal, exif?.offsetTimeOriginal)
    if (parsed) {
      selectedIso = parsed.isoString
      selectedDate = parsed.date
      selectedTime = parsed.time
      hasTime = true
      dateSource = 'exif_original'
      dateStatus = 'exact'
    }
  }

  // Priority 2: EXIF CreateDate
  if (!selectedDate && exifCreateDate) {
    const parsed = parseExifDateString(exifCreateDate, exif?.offsetTimeDigitized)
    if (parsed) {
      selectedIso = parsed.isoString
      selectedDate = parsed.date
      selectedTime = parsed.time
      hasTime = true
      dateSource = 'exif_create'
      dateStatus = 'exact'
    }
  }

  // Priority 3: EXIF DateTimeDigitized
  if (!selectedDate && exifDateTimeDigitized) {
    const parsed = parseExifDateString(exifDateTimeDigitized)
    if (parsed) {
      selectedIso = parsed.isoString
      selectedDate = parsed.date
      selectedTime = parsed.time
      hasTime = true
      dateSource = 'exif_digitized'
      dateStatus = 'exact'
    }
  }

  // Priority 4: Reliable native platform media creation date (e.g. mobile photo library)
  if (!selectedDate && validNativeDate) {
    const nativeTimeMs = new Date(validNativeDate).getTime()
    const diffSeconds = Math.abs(Date.now() - nativeTimeMs) / 1000
    // Reject if it's modern import time (within last 5 minutes)
    if (diffSeconds > 300 || validNativeDate.slice(0, 10) !== importedAt.slice(0, 10)) {
      const d = new Date(validNativeDate)
      selectedIso = validNativeDate
      selectedDate = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-')
      selectedTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      hasTime = true
      dateSource = 'native_creation'
      dateStatus = 'exact'
    }
  }

  // Priority 5: Filename-derived date (e.g. WhatsApp IMG-20260203-WA0002.jpg)
  if (!selectedDate && filenameResult) {
    selectedIso = filenameResult.isoString
    selectedDate = filenameResult.date
    selectedTime = filenameResult.time // null if filename has no time (e.g. WhatsApp)
    hasTime = filenameResult.hasTime
    dateSource = 'filename'
    dateStatus = 'inferred'
  }

  // Fallback: If no date could be found, dateStatus is 'unknown' (NEVER use current date)
  if (!selectedDate) {
    dateSource = 'unknown'
    dateStatus = 'unknown'
    selectedIso = null
    selectedTime = null
    hasTime = false
  }

  const result: ExtractedPhotoMetadata = {
    capturedAt: selectedIso,
    capturedDate: selectedDate,
    capturedTime: selectedTime,
    hasTime,
    dateSource,
    dateStatus,
    importedAt,
    exifDateTimeOriginal,
    exifCreateDate,
    exifDateTimeDigitized,
    nativeCreationDate: validNativeDate,
    filenameDerivedDate,
    latitude: exif?.latitude ?? null,
    longitude: exif?.longitude ?? null,
    rawExifTags: exif?.tags,
  }

  // Diagnostic logging
  logPhotoDateExtraction({
    fileName: fileName || 'unknown',
    exifDateTimeOriginal,
    exifCreateDate,
    exifDateTimeDigitized,
    nativeCreationDate: validNativeDate,
    filenameDerivedDate,
    extractedCapturedAt: selectedIso,
    importedAt,
    dateSource,
    dateStatus,
    finalMemoryDate: selectedDate,
  })

  return result
}

/**
 * Diagnostic logger as specified in requirement 13.
 */
export function logPhotoDateExtraction({
  fileName,
  exifDateTimeOriginal,
  exifCreateDate,
  exifDateTimeDigitized,
  nativeCreationDate,
  filenameDerivedDate,
  extractedCapturedAt,
  importedAt,
  finalClusterDate,
  finalMemoryDate,
  dateSource,
  dateStatus,
}: {
  fileName: string
  exifDateTimeOriginal?: string | null
  exifCreateDate?: string | null
  exifDateTimeDigitized?: string | null
  nativeCreationDate?: string | null
  filenameDerivedDate?: string | null
  extractedCapturedAt?: string | null
  importedAt?: string | null
  finalClusterDate?: string | null
  finalMemoryDate?: string | null
  dateSource?: string | null
  dateStatus?: string | null
}) {
  if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_PHOTO_DATES === 'true') {
    console.log(`[PhotoDateExtractor Audit] 📸 ${fileName}:`, {
      filename: fileName,
      'EXIF DateTimeOriginal': exifDateTimeOriginal || 'None',
      'EXIF CreateDate': exifCreateDate || 'None',
      'EXIF DateTimeDigitized': exifDateTimeDigitized || 'None',
      'native creation date': nativeCreationDate || 'None',
      'filename-derived date': filenameDerivedDate || 'None',
      'final captured_at': extractedCapturedAt || 'None',
      'imported_at': importedAt || 'None',
      'date source': dateSource || 'None',
      'date status': dateStatus || 'None',
      'final cluster date': finalClusterDate || finalMemoryDate || 'None',
    })
  }
}

/**
 * Parses EXIF date format "YYYY:MM:DD HH:MM:SS" into standard components.
 */
export function parseExifDateString(
  dateStr: string,
  tzOffset?: string | null
): { isoString: string; date: string; time: string } | null {
  if (!dateStr || typeof dateStr !== 'string') return null

  // Format: "YYYY:MM:DD HH:MM:SS" or "YYYY-MM-DD HH:MM:SS"
  const match = dateStr.trim().match(/^(\d{4})[:\-\/](\d{2})[:\-\/](\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return null

  const [, year, month, day, hour, minute, second = '00'] = match
  const y = parseInt(year, 10)
  const m = parseInt(month, 10)
  const d = parseInt(day, 10)

  if (y < 1970 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) {
    return null
  }

  const date = `${year}-${month}-${day}`
  const time = `${hour}:${minute}:${second}`
  const offset = tzOffset && /^[+\-]\d{2}:\d{2}$/.test(tzOffset) ? tzOffset : 'Z'
  const isoString = `${date}T${time}${offset === 'Z' ? '.000Z' : offset}`

  return { isoString, date, time }
}

/**
 * Extracts date and optional time from camera/messenger filename patterns.
 * If filename has no time (e.g. WhatsApp IMG-20260203-WA0002.jpg), time is null and hasTime is false.
 */
export function parseDateFromFilename(
  fileName: string
): { isoString: string | null; date: string; time: string | null; hasTime: boolean } | null {
  if (!fileName) return null

  const baseName = fileName.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || fileName

  // Pattern 1: WhatsApp Android "IMG-YYYYMMDD-WAxxxx" or "VID-YYYYMMDD-WAxxxx" (NO TIME)
  const waMatch = baseName.match(/(?:IMG|VID)[-_](\d{4})(\d{2})(\d{2})[-_]WA(\d+)/i)
  if (waMatch) {
    const [, y, m, d] = waMatch
    if (isValidDate(y, m, d)) {
      const date = `${y}-${m}-${d}`
      return {
        isoString: `${date}T00:00:00.000Z`,
        date,
        time: null, // Filename does NOT contain time
        hasTime: false,
      }
    }
  }

  // Pattern 2: WhatsApp desktop/iOS with time "WhatsApp Image YYYY-MM-DD at HH.MM.SS"
  const waFullMatch = baseName.match(/WhatsApp\s+(?:Image|Video)\s+(\d{4})[-_](\d{2})[-_](\d{2})\s+at\s+(\d{2})[.:](\d{2})[.:](\d{2})/i)
  if (waFullMatch) {
    const [, y, m, d, hh, mm, ss] = waFullMatch
    if (isValidDate(y, m, d) && isValidTime(hh, mm, ss)) {
      const date = `${y}-${m}-${d}`
      const time = `${hh}:${mm}:${ss}`
      return {
        isoString: `${date}T${time}.000Z`,
        date,
        time,
        hasTime: true,
      }
    }
  }

  // Pattern 3: Standard camera / Android Pixel / Samsung / Screenshot with full timestamp:
  // (PXL_|IMG_|VID_|Screenshot_|MVIMG_)?YYYYMMDD[_ -]HHMMSS
  const fullTimestampMatch = baseName.match(/(?:(?:PXL|IMG|VID|MVIMG|Screenshot|Screen_Recording|Record)[-_])?(\d{4})(\d{2})(\d{2})[-_T\s](\d{2})(\d{2})(\d{2})/i)
  if (fullTimestampMatch) {
    const [, y, m, d, hh, mm, ss] = fullTimestampMatch
    if (isValidDate(y, m, d) && isValidTime(hh, mm, ss)) {
      const date = `${y}-${m}-${d}`
      const time = `${hh}:${mm}:${ss}`
      return {
        isoString: `${date}T${time}.000Z`,
        date,
        time,
        hasTime: true,
      }
    }
  }

  // Pattern 4: Hyphenated / dotted date & time e.g. "Screenshot_2026-02-03-02-22-00"
  const hyphenatedTimeMatch = baseName.match(/(\d{4})[-_.](\d{2})[-_.](\d{2})[-_T\s](\d{2})[-_.](\d{2})[-_.](\d{2})/)
  if (hyphenatedTimeMatch) {
    const [, y, m, d, hh, mm, ss] = hyphenatedTimeMatch
    if (isValidDate(y, m, d) && isValidTime(hh, mm, ss)) {
      const date = `${y}-${m}-${d}`
      const time = `${hh}:${mm}:${ss}`
      return {
        isoString: `${date}T${time}.000Z`,
        date,
        time,
        hasTime: true,
      }
    }
  }

  // Pattern 5: Date only with delimiters "2026-02-03" or "2026_02_03" (NO TIME)
  const dateOnlyDelimitedMatch = baseName.match(/(?:^|[^0-9])(19\d{2}|20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])(?:[^0-9]|$)/)
  if (dateOnlyDelimitedMatch) {
    const [, y, m, d] = dateOnlyDelimitedMatch
    if (isValidDate(y, m, d)) {
      const date = `${y}-${m}-${d}`
      return {
        isoString: `${date}T00:00:00.000Z`,
        date,
        time: null,
        hasTime: false,
      }
    }
  }

  return null
}

function isValidDate(yStr: string, mStr: string, dStr: string): boolean {
  const y = parseInt(yStr, 10)
  const m = parseInt(mStr, 10)
  const d = parseInt(dStr, 10)
  if (y < 1970 || y > 2099) return false
  if (m < 1 || m > 12) return false
  if (d < 1 || d > 31) return false
  return true
}

function isValidTime(hStr: string, mStr: string, sStr = '00'): boolean {
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const s = parseInt(sStr, 10)
  if (h < 0 || h > 23) return false
  if (m < 0 || m > 59) return false
  if (s < 0 || s > 59) return false
  return true
}

// ============================================================================
// Binary JPEG EXIF Parser
// ============================================================================

type ParsedExif = {
  dateTimeOriginal?: string | null
  createDate?: string | null
  dateTimeDigitized?: string | null
  offsetTimeOriginal?: string | null
  offsetTimeDigitized?: string | null
  latitude?: number | null
  longitude?: number | null
  tags?: Record<string, any>
}

export function parseJpegExif(bytes: Uint8Array): ParsedExif | null {
  try {
    if (bytes.length < 12) return null

    // Check SOI marker 0xFFD8
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      return null
    }

    let offset = 2
    let app1Offset = -1

    while (offset < bytes.length - 4) {
      if (bytes[offset] !== 0xff) {
        offset++
        continue
      }

      const marker = bytes[offset + 1]

      // APP1 Marker is 0xE1
      if (marker === 0xe1) {
        app1Offset = offset + 2
        break
      }

      // SOS (Start of Scan) or EOI: stop searching
      if (marker === 0xda || marker === 0xd9) {
        break
      }

      const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
      if (length <= 0) break
      offset += 2 + length
    }

    if (app1Offset === -1 || app1Offset + 14 > bytes.length) {
      return null
    }

    const app1Length = (bytes[app1Offset] << 8) | bytes[app1Offset + 1]
    const tiffHeaderOffset = app1Offset + 2

    // Check "Exif\0\0" header
    const exifHeader = String.fromCharCode(
      bytes[tiffHeaderOffset],
      bytes[tiffHeaderOffset + 1],
      bytes[tiffHeaderOffset + 2],
      bytes[tiffHeaderOffset + 3]
    )

    if (exifHeader !== 'Exif' || bytes[tiffHeaderOffset + 4] !== 0 || bytes[tiffHeaderOffset + 5] !== 0) {
      return null
    }

    const tiffStart = tiffHeaderOffset + 6
    const tiffEnd = Math.min(bytes.length, tiffHeaderOffset + app1Length)
    const tiffBytes = bytes.subarray(tiffStart, tiffEnd)

    if (tiffBytes.length < 8) return null

    const view = new DataView(tiffBytes.buffer, tiffBytes.byteOffset, tiffBytes.byteLength)

    const byteOrder = view.getUint16(0, false)
    const littleEndian = byteOrder === 0x4949

    if (!littleEndian && byteOrder !== 0x4d4d) {
      return null
    }

    if (view.getUint16(2, littleEndian) !== 42) {
      return null
    }

    const firstIfdOffset = view.getUint32(4, littleEndian)
    if (firstIfdOffset >= tiffBytes.length) return null

    const tags: Record<string, any> = {}

    // Parse IFD0
    const ifd0 = parseIfd(view, firstIfdOffset, littleEndian)
    Object.assign(tags, ifd0.tags)

    // Parse Exif Sub-IFD (Tag 0x8769)
    if (ifd0.tags[0x8769]) {
      const subIfdOffset = Number(ifd0.tags[0x8769])
      if (subIfdOffset < tiffBytes.length) {
        const subIfd = parseIfd(view, subIfdOffset, littleEndian)
        Object.assign(tags, subIfd.tags)
      }
    }

    // Parse GPS Sub-IFD (Tag 0x8825)
    let latitude: number | null = null
    let longitude: number | null = null

    if (ifd0.tags[0x8825]) {
      const gpsOffset = Number(ifd0.tags[0x8825])
      if (gpsOffset < tiffBytes.length) {
        const gpsIfd = parseIfd(view, gpsOffset, littleEndian)
        const latRef = gpsIfd.tags[0x0001]
        const lat = gpsIfd.tags[0x0002]
        const lonRef = gpsIfd.tags[0x0003]
        const lon = gpsIfd.tags[0x0004]

        if (Array.isArray(lat) && lat.length >= 3) {
          latitude = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === 'S' ? -1 : 1)
        }
        if (Array.isArray(lon) && lon.length >= 3) {
          longitude = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef === 'W' ? -1 : 1)
        }
      }
    }

    return {
      dateTimeOriginal: tags[0x9003] || null, // DateTimeOriginal
      createDate: tags[0x9004] || tags[0x0132] || null, // CreateDate / DateTime
      dateTimeDigitized: tags[0x9004] || null, // DateTimeDigitized
      offsetTimeOriginal: tags[0x9011] || null,
      offsetTimeDigitized: tags[0x9012] || null,
      latitude,
      longitude,
      tags,
    }
  } catch {
    return null
  }
}

function parseIfd(
  view: DataView,
  offset: number,
  littleEndian: boolean
): { tags: Record<number, any>; nextOffset: number } {
  const tags: Record<number, any> = {}
  if (offset + 2 > view.byteLength) return { tags, nextOffset: 0 }

  const entryCount = view.getUint16(offset, littleEndian)
  let currentOffset = offset + 2

  for (let i = 0; i < entryCount; i++) {
    if (currentOffset + 12 > view.byteLength) break

    const tag = view.getUint16(currentOffset, littleEndian)
    const type = view.getUint16(currentOffset + 2, littleEndian)
    const count = view.getUint32(currentOffset + 4, littleEndian)
    const valueOffset = currentOffset + 8

    const val = readTagValue(view, type, count, valueOffset, littleEndian)
    if (val !== undefined) {
      tags[tag] = val
    }

    currentOffset += 12
  }

  let nextOffset = 0
  if (currentOffset + 4 <= view.byteLength) {
    nextOffset = view.getUint32(currentOffset, littleEndian)
  }

  return { tags, nextOffset }
}

function readTagValue(
  view: DataView,
  type: number,
  count: number,
  valueOffset: number,
  littleEndian: boolean
): any {
  try {
    let dataOffset = valueOffset
    const byteSize = getTypeByteSize(type)
    const totalBytes = count * byteSize

    if (totalBytes > 4) {
      dataOffset = view.getUint32(valueOffset, littleEndian)
    }

    if (dataOffset + totalBytes > view.byteLength) {
      return undefined
    }

    if (type === 2) {
      // ASCII String
      const chars: string[] = []
      for (let i = 0; i < totalBytes; i++) {
        const c = view.getUint8(dataOffset + i)
        if (c === 0) break
        chars.push(String.fromCharCode(c))
      }
      return chars.join('').trim()
    }

    if (type === 3) {
      // SHORT (16-bit)
      if (count === 1) return view.getUint16(dataOffset, littleEndian)
      const res: number[] = []
      for (let i = 0; i < count; i++) res.push(view.getUint16(dataOffset + i * 2, littleEndian))
      return res
    }

    if (type === 4) {
      // LONG (32-bit)
      if (count === 1) return view.getUint32(dataOffset, littleEndian)
      const res: number[] = []
      for (let i = 0; i < count; i++) res.push(view.getUint32(dataOffset + i * 4, littleEndian))
      return res
    }

    if (type === 5 || type === 10) {
      // RATIONAL (numerator/denominator)
      const res: number[] = []
      for (let i = 0; i < count; i++) {
        const num = type === 5 ? view.getUint32(dataOffset + i * 8, littleEndian) : view.getInt32(dataOffset + i * 8, littleEndian)
        const den = type === 5 ? view.getUint32(dataOffset + i * 8 + 4, littleEndian) : view.getInt32(dataOffset + i * 8 + 4, littleEndian)
        res.push(den !== 0 ? num / den : 0)
      }
      return count === 1 ? res[0] : res
    }

    return undefined
  } catch {
    return undefined
  }
}

function getTypeByteSize(type: number): number {
  switch (type) {
    case 1: return 1
    case 2: return 1
    case 3: return 2
    case 4: return 4
    case 5: return 8
    case 7: return 1
    case 9: return 4
    case 10: return 8
    default: return 1
  }
}
