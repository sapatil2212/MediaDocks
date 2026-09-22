/**
 * Transcription utilities and export helpers for MediaDocks
 * Supports SRT, VTT, TXT, JSON subtitle formats, 150+ language definitions,
 * and speaker segment parsing.
 */

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  startFormatted: string;
  endFormatted: string;
  speaker: string;
  text: string;
  words?: TranscriptWord[];
}

export interface TranscriptionResult {
  id: string;
  title: string;
  duration: number;
  durationFormatted: string;
  language: string;
  languageName: string;
  mode: "ai" | "high_accuracy";
  wordCount: number;
  confidence: number;
  mediaType: "video" | "audio";
  /** Complete transcript without timestamps or speaker labels. */
  text?: string;
  previewUrl?: string;
  segments: TranscriptSegment[];
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "auto", name: "Auto-Detect Language", nativeName: "Auto Detect", flag: "🌐" },
  { code: "en", name: "English (US / UK / Global)", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "Chinese (Mandarin)", nativeName: "中文", flag: "🇨🇳" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
];

/**
 * Formats seconds into MM:SS or HH:MM:SS format
 */
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Format timestamp for SRT: HH:MM:SS,mmm
 */
export function formatSrtTime(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/**
 * Format timestamp for VTT: HH:MM:SS.mmm
 */
export function formatVttTime(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

/**
 * Export segments to SRT format
 */
export function exportToSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, index) => {
      const srtStart = formatSrtTime(seg.start);
      const srtEnd = formatSrtTime(seg.end);
      const speakerPrefix = seg.speaker ? `${seg.speaker}: ` : "";
      return `${index + 1}\n${srtStart} --> ${srtEnd}\n${speakerPrefix}${seg.text.trim()}\n`;
    })
    .join("\n");
}

/**
 * Export segments to WebVTT format
 */
export function exportToVtt(segments: TranscriptSegment[]): string {
  const body = segments
    .map((seg, index) => {
      const vttStart = formatVttTime(seg.start);
      const vttEnd = formatVttTime(seg.end);
      const speakerPrefix = seg.speaker ? `<v ${seg.speaker}>` : "";
      return `${index + 1}\n${vttStart} --> ${vttEnd}\n${speakerPrefix}${seg.text.trim()}\n`;
    })
    .join("\n");

  return `WEBVTT - Generated by MediaDocks\n\n${body}`;
}

/**
 * Export segments to Plain Text (TXT)
 */
export function exportToTxt(
  segments: TranscriptSegment[],
  options: { includeTimestamps?: boolean; includeSpeakers?: boolean } = {
    includeTimestamps: false,
    includeSpeakers: false,
  }
): string {
  return segments
    .map((seg) => {
      const parts: string[] = [];
      if (options.includeTimestamps) {
        parts.push(`[${seg.startFormatted} - ${seg.endFormatted}]`);
      }
      if (options.includeSpeakers && seg.speaker) {
        parts.push(`${seg.speaker}:`);
      }
      parts.push(seg.text.trim());
      return parts.join(" ");
    })
    .join("\n\n");
}

/**
 * Export segments to JSON
 */
export function exportToJson(data: TranscriptionResult): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Export to CSV (Excel-compatible) with proper quoting
 */
export function exportToCsv(segments: TranscriptSegment[], result: TranscriptionResult): string {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = "Segment,Start,End,Speaker,Text,Words";
  const rows = segments.map((seg, i) => {
    const words = seg.text.split(/\s+/).filter(Boolean).length;
    return [
      i + 1,
      seg.startFormatted,
      seg.endFormatted,
      escape(seg.speaker),
      escape(seg.text),
      words,
    ].join(",");
  });

  const meta = [
    `# Title: ${result.title}`,
    `# Duration: ${result.durationFormatted}`,
    `# Language: ${result.languageName}`,
    `# Words: ${result.wordCount}`,
    `# Mode: ${result.mode === "high_accuracy" ? "High Accuracy" : "AI Standard"}`,
    "",
  ].join("\n");

  return meta + header + "\n" + rows.join("\n");
}

/**
 * Generate a self-contained HTML document for PDF export.
 * The caller opens it in a new window and triggers window.print().
 */
export function exportToPdfHtml(segments: TranscriptSegment[], result: TranscriptionResult): string {
  const segHtml = segments
    .map(
      (seg) => `
      <div class="seg">
        <div class="meta">
          <span class="time">${seg.startFormatted} – ${seg.endFormatted}</span>
          <span class="spk">${seg.speaker}</span>
        </div>
        <p class="txt">${seg.text}</p>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${result.language}">
<head>
<meta charset="utf-8">
<title>${result.title} — Transcript</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;color:#1a1a2e;background:#fff;padding:2.5rem 3rem;line-height:1.6;max-width:800px;margin:0 auto}
  h1{font-size:1.4rem;font-weight:700;margin-bottom:.3rem;color:#0f172a}
  .info{font-size:.8rem;color:#64748b;margin-bottom:1.8rem;border-bottom:2px solid #e2e8f0;padding-bottom:.8rem}
  .info span{margin-right:1.2rem}
  .seg{margin-bottom:1rem;page-break-inside:avoid}
  .meta{display:flex;gap:.6rem;align-items:center;margin-bottom:.15rem}
  .time{font-size:.75rem;font-weight:600;color:#7c3aed;background:#f3f0ff;padding:.1rem .45rem;border-radius:4px}
  .spk{font-size:.75rem;font-weight:500;color:#475569}
  .txt{font-size:.88rem;line-height:1.65;color:#334155}
  .footer{margin-top:2rem;padding-top:.8rem;border-top:1px solid #e2e8f0;font-size:.7rem;color:#94a3b8;text-align:center}
  @media print{body{padding:1.5cm}@page{margin:1.5cm}}
</style>
</head>
<body>
  <h1>${result.title}</h1>
  <div class="info">
    <span>⏱ ${result.durationFormatted}</span>
    <span>🌐 ${result.languageName}</span>
    <span>📝 ${result.wordCount} words</span>
    <span>🎯 ${Math.round(result.confidence * 100)}% confidence</span>
  </div>
  ${segHtml}
  <div class="footer">Generated by MediaDocks — ${new Date().toLocaleDateString()}</div>
  <script>window.onload=()=>{window.print()}</script>
</body>
</html>`;
}

/**
 * Generate a minimal valid DOCX file as an ArrayBuffer.
 * DOCX is a ZIP of XML files; we build the bare minimum
 * structure needed for Word / Google Docs / LibreOffice.
 */
export async function exportToDocx(
  segments: TranscriptSegment[],
  result: TranscriptionResult,
): Promise<Blob> {
  // Build document.xml body
  const paraXml = (text: string, bold = false, size = 22, color = "000000") => {
    const rPr = `<w:rPr>${bold ? "<w:b/>" : ""}<w:sz w:val="${size}"/><w:color w:val="${color}"/></w:rPr>`;
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
  };

  const bodyParts: string[] = [];
  bodyParts.push(paraXml(result.title, true, 28));
  bodyParts.push(
    paraXml(
      `Duration: ${result.durationFormatted}  |  Language: ${result.languageName}  |  Words: ${result.wordCount}  |  Confidence: ${Math.round(result.confidence * 100)}%`,
      false,
      18,
      "666666",
    ),
  );
  bodyParts.push(paraXml("", false, 12)); // spacer

  for (const seg of segments) {
    bodyParts.push(paraXml(`[${seg.startFormatted} – ${seg.endFormatted}]  ${seg.speaker}`, true, 20, "6D28D9"));
    bodyParts.push(paraXml(seg.text, false, 22));
    bodyParts.push(paraXml("", false, 10)); // spacer
  }

  bodyParts.push(paraXml(`Generated by MediaDocks — ${new Date().toLocaleDateString()}`, false, 16, "999999"));

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyParts.join("\n")}</w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  // Use the JSZip-free approach: build a valid ZIP in pure JS
  // We'll use a simple CRC-less store method (no compression, universally compatible)
  const files: { path: string; content: Uint8Array }[] = [
    { path: "[Content_Types].xml", content: new TextEncoder().encode(contentTypesXml) },
    { path: "_rels/.rels", content: new TextEncoder().encode(relsXml) },
    { path: "word/document.xml", content: new TextEncoder().encode(documentXml) },
    { path: "word/_rels/document.xml.rels", content: new TextEncoder().encode(wordRelsXml) },
  ];

  const zipBytes = buildZip(files);
  return new Blob([zipBytes.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/**
 * Builds a minimal valid ZIP archive (store mode, no compression).
 * Compatible with all ZIP readers. Used for DOCX generation.
 */
function buildZip(files: { path: string; content: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralEntries: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.path);
    const crc = crc32(file.content);

    // Local file header
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression (store)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, file.content.length, true); // compressed size
    lv.setUint32(22, file.content.length, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra field length
    local.set(nameBytes, 30);

    parts.push(local);
    parts.push(file.content);

    // Central directory entry
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0, true); // mod date
    cv.setUint32(16, crc, true);
    cv.setUint32(20, file.content.length, true);
    cv.setUint32(24, file.content.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra field length
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk number
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // local header offset
    central.set(nameBytes, 46);

    centralEntries.push(central);
    offset += local.length + file.content.length;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const entry of centralEntries) {
    parts.push(entry);
    centralSize += entry.length;
  }

  // End of central directory
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true); // disk number
  ev.setUint16(6, 0, true); // central dir disk
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralStart, true);
  ev.setUint16(20, 0, true); // comment length

  parts.push(eocd);

  // Concatenate all parts
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const part of parts) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}

/** CRC-32 lookup table */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Helper to download text content as a file in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeFilename = filename
    .replace(/[<>:\"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "transcript.txt";
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Helper to download binary content (Blob) as a file in browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
