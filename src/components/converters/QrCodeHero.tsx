"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import QRCode from "qrcode";
import JSZip from "jszip";
import { PDFDocument, rgb } from "pdf-lib";
import { toast } from "sonner";
import {
  QrCode,
  Download,
  Copy,
  Image as ImageIcon,
  Wifi,
  Link as LinkIcon,
  Type,
  Mail,
  Phone,
  Contact,
  Sliders,
  Check,
  RefreshCw,
  Trash2,
  Sparkles,
  Upload,
  FileArchive,
  Layers,
  FileCode,
  Printer,
  Compass,
  Palette,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ContentType = "url" | "text" | "wifi" | "email" | "phone" | "vcard";
type ExportFormat = "svg" | "eps" | "pdf" | "png" | "zip";

export function QrCodeHero() {
  const [contentType, setContentType] = useState<ContentType>("url");

  // Inputs
  const [url, setUrl] = useState<string>("https://mediadocks.com");
  const [text, setText] = useState<string>("");

  // WiFi
  const [ssid, setSsid] = useState<string>("");
  const [wifiPassword, setWifiPassword] = useState<string>("");
  const [wifiEncryption, setWifiEncryption] = useState<string>("WPA");
  const [wifiHidden, setWifiHidden] = useState<boolean>(false);

  // Email
  const [emailTo, setEmailTo] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");

  // Phone
  const [phoneNum, setPhoneNum] = useState<string>("");

  // vCard
  const [vcardName, setVcardName] = useState<string>("");
  const [vcardOrg, setVcardOrg] = useState<string>("");
  const [vcardPhone, setVcardPhone] = useState<string>("");
  const [vcardEmail, setVcardEmail] = useState<string>("");

  // Styling & Customization
  const [fgColor, setFgColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("H");
  const [size, setSize] = useState<number>(1024);

  // Logo Overlay
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSizePct, setLogoSizePct] = useState<number>(22); // 15 - 30%

  // Export State
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("svg");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to convert blob/url to data URL
  const toDataUrl = async (sourceUrl: string): Promise<string> => {
    if (sourceUrl.startsWith("data:")) return sourceUrl;
    const res = await fetch(sourceUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Generate payload string
  const getPayload = (): string => {
    switch (contentType) {
      case "url":
        return url.trim() || "https://mediadocks.com";
      case "text":
        return text.trim() || "Hello from MediaDocks!";
      case "wifi":
        return `WIFI:T:${wifiEncryption};S:${ssid};P:${wifiPassword};H:${wifiHidden ? "true" : "false"};;`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "phone":
        return `tel:${phoneNum}`;
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      default:
        return "https://mediadocks.com";
    }
  };

  const renderQr = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const payload = getPayload();
    // If a logo is present, force High error correction so code scans reliably
    const ecl = logoUrl ? "H" : errorCorrection;

    try {
      await QRCode.toCanvas(canvas, payload, {
        width: 512, // display canvas size
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: ecl,
      });

      // Overlay logo if present
      if (logoUrl) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const logoDimension = (canvas.width * logoSizePct) / 100;
            const x = (canvas.width - logoDimension) / 2;
            const y = (canvas.height - logoDimension) / 2;
            const padding = 6;

            // Draw white rounded background pill behind logo
            ctx.fillStyle = "#ffffff";
            const bgX = x - padding;
            const bgY = y - padding;
            const bgSize = logoDimension + padding * 2;
            const radius = 8;

            ctx.beginPath();
            ctx.moveTo(bgX + radius, bgY);
            ctx.arcTo(bgX + bgSize, bgY, bgX + bgSize, bgY + bgSize, radius);
            ctx.arcTo(bgX + bgSize, bgY + bgSize, bgX, bgY + bgSize, radius);
            ctx.arcTo(bgX, bgY + bgSize, bgX, bgY, radius);
            ctx.arcTo(bgX, bgY, bgX + bgSize, bgY, radius);
            ctx.closePath();
            ctx.fill();

            // Draw logo image
            ctx.drawImage(img, x, y, logoDimension, logoDimension);
          };
          img.src = logoUrl;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void renderQr();
  }, [
    contentType,
    url,
    text,
    ssid,
    wifiPassword,
    wifiEncryption,
    wifiHidden,
    emailTo,
    emailSubject,
    emailBody,
    phoneNum,
    vcardName,
    vcardOrg,
    vcardPhone,
    vcardEmail,
    fgColor,
    bgColor,
    errorCorrection,
    logoUrl,
    logoSizePct,
  ]);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(URL.createObjectURL(f));
    setErrorCorrection("H");
    toast.success("Logo uploaded & error correction set to High!");
  };

  const removeLogo = () => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(null);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  // 1. Generate Vector SVG String
  const getSvgString = async (): Promise<string> => {
    const payload = getPayload();
    const ecl = logoUrl ? "H" : errorCorrection;
    const qr = QRCode.create(payload, { errorCorrectionLevel: ecl });
    const rawSvg = await QRCode.toString(payload, {
      type: "svg",
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: ecl,
    });

    if (!logoUrl) {
      return rawSvg;
    }

    try {
      const dataUrl = await toDataUrl(logoUrl);
      const modSize = qr.modules.size;
      const total = modSize + 4; // margin 2 on each side
      const logoDimension = (total * logoSizePct) / 100;
      const x = (total - logoDimension) / 2;
      const y = (total - logoDimension) / 2;
      const pad = 0.5;

      const logoSvg = `
  <rect x="${(x - pad).toFixed(2)}" y="${(y - pad).toFixed(2)}" width="${(logoDimension + pad * 2).toFixed(2)}" height="${(logoDimension + pad * 2).toFixed(2)}" rx="${(logoDimension * 0.15).toFixed(2)}" ry="${(logoDimension * 0.15).toFixed(2)}" fill="#ffffff" />
  <image href="${dataUrl}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${logoDimension.toFixed(2)}" height="${logoDimension.toFixed(2)}" preserveAspectRatio="xMidYMid meet" />
</svg>`;

      return rawSvg.replace("</svg>", logoSvg);
    } catch {
      return rawSvg;
    }
  };

  // 2. Generate Vector EPS (Encapsulated PostScript for CorelDRAW & Illustrator)
  const getEpsString = (): string => {
    const payload = getPayload();
    const ecl = logoUrl ? "H" : errorCorrection;
    const qr = QRCode.create(payload, { errorCorrectionLevel: ecl });
    const modSize = qr.modules.size;
    const margin = 2;
    const total = modSize + margin * 2;
    const sizePt = 1000;
    const cellSize = (sizePt / total).toFixed(4);

    const hexToRgb01 = (hex: string) => {
      const c = hex.replace("#", "");
      const r = parseInt(c.substring(0, 2), 16) / 255;
      const g = parseInt(c.substring(2, 4), 16) / 255;
      const b = parseInt(c.substring(4, 6), 16) / 255;
      return `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`;
    };

    const bgRgb = hexToRgb01(bgColor);
    const fgRgb = hexToRgb01(fgColor);

    let eps = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${sizePt} ${sizePt}
%%HiResBoundingBox: 0 0 ${sizePt} ${sizePt}
%%Title: QR Code Vector (CorelDRAW / Adobe Illustrator compatible)
%%Creator: MediaDocks Vector Engine
%%Pages: 1
%%LanguageLevel: 2
%%EndComments

% Background
${bgRgb} setrgbcolor
0 0 ${sizePt} ${sizePt} rectfill

% Foreground Modules
${fgRgb} setrgbcolor
/sq {
  newpath
  moveto
  ${cellSize} 0 rlineto
  0 ${cellSize} rlineto
  -${cellSize} 0 rlineto
  closepath
  fill
} bind def

`;

    for (let r = 0; r < modSize; r++) {
      for (let c = 0; c < modSize; c++) {
        if (qr.modules.get(r, c)) {
          const x = ((c + margin) * (sizePt / total)).toFixed(4);
          const y = ((total - 1 - (r + margin)) * (sizePt / total)).toFixed(4);
          eps += `${x} ${y} sq\n`;
        }
      }
    }

    if (logoUrl) {
      const logoDimension = (sizePt * logoSizePct) / 100;
      const x = ((sizePt - logoDimension) / 2).toFixed(4);
      const y = ((sizePt - logoDimension) / 2).toFixed(4);
      eps += `
% Center Logo Mask
1.0000 1.0000 1.0000 setrgbcolor
${x} ${y} ${logoDimension.toFixed(4)} ${logoDimension.toFixed(4)} rectfill
`;
    }

    eps += `\nshowpage\n%%EOF\n`;
    return eps;
  };

  // 3. Generate Vector PDF (pdf-lib vector document)
  const getVectorPdfBytes = async (): Promise<Uint8Array> => {
    const payload = getPayload();
    const ecl = logoUrl ? "H" : errorCorrection;
    const qr = QRCode.create(payload, { errorCorrectionLevel: ecl });

    const pdfDoc = await PDFDocument.create();
    const pdfSize = 1000;
    const page = pdfDoc.addPage([pdfSize, pdfSize]);

    const hexToRgb = (hex: string) => {
      const c = hex.replace("#", "");
      return rgb(
        parseInt(c.substring(0, 2), 16) / 255,
        parseInt(c.substring(2, 4), 16) / 255,
        parseInt(c.substring(4, 6), 16) / 255
      );
    };

    const bg = hexToRgb(bgColor);
    const fg = hexToRgb(fgColor);

    const modSize = qr.modules.size;
    const margin = 2;
    const total = modSize + margin * 2;
    const cellSize = pdfSize / total;

    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pdfSize,
      height: pdfSize,
      color: bg,
    });

    // Modules
    for (let r = 0; r < modSize; r++) {
      for (let c = 0; c < modSize; c++) {
        if (qr.modules.get(r, c)) {
          page.drawRectangle({
            x: (c + margin) * cellSize,
            y: (total - 1 - (r + margin)) * cellSize,
            width: cellSize,
            height: cellSize,
            color: fg,
          });
        }
      }
    }

    // Logo Overlay in PDF
    if (logoUrl) {
      const logoDimension = (pdfSize * logoSizePct) / 100;
      const x = (pdfSize - logoDimension) / 2;
      const y = (pdfSize - logoDimension) / 2;
      const padding = 8;

      // Draw white background
      page.drawRectangle({
        x: x - padding,
        y: y - padding,
        width: logoDimension + padding * 2,
        height: logoDimension + padding * 2,
        color: rgb(1, 1, 1),
      });

      try {
        const res = await fetch(logoUrl);
        const imageBytes = await res.arrayBuffer();
        let embeddedImage;
        try {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } catch {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }

        if (embeddedImage) {
          page.drawImage(embeddedImage, {
            x,
            y,
            width: logoDimension,
            height: logoDimension,
          });
        }
      } catch {
        // Fallback: white mask already rendered
      }
    }

    return await pdfDoc.save();
  };

  // 4. Generate High-Res PNG Blob
  const getHighResPngBlob = async (targetSize = size): Promise<Blob> => {
    const offscreen = document.createElement("canvas");
    offscreen.width = targetSize;
    offscreen.height = targetSize;

    const payload = getPayload();
    const ecl = logoUrl ? "H" : errorCorrection;

    await QRCode.toCanvas(offscreen, payload, {
      width: targetSize,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: ecl,
    });

    if (logoUrl) {
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = logoUrl;
        });

        const logoDimension = (offscreen.width * logoSizePct) / 100;
        const x = (offscreen.width - logoDimension) / 2;
        const y = (offscreen.height - logoDimension) / 2;
        const padding = targetSize > 1024 ? 12 : 6;

        ctx.fillStyle = "#ffffff";
        const bgX = x - padding;
        const bgY = y - padding;
        const bgSize = logoDimension + padding * 2;
        const radius = targetSize > 1024 ? 16 : 8;

        ctx.beginPath();
        ctx.moveTo(bgX + radius, bgY);
        ctx.arcTo(bgX + bgSize, bgY, bgX + bgSize, bgY + bgSize, radius);
        ctx.arcTo(bgX + bgSize, bgY + bgSize, bgX, bgY + bgSize, radius);
        ctx.arcTo(bgX, bgY + bgSize, bgX, bgY, radius);
        ctx.arcTo(bgX, bgY, bgX + bgSize, bgY, radius);
        ctx.closePath();
        ctx.fill();

        ctx.drawImage(img, x, y, logoDimension, logoDimension);
      }
    }

    return new Promise<Blob>((resolve) => offscreen.toBlob((b) => resolve(b!), "image/png"));
  };

  // Download Actions
  const downloadSvg = async () => {
    setIsExporting(true);
    try {
      const svg = await getSvgString();
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      downloadBlob(blob, `qrcode_${contentType}_${Date.now()}.svg`);
      toast.success("Vector SVG downloaded!", {
        description: "Infinitely scalable · Compatible with CorelDRAW, Illustrator, Figma, and Web.",
      });
    } catch {
      toast.error("Failed to export SVG vector");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadEps = () => {
    setIsExporting(true);
    try {
      const eps = getEpsString();
      const blob = new Blob([eps], { type: "application/postscript" });
      downloadBlob(blob, `qrcode_${contentType}_${Date.now()}.eps`);
      toast.success("Vector EPS downloaded!", {
        description: "Prepress ready for CorelDRAW (.cdr) and Adobe Illustrator (.ai) vinyl/plotters.",
      });
    } catch {
      toast.error("Failed to export EPS vector");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPdf = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await getVectorPdfBytes();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      downloadBlob(blob, `qrcode_${contentType}_${Date.now()}.pdf`);
      toast.success("Vector PDF downloaded!", {
        description: "Commercial print-ready vector PDF for CorelDRAW & Acrobat.",
      });
    } catch {
      toast.error("Failed to export vector PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPng = async () => {
    setIsExporting(true);
    try {
      const blob = await getHighResPngBlob(size);
      downloadBlob(blob, `qrcode_${contentType}_${size}px_${Date.now()}.png`);
      toast.success(`High-Res PNG (${size}×{size}px) downloaded!`);
    } catch {
      toast.error("Failed to export PNG");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadZipSuite = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const base = `qrcode_${contentType}_${Date.now()}`;

      // 1. Vector SVG
      const svg = await getSvgString();
      zip.file(`${base}.svg`, svg);

      // 2. Vector EPS
      const eps = getEpsString();
      zip.file(`${base}.eps`, eps);

      // 3. Vector PDF
      const pdfBytes = await getVectorPdfBytes();
      zip.file(`${base}.pdf`, pdfBytes);

      // 4. High-Res PNG (2048px)
      const pngBlob = await getHighResPngBlob(2048);
      zip.file(`${base}_2048px.png`, pngBlob);

      // 5. CorelDRAW & Illustrator README guide
      const readme = `MediaDocks QR Code Vector Suite
=================================
Generated: ${new Date().toLocaleString()}
Data Type: ${contentType}

Files Included in this Package:
1. ${base}.svg - Scalable Vector Graphics (SVG)
   Universal vector format. Directly imports into CorelDRAW, Adobe Illustrator, Figma, and Web.

2. ${base}.eps - Encapsulated PostScript (EPS)
   Standard vector prepress format for CorelDRAW (.cdr) vinyl/plotter cutting and screen printing.

3. ${base}.pdf - Vector Print Document (PDF)
   Print-ready vector document for commercial printers and Adobe Acrobat.

4. ${base}_2048px.png - Ultra HD 2048px PNG
   High-definition raster image for digital layouts, websites, and emails.

HOW TO OPEN & EDIT IN CORELDRAW (.cdr):
- Method 1: Drag & drop the .svg or .eps file directly into your CorelDRAW document.
- Method 2: In CorelDRAW, go to File -> Import (Ctrl + I), select the .svg or .eps file, and click on your workspace.
- The QR code will be placed as 100% scalable vector curves with zero pixelation!

HOW TO OPEN IN ADOBE ILLUSTRATOR (.ai):
- Go to File -> Open or File -> Place (Ctrl + Shift + P) and choose the .svg or .eps file.
`;
      zip.file("README_CorelDRAW_Illustrator_Guide.txt", readme);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `${base}_vector_suite.zip`);
      toast.success("Complete Vector Suite downloaded!", {
        description: "Includes SVG, EPS, PDF, PNG + CorelDRAW import guide.",
      });
    } catch {
      toast.error("Failed to build Vector ZIP Suite");
    } finally {
      setIsExporting(false);
    }
  };

  const handleActiveDownload = () => {
    switch (selectedFormat) {
      case "svg":
        return void downloadSvg();
      case "eps":
        return void downloadEps();
      case "pdf":
        return void downloadPdf();
      case "png":
        return void downloadPng();
      case "zip":
        return void downloadZipSuite();
      default:
        return void downloadSvg();
    }
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast.success("QR code copied to clipboard!");
      });
    } catch {
      toast.error("Clipboard copy not supported in this browser");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-2xl border border-border/80 bg-surface p-5 sm:p-7 shadow-sm">
        {/* Left column: Content Configuration, Logo & Styling */}
        <div className="lg:col-span-7 space-y-6">
          {/* Content Type Tabs */}
          <div>
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Select Data Type
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { type: "url", label: "Website URL", icon: LinkIcon },
                { type: "text", label: "Plain Text", icon: Type },
                { type: "wifi", label: "Wi-Fi Access", icon: Wifi },
                { type: "email", label: "Email", icon: Mail },
                { type: "phone", label: "Phone Call", icon: Phone },
                { type: "vcard", label: "vCard Contact", icon: Contact },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setContentType(t.type as ContentType)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      contentType === t.type
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                        : "border-border bg-surface-strong text-muted-foreground hover:text-foreground hover:bg-surface"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Input Form */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-surface-strong/70 p-4">
            {contentType === "url" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Destination URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {contentType === "text" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Plain Text Content
                </label>
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type anything here…"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {contentType === "wifi" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="Home_WiFi"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Security Type
                    </label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => setWifiEncryption(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold focus:border-primary focus:outline-none"
                    >
                      <option value="WPA">WPA / WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None (Open)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {contentType === "email" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="hello@example.com"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Quick Inquiry"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {contentType === "phone" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {contentType === "vcard" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Company / Org
                  </label>
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    placeholder="jane@acme.com"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Logo Upload Feature */}
          <div className="rounded-xl border border-border/60 bg-surface-strong/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" /> Center Logo Overlay
              </span>
              {logoUrl && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="text-[11px] text-destructive hover:underline"
                >
                  Remove logo
                </button>
              )}
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*,.svg"
              className="hidden"
              onChange={handleLogoUpload}
            />

            {!logoUrl ? (
              <Button
                variant="outline"
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-full h-9 rounded-lg text-xs font-medium shadow-none border-dashed border-border"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload Brand Logo (PNG, JPG, SVG)
              </Button>
            ) : (
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2.5">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-9 w-9 object-contain rounded-md border border-border bg-white p-1"
                  />
                  <div>
                    <span className="text-xs font-medium text-foreground block">Logo embedded</span>
                    <span className="text-[10px] text-emerald-500 font-medium">
                      Level H Error Correction Enabled
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Size:</span>
                  <input
                    type="range"
                    min="15"
                    max="30"
                    value={logoSizePct}
                    onChange={(e) => setLogoSizePct(Number(e.target.value))}
                    className="h-1.5 w-24 cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-mono tabular-nums">{logoSizePct}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Colors Customization */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-surface-strong/70 p-3">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                Foreground (Dots) Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-8 w-8 rounded-md border border-border cursor-pointer p-0.5 bg-surface"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs font-semibold"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-surface-strong/70 p-3">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-8 w-8 rounded-md border border-border cursor-pointer p-0.5 bg-surface"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Realtime Preview & Vector / Illustration Export Suite */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          {/* Real-Time Preview Area */}
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Live Preview
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-500 flex items-center gap-1">
                <Check className="h-3 w-3" /> Ready to Scan
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-border/80 bg-white shadow-sm flex items-center justify-center w-full max-w-[280px]">
              <canvas ref={canvasRef} className="max-w-[240px] max-h-[240px] w-full h-auto" />
            </div>

            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
              <span>Level {logoUrl ? "H (30% Redundant)" : `${errorCorrection} (Standard)`}</span>
              <span>•</span>
              <span className="text-primary font-semibold">100% Vector Scalable</span>
            </div>
          </div>

          {/* Export Suite Section */}
          <div className="w-full space-y-4 pt-4 border-t border-border/60">
            {/* Format Selection Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-foreground">
                  Choose Download Format
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Vector · Print · CorelDRAW
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 rounded-xl bg-surface-strong/80 border border-border/70">
                {[
                  { id: "svg", label: "SVG", sub: "Vector" },
                  { id: "eps", label: "EPS", sub: "Corel/AI" },
                  { id: "pdf", label: "PDF", sub: "Print" },
                  { id: "png", label: "PNG", sub: "Raster" },
                  { id: "zip", label: "Suite", sub: "ZIP" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id as ExportFormat)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all",
                      selectedFormat === fmt.id
                        ? "bg-primary text-primary-foreground font-bold shadow-xs scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface"
                    )}
                  >
                    <span className="text-xs font-bold uppercase">{fmt.label}</span>
                    <span
                      className={cn(
                        "text-[9px] uppercase tracking-wider",
                        selectedFormat === fmt.id
                          ? "text-primary-foreground/90 font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {fmt.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Explanations & Specific Controls */}
            <div className="rounded-xl border border-border/60 bg-surface-strong/60 p-3 text-xs">
              {selectedFormat === "svg" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <FileCode className="h-4 w-4" />
                    <span>SVG — Scalable Vector Graphics</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Infinitely scalable vector file. Opens and edits seamlessly in{" "}
                    <strong className="text-foreground">CorelDRAW (.cdr)</strong>, Adobe
                    Illustrator (.ai), Figma, Inkscape, and web browsers.
                  </p>
                </div>
              )}

              {selectedFormat === "eps" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <Compass className="h-4 w-4" />
                    <span>EPS — Prepress Vector (CorelDRAW / Illustrator)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Industry standard PostScript vector format. Built specifically for{" "}
                    <strong className="text-foreground">CorelDRAW (.cdr)</strong>, vinyl cutting,
                    CNC routers, plotter printing, and commercial signage.
                  </p>
                </div>
              )}

              {selectedFormat === "pdf" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <Printer className="h-4 w-4" />
                    <span>PDF — Print-Ready Vector Document</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Native vector PDF document created with vector curves. Ready for commercial print
                    shops, press documents, and Adobe Acrobat.
                  </p>
                </div>
              )}

              {selectedFormat === "png" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-primary font-semibold">
                      <ImageIcon className="h-4 w-4" />
                      <span>PNG — High-Resolution Raster Image</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Size:</span>
                    <select
                      value={size}
                      onChange={(e) => setSize(Number(e.target.value))}
                      className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold focus:border-primary focus:outline-none flex-1"
                    >
                      <option value={512}>512 × 512 px (Standard)</option>
                      <option value={1024}>1024 × 1024 px (HD)</option>
                      <option value={2048}>2048 × 2048 px (2K Ultra)</option>
                      <option value={4096}>4096 × 4096 px (4K Commercial Print)</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedFormat === "zip" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <FileArchive className="h-4 w-4" />
                    <span>All-in-One Vector Suite (.ZIP)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Packages <strong className="text-foreground">SVG + EPS + PDF + PNG</strong> into
                    a single archive, along with a CorelDRAW & Illustrator import guide.
                  </p>
                </div>
              )}
            </div>

            {/* Primary Download Button */}
            <div className="space-y-2">
              <Button
                onClick={handleActiveDownload}
                disabled={isExporting}
                className="w-full h-10 rounded-xl text-xs sm:text-sm font-semibold shadow-sm"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Generating Vector File…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {selectedFormat === "svg" && "Download Vector SVG (.svg)"}
                    {selectedFormat === "eps" && "Download Vector EPS for CorelDRAW (.eps)"}
                    {selectedFormat === "pdf" && "Download Vector PDF (.pdf)"}
                    {selectedFormat === "png" && `Download High-Res PNG (${size}×${size}px)`}
                    {selectedFormat === "zip" && "Download Complete Vector Suite (.zip)"}
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="flex-1 h-8 rounded-lg text-xs font-medium border-border/80 hover:bg-surface-strong"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy Image
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadZipSuite}
                  disabled={isExporting}
                  className="flex-1 h-8 rounded-lg text-xs font-medium border-border/80 hover:bg-surface-strong"
                  title="Download all formats in ZIP"
                >
                  <FileArchive className="h-3.5 w-3.5 mr-1.5" />
                  All Formats (ZIP)
                </Button>
              </div>
            </div>

            {/* CorelDRAW & Illustrator Integration Note */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground font-semibold">
                  CorelDRAW (.cdr) & Illustrator (.ai) Ready:
                </strong>{" "}
                To use in CorelDRAW, simply import the <strong>.svg</strong> or{" "}
                <strong>.eps</strong> file (Ctrl+I). It renders as 100% scalable vector curves
                ready for vinyl cutting, flex signage, and CNC engraving.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
