import React, { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set the correct workerSrc for browser use
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

interface ChallanData {
  challanNo: string;
  amount: string;
  natureOfPayment: string;
  depositDate: string;
  tax: string;
  surcharge: string;
  cess: string;
  interest: string;
  penalty: string;
  fee: string;
}

const TDSChallanExtractor: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ChallanData[]>([]);
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

    const results: ChallanData[] = [];
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
        const parsed = parseChallan(fullText);
        if (parsed) results.push(parsed);
      } catch (err) {
        setError(`Failed to process ${file.name}`);
      }
    }

    setData(results);
    setLoading(false);
  };

  const parseChallan = (text: string): ChallanData | null => {
    const extract = (regex: RegExp, fallback = "N/A") => {
      const match = text.match(regex);
      return match ? match[1].trim() : fallback;
    };

    const amount = extract(/Amount \(in Rs\.*\) ?: ?\u20B9?\s*([\d,]+)/);
    const challanNo = extract(/Challan No ?: ?(\d+)/);
    const natureOfPayment = extract(/Nature of Payment ?: ?([\w /]+)/);
    const depositDate = extract(
      /Date of Deposit ?: ?(\d{2}-[A-Za-z]{3}-\d{4})/
    );

    const tax = extract(/A Tax \u20B9\s*([\d,]+)/, "0");
    const surcharge = extract(/B Surcharge \u20B9\s*([\d,]+)/, "0");
    const cess = extract(/C Cess \u20B9\s*([\d,]+)/, "0");
    const interest = extract(/D Interest \u20B9\s*([\d,]+)/, "0");
    const penalty = extract(/E Penalty \u20B9\s*([\d,]+)/, "0");
    const fee = extract(/F Fee under section 234E \u20B9\s*([\d,]+)/, "0");

    return {
      challanNo,
      amount,
      natureOfPayment,
      depositDate,
      tax,
      surcharge,
      cess,
      interest,
      penalty,
      fee,
    };
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">TDS Challan Extractor</h1>

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
              <th className="border px-2 py-1">Challan No</th>
              <th className="border px-2 py-1">Nature of Payment</th>
              <th className="border px-2 py-1">Amount (₹)</th>
              <th className="border px-2 py-1">Deposit Date</th>
              <th className="border px-2 py-1">Tax</th>
              <th className="border px-2 py-1">Surcharge</th>
              <th className="border px-2 py-1">Cess</th>
              <th className="border px-2 py-1">Interest</th>
              <th className="border px-2 py-1">Penalty</th>
              <th className="border px-2 py-1">Fee u/s 234E</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border">
                <td className="border px-2 py-1">{row.challanNo}</td>
                <td className="border px-2 py-1">{row.natureOfPayment}</td>
                <td className="border px-2 py-1 text-right">{row.amount}</td>
                <td className="border px-2 py-1">{row.depositDate}</td>
                <td className="border px-2 py-1 text-right">{row.tax}</td>
                <td className="border px-2 py-1 text-right">{row.surcharge}</td>
                <td className="border px-2 py-1 text-right">{row.cess}</td>
                <td className="border px-2 py-1 text-right">{row.interest}</td>
                <td className="border px-2 py-1 text-right">{row.penalty}</td>
                <td className="border px-2 py-1 text-right">{row.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TDSChallanExtractor;
