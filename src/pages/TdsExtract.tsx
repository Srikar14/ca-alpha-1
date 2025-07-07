import React, { useState, useEffect, useRef, FC } from 'react';

// --- Type Definitions for the Component ---

// Defines the structure for data extracted from a challan PDF
interface ChallanData {
    natureOfPayment: string;
    month: string;
    amount: number;
    dueDate: string;
    remittanceDate: string;
    delay: number;
    challanNo: string;
    tax: number;
    surcharge: number;
    cess: number;
    interest: number;
    penalty: number;
    fee: number;
    sortableDate: Date;
}

// Defines the props for this component
interface TdsChallanExtractorProps {
    // A function to call when the user wants to go back.
    // This makes the component reusable in a larger application.
    onBack: () => void;
}

// Since pdf.js is loaded from a CDN, we need to tell TypeScript about the global `pdfjsLib` object
declare global {
    interface Window {
        pdfjsLib: any; 
    }
}

// --- SVG Icon Components ---
const UploadCloud: FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
);


// --- The Main TDS Challan Extractor Component ---

const TdsChallanExtractor: FC<TdsChallanExtractorProps> = ({ onBack }) => {
    // State management using React hooks with TypeScript types
    const [files, setFiles] = useState<File[]>([]);
    const [processedData, setProcessedData] = useState<Record<string, ChallanData[]> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPdfJsLoaded, setIsPdfJsLoaded] = useState<boolean>(false);

    // Effect hook to load the pdf.js script from its CDN
    useEffect(() => {
        const scriptId = 'pdfjs-script';
        if (window.pdfjsLib) {
             window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;
             setIsPdfJsLoaded(true);
             return;
        }
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;
                setIsPdfJsLoaded(true);
            };
            document.head.appendChild(script);
        }
    }, []);

    // Function to display an error message for 5 seconds
    const showError = (message: string): void => {
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    // Core logic to extract data from the PDF's text content
    const extractChallanData = (text: string, fileName: string): ChallanData | null => {
        try {
            const cleanText = text.replace(/["'’]/g, '').replace(/\s+/g, ' ').trim();

            const extractValueAfterLabel = (label: string, context: string = cleanText): number => {
                const regex = new RegExp(label + '[^\\d]*(\\d[\\d,.]*)', 'i');
                const match = context.match(regex);
                if (match && match[1]) {
                    const num = parseFloat(match[1].replace(/,/g, ''));
                    return isNaN(num) ? 0 : num;
                }
                return 0;
            };

            const extractStringAfterLabel = (label: string, context: string = cleanText): string => {
                 const regex = new RegExp(label + '\\s*[:]?\\s*([A-Z0-9][A-Z0-9/-]*)', 'i');
                 const match = context.match(regex);
                 return match && match[1] ? match[1] : 'N/A';
            }
            
            const natureOfPayment = extractStringAfterLabel('Nature of Payment');
            if (natureOfPayment === 'N/A') return null; 
            
            let amount = extractValueAfterLabel('Amount \\(in Rs\\.\\)');
            const challanNo = extractStringAfterLabel('Challan No');
            
            let depositDateStr = 'N/A';
            const dateMatch = cleanText.match(/Date of Deposit\s*[:\s]*(\d{2}-[A-Za-z]{3}-\d{4})/i) || cleanText.match(/Tender Date\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i);
            if (dateMatch) {
                depositDateStr = dateMatch[1];
                if(depositDateStr.includes('/')) {
                    const parts = depositDateStr.split('/');
                    const getMonthAbbr = (monthNum: string): string => new Date(2000, parseInt(monthNum, 10) - 1).toLocaleString('en-US', { month: 'short' });
                    depositDateStr = `${parts[0]}-${getMonthAbbr(parts[1])}-${parts[2]}`;
                }
            }

            const taxBreakupIndex = cleanText.toUpperCase().indexOf('TAX BREAKUP DETAILS');
            const taxContext = taxBreakupIndex !== -1 ? cleanText.substring(taxBreakupIndex) : cleanText;
            
            const tax = extractValueAfterLabel('\\bTax\\b', taxContext);
            const surcharge = extractValueAfterLabel('\\bSurcharge\\b', taxContext);
            const cess = extractValueAfterLabel('\\bCess\\b', taxContext);
            const interest = extractValueAfterLabel('\\bInterest\\b', taxContext);
            const penalty = extractValueAfterLabel('\\bPenalty\\b', taxContext);
            const fee = extractValueAfterLabel('Fee under section 234E', taxContext);

            if (amount === 0) {
                const totalAmount = extractValueAfterLabel('Total \\(A\\+B\\+C\\+D\\+E\\+F\\)');
                amount = totalAmount > 0 ? totalAmount : tax;
            }
            
            const monthMatch = fileName.match(/(January|February|March|April|May|June|July|August|September|October|November|December)'?(\d{2})/i);
            let month = "N/A", year = "N/A", paymentMonthIndex = -1;

            if (monthMatch) {
                const monthName = monthMatch[1];
                year = `20${monthMatch[2]}`;
                month = `${monthName} ${year}`;
                paymentMonthIndex = new Date(Date.parse(monthName +" 1, 2012")).getMonth();
            } else if(depositDateStr !== 'N/A') {
                const depositDate = new Date(depositDateStr);
                depositDate.setMonth(depositDate.getMonth() - 1);
                month = depositDate.toLocaleString('default', { month: 'long' });
                year = String(depositDate.getFullYear());
                month = `${month} ${year}`;
                paymentMonthIndex = depositDate.getMonth();
            }

            if(depositDateStr === 'N/A') return null;

            const remittanceDate = new Date(depositDateStr);
            const sortableDate = (paymentMonthIndex !== -1 && year !== 'N/A') ? new Date(parseInt(year), paymentMonthIndex) : new Date(remittanceDate.getFullYear(), remittanceDate.getMonth() - 1);
            
            const dueDate = new Date(sortableDate);
            if(sortableDate.getMonth() === 2) dueDate.setMonth(3, 30);
            else dueDate.setMonth(sortableDate.getMonth() + 1, 7);

            const delay = Math.max(0, Math.ceil((remittanceDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

            return {
                natureOfPayment, month, amount, tax, surcharge, cess, interest, penalty, fee, challanNo, delay,
                dueDate: dueDate.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).replace(/ /g, '-'),
                remittanceDate: remittanceDate.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).replace(/ /g, '-'),
                sortableDate,
            };
        } catch(e) { console.error(`Error processing ${fileName}:`, e); return null; }
    };
    
    // Groups the flat list of challan data into a dictionary keyed by 'Nature of Payment'
    const groupDataByNatureOfPayment = (data: ChallanData[]): Record<string, ChallanData[]> => data.reduce((acc, item) => {
        const key = item.natureOfPayment;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, ChallanData[]>);

    // Handles the file input change event
    const handleFileChange = async (selectedFiles: FileList | null): Promise<void> => {
        if (!selectedFiles || selectedFiles.length === 0 || !isPdfJsLoaded) return;
        setFiles(Array.from(selectedFiles));
        setIsLoading(true);
        setProcessedData(null);

        const allChallanData: ChallanData[] = [];
        for (const file of selectedFiles) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const typedarray = new Uint8Array(arrayBuffer);
                const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map((item: any) => item.str).join(' ');
                }
                const data = extractChallanData(fullText, file.name);
                if (data) allChallanData.push(data);
                else showError(`Could not extract data from ${file.name}.`);
            } catch (err) {
                showError(`Error processing ${file.name}.`);
                console.error(err);
            }
        }
        
        if (allChallanData.length > 0) {
            setProcessedData(groupDataByNatureOfPayment(allChallanData));
        }
        setIsLoading(false);
    };
    
    // Exports all processed data to a single CSV file
    const exportToCSV = (): void => {
        if (!processedData) return;
        const headers = ["Month", "Amount (Rs)", "Due Date", "Date of Remittance", "Delay (Days)", "Challan No.", "Tax (Rs)", "Surcharge (Rs)", "Cess (Rs)", "Interest (Rs)", "Penalty (Rs)", "Fee u/s 234E (Rs)"];
        let csvContent = "data:text/csv;charset=utf-8,";

        for(const natureOfPayment in processedData) {
            csvContent += `TDS - ${natureOfPayment}\r\n`;
            csvContent += headers.join(",") + "\r\n";
            const items = processedData[natureOfPayment];
            items.sort((a, b) => a.sortableDate.getTime() - b.sortableDate.getTime());
            items.forEach(item => {
                const row = [item.month, item.amount.toFixed(2), item.dueDate, item.remittanceDate, item.delay, item.challanNo, item.tax.toFixed(2), item.surcharge.toFixed(2), item.cess.toFixed(2), item.interest.toFixed(2), item.penalty.toFixed(2), item.fee.toFixed(2)];
                csvContent += row.map(v => `"${v}"`).join(",") + "\r\n";
            });
            csvContent += "\r\n";
        }
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "tds_challan_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // The JSX that defines the UI for the component
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <button onClick={onBack} className="mb-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">&larr; Back to Dashboard</button>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900">TDS Challan Extractor</h1>
                <p className="mt-2 text-md text-gray-600">Upload your TDS challan PDFs to automatically extract and organize the data.</p>
                
                <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto mt-8">
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors">
                        <input type="file" ref={fileInputRef} multiple accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e.target.files)} disabled={isLoading}/>
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-sm text-gray-600"><span className="font-semibold text-blue-600">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">PDF files only { !isPdfJsLoaded && "(Library loading...)"}</p>
                    </div>
                    {files.length > 0 && <div className="mt-4 text-sm"><ul>{files.map((f,i) => <li key={i} className="text-gray-600 truncate">{f.name}</li>)}</ul></div>}
                </div>

                {isLoading && <div className="text-center my-8"><div className="animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-blue-600 h-12 w-12 mx-auto"></div><p className="mt-4 text-gray-600">Processing files...</p></div>}
                {error && <div className="fixed top-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50"><strong className="font-bold">Error! </strong><span className="block sm:inline">{error}</span></div>}

                {processedData && (
                    <div className="mt-10">
                        <div className="text-center mb-6"><button onClick={exportToCSV} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow">Export All to CSV</button></div>
                        {Object.keys(processedData).map(natureOfPayment => {
                            const items = processedData[natureOfPayment].sort((a,b) => a.sortableDate.getTime() - b.sortableDate.getTime());
                            return (
                                <div key={natureOfPayment} className="mb-12">
                                    <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2">TDS - {natureOfPayment}</h2>
                                    <div className="overflow-x-auto bg-white rounded-lg shadow"><table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50"><tr>{["Month", "Amount (₹)", "Due Date", "Date of Remittance", "Delay (Days)", "Challan No.", "Tax (₹)", "Surcharge (₹)", "Cess (₹)", "Interest (₹)", "Penalty (₹)", "Fee u/s 234E (₹)"].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                                        <tbody className="bg-white divide-y divide-gray-200">{items.map((item, idx) => (
                                            <tr key={idx}>{[item.month, item.amount.toFixed(2), item.dueDate, item.remittanceDate, item.delay, item.challanNo, item.tax.toFixed(2), item.surcharge.toFixed(2), item.cess.toFixed(2), item.interest.toFixed(2), item.penalty.toFixed(2), item.fee.toFixed(2)].map((d, i) => <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{String(d)}</td>)}</tr>
                                        ))}</tbody>
                                    </table></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// You would typically export this component to be used in another file like App.tsx
// export default TdsChallanExtractor;