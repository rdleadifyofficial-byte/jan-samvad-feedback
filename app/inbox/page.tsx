"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, ImageIcon, Inbox, MapPin, MessageSquareText, Phone, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Feedback = {
  id: number;
  name: string;
  mobile: string;
  ward: string;
  area: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  photoPath: string | null;
  photoUrl: string | null;
};

const HEADERS = [
  "क्रमांक", "नाम", "मोबाइल नंबर", "वार्ड", "मोहल्ला / स्थान", "विषय",
  "फीडबैक", "स्थिति", "दिनांक और समय", "Photo Available", "Photo URL", "View Photo",
];

function safeSpreadsheetText(value: unknown) {
  const text = String(value ?? "");
  return /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
}

function csvCell(value: unknown) {
  return `"${safeSpreadsheetText(value).replaceAll('"', '""')}"`;
}

function xml(value: unknown) {
  return safeSpreadsheetText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function feedbackRows(rows: Feedback[]) {
  return rows.map((item, index) => [
    index + 1,
    item.name,
    item.mobile,
    item.ward,
    item.area,
    item.category,
    item.message,
    item.status,
    new Date(item.createdAt).toLocaleString("hi-IN"),
    item.photoUrl ? "Yes" : "No",
    item.photoUrl ?? "",
    item.photoUrl ? "फोटो देखें" : "",
  ]);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function columnName(index: number) {
  let result = "";
  for (let value = index; value > 0; value = Math.floor((value - 1) / 26)) {
    result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
  }
  return result;
}

async function createExcel(rows: Feedback[]) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const data = [HEADERS, ...feedbackRows(rows)];
  const sheetRows = data.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const reference = `${columnName(columnIndex + 1)}${rowIndex + 1}`;
      return `<c r="${reference}" t="inlineStr" s="${rowIndex === 0 ? 1 : 0}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const links = rows.flatMap((item, index) => item.photoUrl
    ? [`<hyperlink ref="L${index + 2}" r:id="rId${index + 1}"/>`]
    : []).join("");
  const relationships = rows.flatMap((item, index) => item.photoUrl
    ? [`<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xml(item.photoUrl)}" TargetMode="External"/>`]
    : []).join("");

  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Feedback" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  zip.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF17352C"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`);
  zip.file("xl/worksheets/sheet1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><cols><col min="1" max="1" width="10" customWidth="1"/><col min="2" max="6" width="20" customWidth="1"/><col min="7" max="7" width="45" customWidth="1"/><col min="8" max="10" width="20" customWidth="1"/><col min="11" max="11" width="55" customWidth="1"/><col min="12" max="12" width="18" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData>${links ? `<hyperlinks>${links}</hyperlinks>` : ""}</worksheet>`);
  if (relationships) {
    zip.file("xl/worksheets/_rels/sheet1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`);
  }
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export default function InboxPage() {
  const [pin, setPin] = useState("");
  const [rows, setRows] = useState<Feedback[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; name: string } | null>(null);

  async function openInbox(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (response.ok) setRows(data.feedback);
      else setError(data.error || "Inbox नहीं खुल पाया।");
    } catch {
      setError("नेटवर्क में समस्या है। कृपया दोबारा प्रयास करें।");
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    if (!rows?.length) return;
    const csv = "\uFEFF" + [HEADERS, ...feedbackRows(rows)]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `jan-samvad-feedback-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  async function downloadExcel() {
    if (!rows?.length || exporting) return;
    setExporting(true);
    setError("");
    try {
      const workbook = await createExcel(rows);
      downloadBlob(workbook, `jan-samvad-feedback-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      setError("Excel रिपोर्ट तैयार नहीं हो पाई।");
    } finally {
      setExporting(false);
    }
  }

  if (rows === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#17352c] p-5">
        <form onSubmit={openInbox} className="w-full max-w-sm rounded-3xl bg-white p-8 text-[#17352c] shadow-xl">
          <Inbox className="size-8 text-[#df7b2f]" />
          <h1 className="mt-4 text-2xl font-semibold">Admin Inbox</h1>
          <p className="mt-2 text-sm text-[#587068]">फीडबैक देखने के लिए Admin PIN डालें।</p>
          <Input value={pin} onChange={(event) => setPin(event.target.value)} type="password" inputMode="numeric" required className="mt-6 h-12" placeholder="Admin PIN" />
          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
          <Button disabled={busy} className="mt-3 h-12 w-full rounded-full bg-[#17352c]">{busy ? "Inbox खुल रहा है..." : "Inbox खोलें"}</Button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef1ed] p-5 text-[#17352c] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#df7b2f]">जन संवाद प्रशासन</p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold"><Inbox className="size-8" /> Feedback Inbox</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadCsv} disabled={!rows.length} variant="outline" className="rounded-full bg-white">
              <Download className="mr-2 size-4" /> CSV डाउनलोड
            </Button>
            <Button onClick={downloadExcel} disabled={!rows.length || exporting} className="rounded-full bg-[#df7b2f] hover:bg-[#c96d27]">
              <FileSpreadsheet className="mr-2 size-4" /> {exporting ? "Excel बन रहा है..." : "Excel डाउनलोड"}
            </Button>
            <Link href="/qr" className="rounded-full bg-[#17352c] px-5 py-2.5 text-sm font-medium text-white">QR देखें</Link>
          </div>
        </header>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <Stat label="कुल फीडबैक" value={rows.length} />
          <Stat label="नए संदेश" value={rows.filter((item) => item.status === "new").length} />
          <Stat label="वार्ड" value={new Set(rows.map((item) => item.ward)).size} />
        </section>
        <div className="mt-7 space-y-4">
          {rows.length === 0 ? <Empty text="अभी कोई फीडबैक प्राप्त नहीं हुआ है।" /> : rows.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#17352c]/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{item.name}</h2>
                    <Badge className="bg-[#fff1d8] text-[#9b631c] hover:bg-[#fff1d8]">{item.category}</Badge>
                    <Badge variant="outline">{item.ward}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#587068]">
                    <span className="flex items-center gap-1"><Phone className="size-3" />{item.mobile}</span>
                    <span className="flex items-center gap-1"><MapPin className="size-3" />{item.area}</span>
                  </div>
                </div>
                <time className="text-xs text-[#7a8e86]">{new Date(item.createdAt).toLocaleString("hi-IN", { dateStyle: "medium", timeStyle: "short" })}</time>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <p className="flex gap-2 rounded-xl bg-[#f6f3ea] p-4 text-sm leading-6">
                  <MessageSquareText className="mt-0.5 size-4 shrink-0 text-[#df7b2f]" />{item.message}
                </p>
                {item.photoUrl ? (
                  <div className="flex min-w-40 items-center gap-3 rounded-xl border border-[#17352c]/10 p-2 sm:flex-col">
                    {/* Signed private URLs cannot be configured as a fixed Next Image host. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.photoUrl} alt={`${item.name} की समस्या`} className="h-20 w-24 rounded-lg object-cover sm:w-32" />
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPhoto({ url: item.photoUrl!, name: item.name })} className="whitespace-nowrap">
                      <ImageIcon className="mr-2 size-4" /> फोटो देखें
                    </Button>
                  </div>
                ) : (
                  <div className="flex min-w-40 items-center justify-center rounded-xl border border-dashed border-[#17352c]/15 px-4 py-3 text-xs text-[#7a8e86]">फोटो उपलब्ध नहीं</div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
      {selectedPhoto && (
        <div role="dialog" aria-modal="true" aria-label="फीडबैक फोटो" onClick={() => setSelectedPhoto(null)} className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4">
          <div onClick={(event) => event.stopPropagation()} className="relative max-h-[92vh] w-full max-w-4xl rounded-2xl bg-white p-3 shadow-2xl">
            <button type="button" aria-label="फोटो बंद करें" onClick={() => setSelectedPhoto(null)} className="absolute right-5 top-5 z-10 rounded-full bg-black/70 p-2 text-white">
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedPhoto.url} alt={`${selectedPhoto.name} की समस्या की पूरी फोटो`} className="max-h-[82vh] w-full rounded-xl object-contain" />
            <a href={selectedPhoto.url} target="_blank" rel="noreferrer" className="mt-2 block text-center text-sm font-medium text-[#17352c] underline">नई टैब में खोलें</a>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-[#17352c] p-5 text-white"><p className="text-sm text-white/65">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-[#17352c]/20 bg-white p-14 text-center text-[#587068]">{text}</div>;
}
