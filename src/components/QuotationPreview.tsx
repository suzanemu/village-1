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
  
  // Adjusted thresholds: 5 items for first page, 8 items for subsequent pages
  // This prevents footer overlap with the decorative bottom bar
  const thresholdFirstPage = 5; 
  const thresholdStandardPage = 8; 
  
  const isLastPageFull = lastPage.items.length > (lastPage.type === 'first' ? thresholdFirstPage : thresholdStandardPage);
  
  if (isLastPageFull) {
    pages.push({ type: 'footer-only', items: [] });
  }

  return (
    <div ref={ref} className="flex flex-col items-center gap-4 md:gap-8 w-full bg-gray-100">
      {pages.map((page, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        const showFooter = isLastPage; // Footer only on the absolute last page

        return (
          <div 
            key={pageIndex}
            className="quotation-page bg-white shadow-2xl w-full aspect-[1/1.414] p-4 sm:p-6 md:p-8 text-xs sm:text-sm relative flex flex-col shrink-0"
            style={{ 
              maxWidth: '210mm',
              minHeight: 'auto'
            }}
          >
             {/* Watermark Layer - On Every Page */}
            <div className="absolute bottom-0 right-0 p-6 md:p-12 opacity-[0.08] pointer-events-none z-0 flex items-end justify-end w-full h-full overflow-hidden">
                 <VillageLogo 
                    src={data.logoImage} 
                    width={500} 
                    className="transform translate-x-10 translate-y-10"
                 />
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 flex flex-col h-full pb-2 md:pb-4">
              
              {/* --- Header Section --- */}
              {pageIndex === 0 ? (
                // Full Header (Page 1)
                <header className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 md:mb-6 border-b-2 border-village-green pb-3 md:pb-4">
                  <VillageLogo 
                    className="scale-50 sm:scale-75 origin-top-left -mt-2 sm:-mt-4 -ml-2 sm:-ml-4" 
                    src={data.logoImage} 
                    width={data.logoWidth}
                  />
                  <div className="text-left sm:text-right text-gray-600 w-full sm:w-auto">
                    <h2 className="text-lg sm:text-xl font-script text-village-green font-bold mb-1">Village Builders</h2>
                    <p className="text-[8px] sm:text-[10px] uppercase tracking-widest font-bold text-village-blue mb-2">General Constructor & Supplier</p>
                    <div className="text-[10px] sm:text-xs leading-snug">
                      <p>3 Avoy Das Lane, Diganta 1</p>
                      <p>A-2 (1st Floor) Tikatuli, Dhaka</p>
                      <p>Cell: +8801843800166, +8801754569378</p>
                      <p>Email: shakhawat.village@gmail.com</p>
                    </div>
                  </div>
                </header>
              ) : (
                // Simple Header (Page 2+)
                <header className="flex justify-between items-center mb-4 md:mb-8 border-b border-gray-200 pb-2 opacity-60">
                   <div className="flex items-center gap-2">
                      {data.logoImage ? (
                        <img src={data.logoImage} alt="Logo" className="h-6 sm:h-8 w-auto" />
                      ) : (
                        <span className="font-bold text-village-green text-xs sm:text-sm">Village Builders</span>
                      )}
                      <span className="text-[10px] sm:text-xs uppercase text-gray-400">| Continuation Sheet</span>
                   </div>
                   <span className="text-[10px] sm:text-xs text-gray-400">Page {pageIndex + 1}</span>
                </header>
              )}

              {/* --- Meta Info (Only Page 1) --- */}
              {pageIndex === 0 && (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 md:mb-8 min-h-[60px] sm:min-h-[80px]">
                    <div className="w-full sm:w-auto">
                      {!data.hideClientDetails && (
                        <>
                          <p className="text-gray-500 mb-1 text-[10px] sm:text-xs">To,</p>
                          <p className="font-bold text-gray-800 text-xs sm:text-sm">{data.toName}</p>
                          <p className="text-gray-800 text-xs sm:text-sm">{data.toCompany}</p>
                          <p className="text-gray-600 max-w-xs text-[10px] sm:text-xs mt-1">{data.toAddress}</p>
                        </>
                      )}
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <p className="font-bold text-gray-800 text-xs sm:text-sm">Date: <span className="font-normal">{data.date}</span></p>
                    </div>
                  </div>
                  <div className="mb-4 md:mb-6">
                    <p className="font-bold text-gray-800 border-b border-gray-300 inline-block pb-1 text-xs sm:text-sm">
                      Subject: <span className="uppercase">{data.subject}</span>
                    </p>
                  </div>
                </>
              )}

              {/* --- Items Table --- */}
              {page.items.length > 0 && (
                <div className="flex-grow overflow-x-auto -mx-2 px-2">
                  <table className="w-full border-collapse mb-4 md:mb-8 min-w-[500px]">
                    <thead>
                      <tr className="bg-village-blue text-white text-[10px] sm:text-xs uppercase tracking-wider">
                        <th className="p-1.5 sm:p-2 md:p-3 text-left rounded-tl-lg w-8 sm:w-12">SL</th>
                        <th className="p-1.5 sm:p-2 md:p-3 text-left">Description</th>
                        <th className="p-1.5 sm:p-2 md:p-3 text-center w-12 sm:w-16">Unit</th>
                        <th className="p-1.5 sm:p-2 md:p-3 text-center w-12 sm:w-20">Qty</th>
                        <th className="p-1.5 sm:p-2 md:p-3 text-right w-20 sm:w-24">Unit Price</th>
                        <th className="p-1.5 sm:p-2 md:p-3 text-right rounded-tr-lg w-20 sm:w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 text-[10px] sm:text-xs md:text-sm">
                      {page.items.map((item, idx) => {
                        // Calculate global index
                        const globalIndex = (pageIndex === 0 ? 0 : ITEMS_PER_FIRST_PAGE + (pageIndex - 1) * ITEMS_PER_PAGE) + idx + 1;
                        
                        return (
                          <tr key={item.id || idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors odd:bg-gray-50/50">
                            <td className="p-1.5 sm:p-2 md:p-3 text-center font-medium text-gray-400">{globalIndex}</td>
                            <td className="p-1.5 sm:p-2 md:p-3 font-medium break-words">{item.description}</td>
                            <td className="p-1.5 sm:p-2 md:p-3 text-center">{item.unit}</td>
                            <td className="p-1.5 sm:p-2 md:p-3 text-center">{item.quantity}</td>
                            <td className="p-1.5 sm:p-2 md:p-3 text-right">{item.unitCost.toLocaleString()}</td>
                            <td className="p-1.5 sm:p-2 md:p-3 text-right font-bold text-gray-900">{(item.quantity * item.unitCost).toLocaleString()}</td>
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
                  <div className="mb-4 md:mb-8 border-t-2 border-gray-100 pt-3 md:pt-4 overflow-x-auto -mx-2 px-2">
                     <table className="w-full border-collapse text-xs sm:text-sm min-w-[300px]">
                       <tbody>
                         {hasTax && (
                          <tr>
                            <td className="p-1.5 sm:p-2 text-right font-bold uppercase text-gray-600 w-3/4">Sub Total</td>
                            <td className="p-1.5 sm:p-2 text-right font-bold text-gray-800">{subTotal.toLocaleString()}</td>
                          </tr>
                         )}
                         {data.vatRate > 0 && (
                           <tr>
                             <td className="p-1.5 sm:p-2 text-right text-[10px] sm:text-xs md:text-sm text-gray-600 border-t border-gray-100">VAT ({data.vatRate}%)</td>
                             <td className="p-1.5 sm:p-2 text-right text-[10px] sm:text-xs md:text-sm text-gray-600 border-t border-gray-100">
                               {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             </td>
                           </tr>
                         )}
                         {data.taxRate > 0 && (
                           <tr>
                             <td className="p-1.5 sm:p-2 text-right text-[10px] sm:text-xs md:text-sm text-gray-600 border-t border-gray-100">Tax ({data.taxRate}%)</td>
                             <td className="p-1.5 sm:p-2 text-right text-[10px] sm:text-xs md:text-sm text-gray-600 border-t border-gray-100">
                               {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             </td>
                           </tr>
                         )}
                         <tr className={hasTax ? 'bg-village-blue/5' : ''}>
                           <td className="p-2 sm:p-3 text-right font-bold uppercase text-village-blue border-t-2 border-village-blue text-xs sm:text-sm">
                             {hasTax ? 'Grand Total' : 'Total Amount'}
                           </td>
                           <td className="p-2 sm:p-3 text-right font-bold text-base sm:text-lg text-village-green border-t-2 border-village-blue">
                             {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                           </td>
                         </tr>
                       </tbody>
                     </table>
                  </div>

                  {/* Notes */}
                  {data.notes && (
                    <div className="mb-4 md:mb-8">
                      <h4 className="font-bold text-gray-800 mb-2 text-[10px] sm:text-xs uppercase border-b border-gray-300 inline-block pb-1">Note / Terms & Conditions:</h4>
                      <div className="text-[10px] sm:text-xs text-gray-600 whitespace-pre-wrap leading-relaxed mt-1">
                        {data.notes}
                      </div>
                    </div>
                  )}

                  {/* Signature Block */}
                  <div className="pt-4 md:pt-8 pb-2 md:pb-4">
                    <p className="text-xs sm:text-sm font-bold text-gray-800 mb-12 md:mb-20">Thank You</p>
                    <div className="inline-block text-left">
                      <div className="w-32 sm:w-48 border-t-2 border-gray-900 mb-2"></div>
                      <p className="text-sm sm:text-base font-bold text-gray-900">Shakhawat Hossain</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 font-semibold tracking-wide">Village Builders</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Decorative Bottom Bar - On Every Page */}
              <div className="absolute bottom-0 left-0 w-full h-2 sm:h-3 bg-gradient-to-r from-village-blue to-village-green z-20"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

QuotationPreview.displayName = "QuotationPreview";