import React, { forwardRef } from 'react';
import { QuotationData, QuotationItem } from '../types';
import { VillageLogo } from './Logo';

interface QuotationPreviewProps {
  data: QuotationData;
}

// Configuration for pagination
// Adjusted to ensure ample space for the signature block and prevent overlap
const ITEMS_PER_FIRST_PAGE = 8;
const ITEMS_PER_PAGE = 12;

// Helper function to convert number to words
const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  const convertHundreds = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += teens[n - 10] + ' ';
    } else if (n >= 20 || n > 0) {
      str += tens[Math.floor(n / 10)] + ' ';
      str += ones[n % 10] + ' ';
    }
    return str.trim();
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = '';
  let groupIndex = 0;
  let tempNum = integerPart;

  while (tempNum > 0) {
    const group = tempNum % 1000;
    if (group !== 0) {
      const groupWords = convertHundreds(group);
      result = groupWords + (thousands[groupIndex] ? ' ' + thousands[groupIndex] : '') + ' ' + result;
    }
    tempNum = Math.floor(tempNum / 1000);
    groupIndex++;
  }

  result = result.trim() + ' Dollars';

  if (decimalPart > 0) {
    result += ' and ' + convertHundreds(decimalPart) + ' Cents';
  }

  return result.trim();
};

export const QuotationPreview = forwardRef<HTMLDivElement, QuotationPreviewProps>(({ data }, ref) => {
  
  // Helper to calculate totals
  const calculateTotal = (items: typeof data.items) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
  };

  // Split items into pages
  const pages = [];
  const items = [...data.items];
  
  // First Page Chunk
  const firstPageItems = items.splice(0, ITEMS_PER_FIRST_PAGE);
  pages.push({ type: 'first', items: firstPageItems });

  // Subsequent Page Chunks
  while (items.length > 0) {
    const chunk = items.splice(0, ITEMS_PER_PAGE);
    pages.push({ type: 'standard', items: chunk });
  }

  // Totals Calculation
  const subTotal = calculateTotal(data.items);
  const vatAmount = subTotal * ((data.vatRate || 0) / 100);
  const taxAmount = subTotal * ((data.taxRate || 0) / 100);
  const grandTotal = Math.round(subTotal + vatAmount + taxAmount);
  const grandTotalInWords = numberToWords(grandTotal);
  const hasTax = (data.vatRate || 0) > 0 || (data.taxRate || 0) > 0;

  // Check if footer fits on the last page or needs a new one
  const lastPage = pages[pages.length - 1];
  
  // Dynamic thresholds based on signature spacing control (0-12)
  // Higher value = more aggressive (allow more items, pull footer to page 1)
  // Lower value = more conservative (fewer items, push footer to page 2)
  const thresholdFirstPage = 3 + data.signatureSpacing; 
  const thresholdStandardPage = 6 + data.signatureSpacing; 
  
  const isLastPageFull = lastPage.items.length > (lastPage.type === 'first' ? thresholdFirstPage : thresholdStandardPage);
  
  if (isLastPageFull) {
    pages.push({ type: 'footer-only', items: [] });
  }

  return (
    <div ref={ref} className="flex flex-col items-center gap-8 p-4 md:p-8 bg-gray-100">
      {pages.map((page, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        const showFooter = isLastPage; // Footer only on the absolute last page

        return (
          <div 
            key={pageIndex}
            className="quotation-page bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] px-[15mm] md:px-[20mm] pt-[8mm] md:pt-[10mm] pb-[15mm] md:pb-[20mm] text-sm relative flex flex-col shrink-0"
            style={{ width: '210mm', height: '297mm' }}
          >
             {/* Watermark Layer - On Every Page */}
            <div className="absolute bottom-0 right-0 p-12 opacity-[0.08] pointer-events-none z-0 flex items-end justify-end w-full h-full overflow-hidden">
                 <VillageLogo 
                    src={data.logoImage} 
                    width={500} 
                    className="transform translate-x-10 translate-y-10"
                 />
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 flex flex-col h-full pb-4">
              
              {/* --- Header Section --- */}
              {pageIndex === 0 ? (
                <header className="flex justify-between items-start mb-4 border-b border-village-green pb-2">
                  <VillageLogo 
                    className="scale-75 origin-top-left -mt-4 -ml-4" 
                    src={data.logoImage} 
                    width={data.logoWidth}
                  />
                  <div className="text-right text-gray-600">
                    <h2 className="text-xl font-script text-village-green font-bold mb-1">Village Builders</h2>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-village-blue mb-2">General Constructor & Supplier</p>
                    <div className="text-xs leading-snug">
                      <p>3 Avoy Das Lane, Diganta 1</p>
                      <p>A-2 (1st Floor) Tikatuli, Dhaka</p>
                      <p>Cell: +8801843800166, +8801754569378</p>
                      <p>Email: shakhawat.village@gmail.com</p>
                    </div>
                  </div>
                </header>
              ) : (
                <header className="flex justify-between items-center mb-8 border-b border-gray-200 pb-2 opacity-60">
                   <div className="flex items-center gap-2">
                      {data.logoImage ? (
                        <img src={data.logoImage} alt="Logo" className="h-8 w-auto" />
                      ) : (
                        <span className="font-bold text-village-green">Village Builders</span>
                      )}
                      <span className="text-xs uppercase text-gray-400">| Continuation Sheet</span>
                   </div>
                   <span className="text-xs text-gray-400">Page {pageIndex + 1}</span>
                </header>
              )}

              {/* --- Meta Info (Only Page 1) --- */}
              {pageIndex === 0 && (
                <>
                  <div className="flex justify-between items-end mb-8 min-h-[80px]">
                    <div>
                      {!data.hideClientDetails && (
                        <>
                          <p className="text-gray-500 mb-1 text-xs">To,</p>
                          <p className="font-bold text-gray-800">{data.toName}</p>
                          <p className="text-gray-800">{data.toCompany}</p>
                          <p className="text-gray-600 max-w-xs text-xs mt-1">{data.toAddress}</p>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">Date: <span className="font-normal">{data.date}</span></p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="font-bold text-gray-800 border-b border-gray-300 inline-block pb-1">
                      Subject: <span className="uppercase">{data.subject}</span>
                    </p>
                  </div>
                </>
              )}

              {/* --- Items Table --- */}
              {page.items.length > 0 && (
                <div>
                  <table className="w-full border-collapse mb-2">
                    <thead>
                      <tr className="bg-village-blue text-white text-xs uppercase tracking-wider">
                        <th className="p-1.5 md:p-2 text-left rounded-tl-lg w-12">SL</th>
                        <th className="p-1.5 md:p-2 text-left">Description</th>
                        <th className="p-1.5 md:p-2 text-center w-16">Unit</th>
                        <th className="p-1.5 md:p-2 text-center w-20">Qty</th>
                        <th className="p-1.5 md:p-2 text-right w-24">Unit Price</th>
                        <th className="p-1.5 md:p-2 text-right rounded-tr-lg w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 text-xs md:text-sm">
                      {page.items.map((item, idx) => {
                        const globalIndex = (pageIndex === 0 ? 0 : ITEMS_PER_FIRST_PAGE + (pageIndex - 1) * ITEMS_PER_PAGE) + idx + 1;
                        
                        return (
                          <tr key={item.id || idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors odd:bg-gray-50/50">
                            <td className="p-2 md:p-3 text-center font-medium text-gray-400">{globalIndex}</td>
                            <td className="p-2 md:p-3 font-medium">{item.description}</td>
                            <td className="p-2 md:p-3 text-center">{item.unit}</td>
                            <td className="p-2 md:p-3 text-center">{item.quantity}</td>
                            <td className="p-2 md:p-3 text-right">{item.unitCost.toLocaleString()}</td>
                            <td className="p-2 md:p-3 text-right font-bold text-gray-900">{(item.quantity * item.unitCost).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* --- Footer (Totals + Notes + Signatures) - Only on Last Page --- */}
              {showFooter && (
                <div className="mt-4">

                  {/* Notes and Totals - Side by Side */}
                  <div className="flex gap-6 mb-8 border-t-2 border-gray-100 pt-6">
                    {/* Notes Section - Left Side */}
                    {data.notes && (
                      <div className="flex-1 bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-1 w-8 bg-gradient-to-r from-village-blue to-village-green rounded-full"></div>
                          <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Terms & Conditions</h4>
                        </div>
                        <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {data.notes}
                        </div>
                      </div>
                    )}

                    {/* Totals Section - Right Side */}
                    <div className="flex-1">
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full border-collapse text-sm">
                          <tbody>
                            <tr className="border-b border-gray-100">
                              <td className="p-3 text-right font-medium text-gray-600">Sub-total</td>
                              <td className="p-3 text-right font-bold text-gray-800 text-base">${subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            {data.vatRate > 0 && (
                              <tr className="border-b border-gray-100">
                                <td className="p-3 text-right font-medium text-gray-600">Tax ({data.vatRate}%)</td>
                                <td className="p-3 text-right font-bold text-gray-800 text-base">
                                  ${vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            )}
                            {data.taxRate > 0 && (
                              <tr className="border-b border-gray-100">
                                <td className="p-3 text-right font-medium text-gray-600">Tax ({data.taxRate}%)</td>
                                <td className="p-3 text-right font-bold text-gray-800 text-base">
                                  ${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        
                        {/* Grand Total Card */}
                        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-white text-base uppercase tracking-wider">Grand Total</span>
                            <span className="font-bold text-white text-3xl">
                              ${grandTotal.toLocaleString()}
                            </span>
                          </div>
                          {/* Grand Total in Words */}
                          <div className="text-xs text-green-50 italic border-t border-green-400/30 pt-2 mt-2">
                            <span className="font-semibold">In word:</span> {grandTotalInWords} taka only
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signature Block with Modern Design */}
                  <div style={{ marginTop: `${data.signatureSpacing}px` }}>
                    <div className="pb-4" style={{ transform: `scale(${data.signatureBlockSize / 100})`, transformOrigin: 'left top' }}>
                      <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-village-blue to-village-green mb-4" style={{ fontSize: `${data.thankYouSize}px` }}>
                          Thank You
                        </p>
                        
                        {/* E-Signature Image */}
                        {data.signatureImage && (
                          <div className="mb-4">
                            <img 
                              src={data.signatureImage} 
                              alt="Signature" 
                              className="h-16 w-auto object-contain"
                            />
                          </div>
                        )}
                        
                        <div className="inline-block text-left">
                          <div className="w-56 h-0.5 bg-gradient-to-r from-village-blue to-transparent mb-3"></div>
                          <p className="text-base font-bold text-gray-900">Shakhawat Hossain</p>
                          <p className="text-xs text-gray-600 font-semibold tracking-wide uppercase">Authorized Signature</p>
                          <p className="text-xs text-village-blue font-medium mt-1">Village Builders</p>
                        </div>
                      </div>
                      
                      {/* Bottom Brand Strip */}
                      <div className="mt-6 pt-4 border-t-2 border-gray-200 flex justify-between items-center text-xs text-gray-500">
                        <p className="flex items-center gap-2">
                          <span className="inline-block h-5 w-5 bg-gradient-to-br from-village-blue to-village-green rounded-full flex items-center justify-center text-white text-[10px] font-bold">V</span>
                          <span className="font-semibold">Village Builders</span>
                        </p>
                        <p className="text-gray-400">General Constructor & Supplier</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

QuotationPreview.displayName = "QuotationPreview";