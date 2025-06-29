import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;

const EsicExtractor: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setResults([]);
    setMessage(null);
    setLoading(true);

    const allData: any[] = [];
    for (const file of Array.from(files)) {
      try {
        const text = await extractTextFromPdf(file);
        const data = parseChallanData(text, file.name);
        if (data) allData.push(data);
        else showMessage(`Could not extract data from ${file.name}`, "warning");
      } catch (err) {
        console.error(err);
        showMessage(`Failed to process ${file.name}`, "error");
      }
    }

    setResults(allData);
    setLoading(false);
    if (allData.length === 0)
      showMessage("No data could be extracted from the files.", "error");
  };

  const extractTextFromPdf = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(" ");
    }
    return fullText;
  };

  const parseChallanData = (text: string, filename: string) => {
    const find = (regex: RegExp) => {
      const match = text.match(regex);
      return match?.[1]?.trim() || "N/A";
    };

    let challanPeriod = find(/Challan Period:\s*([A-Za-z]{3}-\d{4})/i);
    const amountPaid = find(/Amount Paid:\s*([\d,]+\.?\d*)/i);
    const challanNumber = find(/Challan Number[^\d]*(\d{14})/i);
    const submittedDateStr = find(
      /Challan Submitted Date\s*(\d{2}-\d{2}-\d{4})/i
    );

    if (challanPeriod !== "N/A")
      challanPeriod =
        challanPeriod.charAt(0).toUpperCase() +
        challanPeriod.slice(1).toLowerCase();

    if (
      [challanPeriod, amountPaid, challanNumber, submittedDateStr].includes(
        "N/A"
      )
    )
      return null;

    const dueDate = calculateDueDate(challanPeriod);
    const delay = calculateDelay(submittedDateStr, dueDate);

    return {
      filename,
      challanPeriod,
      amountPaid: amountPaid.replace(/,/g, ""),
      challanNumber,
      dueDate: formatDate(dueDate),
      challanSubmittedDate: submittedDateStr,
      delay,
    };
  };

  const calculateDueDate = (period: string) => {
    const [monthStr, year] = period.split("-");
    const map: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = map[monthStr];
    return month === 2
      ? new Date(+year, 3, 30)
      : new Date(+year, month + 1, 15);
  };

  const calculateDelay = (submittedStr: string, due: Date) => {
    const [d, m, y] = submittedStr.split("-").map(Number);
    const submitted = new Date(y, m - 1, d);
    submitted.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = submitted.getTime() - due.getTime();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : "-";
  };

  const formatDate = (date: Date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
  };

  const copyTableToClipboard = () => {
    const table = results
      .map((r) =>
        [
          r.filename,
          r.challanPeriod,
          r.amountPaid,
          r.challanNumber,
          r.dueDate,
          r.challanSubmittedDate,
          r.delay,
        ].join("\t")
      )
      .join("\n");
    navigator.clipboard.writeText(table);
    showMessage("Table copied to clipboard!", "success");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-4">ESIC Challan Extractor</h1>
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFiles}
          className="mb-4 block w-full"
        />

        {loading && <p className="text-gray-600 mb-4">Processing...</p>}

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-center text-sm font-semibold ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : message.type === "warning"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {results.length > 0 && (
          <>
            <button
              onClick={copyTableToClipboard}
              className="mb-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              Copy Table
            </button>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Filename</th>
                    <th className="px-4 py-2 text-left">Challan Period</th>
                    <th className="px-4 py-2 text-left">Amount Paid</th>
                    <th className="px-4 py-2 text-left">Challan Number</th>
                    <th className="px-4 py-2 text-left">Due Date</th>
                    <th className="px-4 py-2 text-left">Challan Submitted</th>
                    <th className="px-4 py-2 text-left">Delay (Days)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, i) => (
                    <tr
                      key={i}
                      className="border-t hover:bg-gray-100 text-gray-800"
                    >
                      <td className="px-4 py-2">{item.filename}</td>
                      <td className="px-4 py-2">{item.challanPeriod}</td>
                      <td className="px-4 py-2">{item.amountPaid}</td>
                      <td className="px-4 py-2">{item.challanNumber}</td>
                      <td className="px-4 py-2">{item.dueDate}</td>
                      <td className="px-4 py-2">{item.challanSubmittedDate}</td>
                      <td
                        className={`px-4 py-2 ${
                          item.delay !== "-" ? "text-red-600 font-bold" : ""
                        }`}
                      >
                        {item.delay}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EsicExtractor;
