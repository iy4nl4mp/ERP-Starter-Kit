import fs from "fs";
import path from "path";

function rtfToHtml(rtf: string): string {
  // Normalize newlines
  let txt = rtf.replace(/\r\n/g, "\n");
  // Basic formatting: \par to line breaks
  txt = txt.replace(/\\par\s*/g, "<br/>");
  // Bold/italic markers
  txt = txt.replace(/\\b\b/g, "<strong>");
  txt = txt.replace(/\\b0\b/g, "</strong>");
  txt = txt.replace(/\\i\b/g, "<em>");
  txt = txt.replace(/\\i0\b/g, "</em>");
  // Underscore escaped
  txt = txt.replace(/\\_/g, "_");
  // Remove RTF groups braces
  txt = txt.replace(/[{}]/g, "");
  // Remove remaining simple control words (ansi, deff0, etc.)
  txt = txt.replace(/\\[a-z]+-?\d*\s*/gi, "");
  // Collapse multiple <br/> into single paragraph breaks
  txt = txt.replace(/(?:<br\/>[\s]*){2,}/g, "<br/><br/>");
  return txt;
}

export default async function DocPage() {
  const docPath = path.resolve(process.cwd(), "..", "docs", "system-documentation.doc");
  let rtf = "";
  try {
    rtf = await fs.promises.readFile(docPath, "utf8");
  } catch (err) {
    const msg = `Tidak dapat membaca file dokumentasi di ${docPath}. Pastikan file tersedia.`;
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold">Doc Starter Kit</h1>
        <p className="mt-2 text-sm text-red-600">{msg}</p>
      </div>
    );
  }

  const html = rtfToHtml(rtf);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Doc Starter Kit</h1>
      <article
        className="prose max-w-none mt-4 prose-h2:mt-6 prose-h3:mt-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}