import React, { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

interface PTData {
  fileName: string;
  tin: string;
  taxPeriod: string;
  amount: string;
  dueDate: string;
  paymentDate: string;
  delay: string;
}

const PTChallanExtractor: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<PTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setData([]);
    setError("");

    const results: PTData[] = [];
    for (const file of Array.from(files)) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(" ");
        }
        const parsed = parsePTChallan(fullText, file.name);
        if (parsed) results.push(parsed);
      } catch (err) {
        setError(`Failed to process ${file.name}`);
      }
    }

    setData(results);
    setLoading(false);
  };

  const parsePTChallan = (text: string, fileName: string): PTData | null => {
    const extract = (regex: RegExp, fallback = "N/A") => {
      const match = text.match(regex);
      return match ? match[1].trim() : fallback;
    };

    const tin = extract(/TIN[:\s]+(\d{11})/i);
    const taxPeriod = extract(/Tax Period[:\s]+([\w\s-]+?)(?= Amount|\n)/i);
    const amount = extract(/Total Payable[:\s]+([\d,]+\.?\d*)/i);
    const paymentDate = extract(
      /Date of Payment[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})/i
    ).replace(/\//g, "-");
    const dueDate = calculateDueDate(taxPeriod);
    const delay = calculateDelay(dueDate, paymentDate);

    return {
      fileName,
      tin,
      taxPeriod,
      amount: amount.replace(/,/g, ""),
      dueDate,
      paymentDate,
      delay,
    };
  };

  const calculateDelay = (dueDate: string, paymentDate: string): string => {
    const parseDate = (str: string): Date | null => {
      const parts = str.split("-");
      if (parts.length !== 3) return null;
      return new Date(+parts[2], +parts[1] - 1, +parts[0]);
    };

    const d1 = parseDate(dueDate);
    const d2 = parseDate(paymentDate);

    if (!d1 || !d2) return "-";
    const diff = d2.getTime() - d1.getTime();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)).toString() : "-";
  };

  const calculateDueDate = (period: string): string => {
    const match = period.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (!match) return "N/A";
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const dueDate =
      month === 3 ? new Date(year, 3, 30) : new Date(year, month, 10);
    return dueDate.toLocaleDateString("en-GB").split("/").join("-");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Professional Tax Challan Extractor
      </h1>

      <input
        type="file"
        multiple
        accept="application/pdf"
        onChange={handleFileUpload}
        ref={fileInputRef}
        className="mb-4"
      />

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {data.length > 0 && (
        <table className="w-full table-auto border mt-4 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">File Name</th>
              <th className="border px-2 py-1">TIN</th>
              <th className="border px-2 py-1">Tax Period</th>
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">Due Date</th>
              <th className="border px-2 py-1">Payment Date</th>
              <th className="border px-2 py-1">Delay (Days)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border">
                <td className="border px-2 py-1">{row.fileName}</td>
                <td className="border px-2 py-1">{row.tin}</td>
                <td className="border px-2 py-1">{row.taxPeriod}</td>
                <td className="border px-2 py-1 text-right">{row.amount}</td>
                <td className="border px-2 py-1">{row.dueDate}</td>
                <td className="border px-2 py-1">{row.paymentDate}</td>
                <td className="border px-2 py-1 text-center">{row.delay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PTChallanExtractor;
