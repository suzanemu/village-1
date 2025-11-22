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
  const grandTotal = subTotal + vatAmount + taxAmount;
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
                // Full Header (Page 1)
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
                // Simple Header (Page 2+)
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
                <div className="flex-grow">
                  <table className="w-full border-collapse mb-2">
                    <thead>
                      <tr className="bg-village-blue text-white text-xs uppercase tracking-wider">
                        <th className="p-2 md:p-3 text-left rounded-tl-lg w-12">SL</th>
                        <th className="p-2 md:p-3 text-left">Description</th>
                        <th className="p-2 md:p-3 text-center w-16">Unit</th>
                        <th className="p-2 md:p-3 text-center w-20">Qty</th>
                        <th className="p-2 md:p-3 text-right w-24">Unit Price</th>
                        <th className="p-2 md:p-3 text-right rounded-tr-lg w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 text-xs md:text-sm">
                      {page.items.map((item, idx) => {
                        // Calculate global index
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
                <div className="mt-auto">
                  {/* Totals Table */}
                  <div className="mb-8 border-t-2 border-gray-100 pt-4">
                     <table className="w-full border-collapse text-sm">
                       <tbody>
                         {hasTax && (
                          <tr>
                            <td className="p-2 text-right font-bold uppercase text-gray-600 w-3/4">Sub Total</td>
                            <td className="p-2 text-right font-bold text-gray-800">{subTotal.toLocaleString()}</td>
                          </tr>
                         )}
                         {data.vatRate > 0 && (
                           <tr>
                             <td className="p-2 text-right text-xs md:text-sm text-gray-600 border-t border-gray-100">VAT ({data.vatRate}%)</td>
                             <td className="p-2 text-right text-xs md:text-sm text-gray-600 border-t border-gray-100">
                               {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             </td>
                           </tr>
                         )}
                         {data.taxRate > 0 && (
                           <tr>
                             <td className="p-2 text-right text-xs md:text-sm text-gray-600 border-t border-gray-100">Tax ({data.taxRate}%)</td>
                             <td className="p-2 text-right text-xs md:text-sm text-gray-600 border-t border-gray-100">
                               {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             </td>
                           </tr>
                         )}
                         <tr className={hasTax ? 'bg-village-blue/5' : ''}>
                           <td className="p-3 text-right font-bold uppercase text-village-blue border-t-2 border-village-blue">
                             {hasTax ? 'Grand Total' : 'Total Amount'}
                           </td>
                           <td className="p-3 text-right font-bold text-lg text-village-green border-t-2 border-village-blue">
                             {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                           </td>
                         </tr>
                       </tbody>
                     </table>
                  </div>

                  {/* Notes + Signature Block - Move Together */}
                  <div style={{ marginTop: `${data.signatureSpacing}px` }}>
                    {/* Notes */}
                    {data.notes && (
                      <div className="mb-8">
                        <h4 className="font-bold text-gray-800 mb-2 text-xs uppercase border-b border-gray-300 inline-block pb-1">Note / Terms & Conditions:</h4>
                        <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed mt-1">
                          {data.notes}
                        </div>
                      </div>
                    )}

                    {/* Signature Block */}
                    <div className="pb-4">
                      <p className="text-sm font-bold text-gray-800 mb-2">Thank You</p>
                      
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
                        <div className="w-48 border-t-2 border-gray-900 mb-2"></div>
                        <p className="text-base font-bold text-gray-900">Shakhawat Hossain</p>
                        <p className="text-xs text-gray-500 font-semibold tracking-wide">Village Builders</p>
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