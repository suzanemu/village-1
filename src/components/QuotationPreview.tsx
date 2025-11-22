import React, { forwardRef } from 'react';
import { QuotationData, QuotationItem } from '../types';
import { VillageLogo } from './Logo';

interface QuotationPreviewProps {
  data: QuotationData;
}

// Configuration for pagination
// Dynamic adjustment based on actual content space
const ITEMS_PER_FIRST_PAGE = 12; // Increased from 8 to allow more items on first page
const ITEMS_PER_PAGE = 15; // Increased for better space utilization

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

  // Calculate scale factor for header text based on logo width
  const defaultLogoWidth = 180; // Default logo width
  const headerTextScale = (data.logoWidth || defaultLogoWidth) / defaultLogoWidth;
  
  // Calculate dynamic spacing for header border based on logo size
  // Ultra minimal values to push the green line extremely close to logo and text
  const headerBottomMargin = 0.5 * headerTextScale; // Ultra minimal margin
  const headerBottomPadding = 0.5 * headerTextScale; // Ultra minimal padding

  // Content font scale (70-130%)
  const contentScale = (data.contentFontScale || 100) / 100;

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
  
  // Dynamic thresholds based on actual footer content and signature spacing
  // Consider if notes exist and their length to determine space needed
  const hasNotes = data.notes && data.notes.trim().length > 0;
  const notesLines = hasNotes ? Math.ceil(data.notes.length / 80) : 0; // Rough estimate of lines
  const hasSignatureImage = !!data.signatureImage;
  
  // Base capacity: how many items can fit with footer on each page type
  // More aggressive values to minimize wasted space
  const baseFirstPageCapacity = 10; // Can fit up to 10 items + footer on first page
  const baseStandardPageCapacity = 13; // Can fit up to 13 items + footer on continuation
  
  // Adjust based on content
  let firstPageCapacity = baseFirstPageCapacity - Math.floor(notesLines / 3);
  let standardPageCapacity = baseStandardPageCapacity - Math.floor(notesLines / 3);
  
  // Signature spacing slider adjustment (0-12, where higher = more aggressive/pull to current page)
  firstPageCapacity += Math.floor(data.signatureSpacing / 2);
  standardPageCapacity += Math.floor(data.signatureSpacing / 2);
  
  const isLastPageFull = lastPage.items.length > (lastPage.type === 'first' ? firstPageCapacity : standardPageCapacity);
  
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
            <div 
              className="absolute right-0 p-12 opacity-[0.08] pointer-events-none z-0 flex items-start justify-end w-full h-full overflow-hidden"
              style={{ 
                top: '0',
                transform: `translateY(${100 - data.watermarkVerticalPosition}%)`
              }}
            >
                 {data.watermarkImage ? (
                   <img 
                     src={data.watermarkImage} 
                     alt="Watermark" 
                     className="transform translate-x-10 object-contain"
                     style={{ width: `${data.watermarkWidth}px`, height: 'auto' }}
                   />
                 ) : (
                   <VillageLogo 
                      src={data.logoImage} 
                      width={500} 
                      className="transform translate-x-10"
                   />
                 )}
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 flex flex-col h-full pb-4">
              
              {/* --- Header Section --- */}
              {pageIndex === 0 ? (
                <header 
                  className="flex justify-between items-start border-b border-village-green"
                  style={{
                    marginBottom: `${headerBottomMargin}px`,
                    paddingBottom: `${headerBottomPadding}px`
                  }}
                >
                  <VillageLogo 
                    className="scale-75 origin-top-left -mt-4 -ml-4" 
                    src={data.logoImage} 
                    width={data.logoWidth}
                  />
                  <div 
                    className="text-right text-gray-600"
                    style={{ 
                      transform: `scale(${headerTextScale})`,
                      transformOrigin: 'top right'
                    }}
                  >
                    <h2 className="text-xl font-script text-village-green font-bold mb-1">Village Builders</h2>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-village-blue mb-2">General Constructor & Supplier</p>
                    <div className="text-xs leading-snug">
                      <p>3 Avoy Das Lane, Diganta 1</p>
                      <p>A-2 (1st Floor) Tikatuli, Dhaka</p>
                      <p>Cell: +8801754569378</p>
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

              {/* --- Content Area with Font Scaling --- */}
              <div 
                style={{ 
                  marginTop: pageIndex === 0 ? `${data.headerVerticalPosition}px` : '0px',
                  transform: `scale(${contentScale})`,
                  transformOrigin: 'top left',
                  width: `${100 / contentScale}%`
                }}
              >
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
                            <tr key={item.id || idx} className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors even:bg-gray-100/60 odd:bg-white">
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
                  <div className="mt-1">

                    {/* Notes and Totals - Side by Side with Signature Below Notes */}
                    <div className="flex gap-6 mb-4 border-t-2 border-gray-100 pt-2">
                      {/* Left Column - Notes + Signature */}
                      <div className="flex-1 flex flex-col">
                        {/* Notes Section - Only takes space needed */}
                        {data.notes && (
                          <div className="bg-transparent border border-gray-300/50 rounded-xl p-5 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide">Terms & Conditions</h4>
                            </div>
                            <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                              {data.notes}
                            </div>
                          </div>
                        )}

                        {/* Signature Block - Below Notes */}
                        <div className="mt-auto" style={{ paddingTop: data.notes ? '0px' : '0px' }}>
                          <div style={{ transform: `scale(${data.signatureBlockSize / 100})`, transformOrigin: 'left top' }}>
                            <div>
                              <p className="font-bold text-gray-800 mb-1" style={{ fontSize: `${data.thankYouSize}px` }}>
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
                                <p className="text-base font-bold text-gray-900">Shakhawat Hossain</p>
                                <p className="text-xs text-gray-600 font-semibold tracking-wide uppercase">Authorized Signature</p>
                                <p className="text-xs text-village-blue font-medium mt-1">Village Builders</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Totals Section (Always Present) */}
                      <div className="flex-1">
                        <div className="bg-white shadow-md border border-gray-300/50 rounded-xl overflow-hidden">
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
                          <div className="bg-gradient-to-r from-emerald-500 to-green-600 border-t-2 border-gray-300/50 p-5">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-white text-base uppercase tracking-wider">Grand Total</span>
                              <span className="font-bold text-white text-3xl">
                                ${grandTotal.toLocaleString()}
                              </span>
                            </div>
                            {/* Grand Total in Words */}
                            <div className="text-xs text-white/90 italic border-t border-white/30 pt-2 mt-2">
                              <span className="font-semibold">In word:</span> {grandTotalInWords} taka only
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Brand Strip - Appears on Every Page */}
            <div className="absolute bottom-0 left-[15mm] md:left-[20mm] right-[15mm] md:right-[20mm] z-20 pt-1 pb-2 border-t-2 border-gray-200 flex justify-between items-center text-xs text-gray-500">
              <p className="flex items-center gap-2">
                {data.logoImage ? (
                  <img 
                    src={data.logoImage} 
                    alt="Logo" 
                    className="h-5 w-auto object-contain"
                  />
                ) : (
                  <span className="inline-block h-5 w-5 bg-gradient-to-br from-village-blue to-village-green rounded-full flex items-center justify-center text-white text-[10px] font-bold">V</span>
                )}
                <span className="font-semibold">Village Builders</span>
              </p>
              <p className="text-gray-400">General Constructor & Supplier</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

QuotationPreview.displayName = "QuotationPreview";