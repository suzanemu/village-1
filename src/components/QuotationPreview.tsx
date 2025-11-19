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
    <div ref={ref} className="flex flex-col items-center gap-2 sm:gap-4 md:gap-8 w-full bg-gray-100 px-2 sm:px-4">
      {pages.map((page, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        const showFooter = isLastPage; // Footer only on the absolute last page

        return (
          <div 
            key={pageIndex}
            className="quotation-page bg-white shadow-lg sm:shadow-2xl w-full max-w-full sm:max-w-[210mm] p-2 sm:p-4 md:p-8 text-[8px] sm:text-xs relative flex flex-col shrink-0 min-h-0 sm:aspect-[1/1.414]"
          >
             {/* Watermark Layer - Hidden on mobile for better readability */}
            <div className="absolute bottom-0 right-0 p-4 sm:p-6 md:p-12 opacity-[0.08] pointer-events-none z-0 hidden sm:flex items-end justify-end w-full h-full overflow-hidden">
                 <VillageLogo 
                    src={data.logoImage} 
                    width={400} 
                    className="transform translate-x-8 sm:translate-x-10 translate-y-8 sm:translate-y-10 scale-75 sm:scale-100"
                 />
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 flex flex-col pb-4 sm:pb-2 md:pb-4 mb-1 sm:mb-0">
              
              {/* --- Header Section --- */}
              {pageIndex === 0 ? (
                // Full Header (Page 1)
                <header className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-4 mb-1 sm:mb-4 md:mb-6 border-b border-village-green pb-1 sm:pb-3 md:pb-4">
                  <VillageLogo 
                    className="scale-[0.2] sm:scale-50 md:scale-75 origin-top-left -mt-5 sm:-mt-2 md:-mt-4 -ml-5 sm:-ml-2 md:-ml-4" 
                    src={data.logoImage} 
                    width={data.logoWidth}
                  />
                  <div className="text-left sm:text-right text-gray-600 w-full sm:w-auto -mt-4 sm:mt-0">
                    <h2 className="text-[9px] sm:text-lg md:text-xl font-script text-village-green font-bold mb-0 leading-tight">Village Builders</h2>
                    <p className="text-[5px] sm:text-[8px] md:text-[10px] uppercase tracking-wide sm:tracking-wider font-bold text-village-blue mb-0.5 sm:mb-2 leading-tight">General Constructor & Supplier</p>
                    <div className="text-[6px] sm:text-[10px] md:text-xs leading-tight sm:leading-snug space-y-0">
                      <p className="mb-0">3 Avoy Das Lane, Diganta 1</p>
                      <p className="mb-0">A-2 (1st Floor) Tikatuli, Dhaka</p>
                      <p className="hidden sm:block mb-0">Cell: +8801843800166, +8801754569378</p>
                      <p className="sm:hidden mb-0">Cell: +8801843800166</p>
                      <p className="hidden sm:block mb-0">Email: shakhawat.village@gmail.com</p>
                    </div>
                  </div>
                </header>
              ) : (
                // Simple Header (Page 2+)
                <header className="flex justify-between items-center mb-1 sm:mb-4 md:mb-8 border-b border-gray-200 pb-1 sm:pb-2 opacity-60">
                   <div className="flex items-center gap-1 sm:gap-2">
                      {data.logoImage ? (
                        <img src={data.logoImage} alt="Logo" className="h-3 sm:h-6 md:h-8 w-auto" />
                      ) : (
                        <span className="font-bold text-village-green text-[7px] sm:text-xs md:text-sm">Village Builders</span>
                      )}
                      <span className="text-[6px] sm:text-[10px] md:text-xs uppercase text-gray-400">| Continuation</span>
                   </div>
                   <span className="text-[6px] sm:text-[10px] md:text-xs text-gray-400">Page {pageIndex + 1}</span>
                </header>
              )}

              {/* --- Meta Info (Only Page 1) --- */}
              {pageIndex === 0 && (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-0.5 sm:gap-4 mb-1 sm:mb-4 md:mb-8 min-h-[25px] sm:min-h-[60px] md:min-h-[80px]">
                    <div className="w-full sm:w-auto">
                      {!data.hideClientDetails && (
                        <>
                          <p className="text-gray-500 mb-0 text-[6px] sm:text-[10px] md:text-xs leading-tight">To,</p>
                          <p className="font-bold text-gray-800 text-[7px] sm:text-xs md:text-sm leading-tight mb-0">{data.toName}</p>
                          <p className="text-gray-800 text-[7px] sm:text-xs md:text-sm leading-tight mb-0">{data.toCompany}</p>
                          <p className="text-gray-600 max-w-xs text-[6px] sm:text-[10px] md:text-xs mt-0 leading-tight">{data.toAddress}</p>
                        </>
                      )}
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <p className="font-bold text-gray-800 text-[7px] sm:text-xs md:text-sm leading-tight">Date: <span className="font-normal">{data.date}</span></p>
                    </div>
                  </div>
                  <div className="mb-1 sm:mb-4 md:mb-6">
                    <p className="font-bold text-gray-800 border-b border-gray-300 inline-block pb-0.5 sm:pb-1 text-[7px] sm:text-xs md:text-sm leading-tight">
                      Subject: <span className="uppercase">{data.subject}</span>
                    </p>
                  </div>
                </>
              )}

              {/* --- Items Table --- */}
              {page.items.length > 0 && (
                <div className="flex-grow overflow-x-auto -mx-1 sm:-mx-2 px-1 sm:px-2 mb-1 sm:mb-4">
                  <table className="w-full border-collapse min-w-full">
                    <thead>
                      <tr className="bg-village-blue text-white text-[6px] sm:text-[10px] md:text-xs uppercase tracking-wider">
                        <th className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-left rounded-tl-lg w-4 sm:w-8 md:w-12">SL</th>
                        <th className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-left">Description</th>
                        <th className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-center w-8 sm:w-12 md:w-16">Unit</th>
                        <th className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-center w-6 sm:w-12 md:w-20">Qty</th>
                        <th className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-right w-10 sm:w-20 md:w-24">Price</th>
                        <th className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-right rounded-tr-lg w-12 sm:w-20 md:w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 text-[6px] sm:text-[10px] md:text-xs lg:text-sm">
                      {page.items.map((item, idx) => {
                        // Calculate global index
                        const globalIndex = (pageIndex === 0 ? 0 : ITEMS_PER_FIRST_PAGE + (pageIndex - 1) * ITEMS_PER_PAGE) + idx + 1;
                        
                        return (
                          <tr key={item.id || idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors odd:bg-gray-50/50">
                            <td className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-center font-medium text-gray-400">{globalIndex}</td>
                            <td className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 font-medium break-words leading-tight">{item.description}</td>
                            <td className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-center">{item.unit}</td>
                            <td className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-center">{item.quantity}</td>
                            <td className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-right whitespace-nowrap">{item.unitCost.toLocaleString()}</td>
                            <td className="p-0.5 sm:p-1.5 md:p-2 lg:p-3 text-right font-bold text-gray-900 whitespace-nowrap">{(item.quantity * item.unitCost).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* --- Footer (Totals + Notes + Signatures) - Only on Last Page --- */}
              {showFooter && (
                <div className="mt-1 sm:mt-auto">
                  {/* Totals Table */}
                  <div className="mb-1 sm:mb-4 md:mb-8 border-t border-gray-100 pt-1 sm:pt-3 md:pt-4 overflow-x-auto -mx-1 sm:-mx-2 px-1 sm:px-2">
                     <table className="w-full border-collapse text-[7px] sm:text-xs md:text-sm min-w-full">
                       <tbody>
                         {hasTax && (
                          <tr>
                            <td className="p-0.5 sm:p-1.5 md:p-2 text-right font-bold uppercase text-gray-600 w-3/4">Sub Total</td>
                            <td className="p-0.5 sm:p-1.5 md:p-2 text-right font-bold text-gray-800 whitespace-nowrap">{subTotal.toLocaleString()}</td>
                          </tr>
                         )}
                         {data.vatRate > 0 && (
                           <tr>
                             <td className="p-0.5 sm:p-1.5 md:p-2 text-right text-[6px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 border-t border-gray-100">VAT ({data.vatRate}%)</td>
                             <td className="p-0.5 sm:p-1.5 md:p-2 text-right text-[6px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 border-t border-gray-100 whitespace-nowrap">
                               {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             </td>
                           </tr>
                         )}
                         {data.taxRate > 0 && (
                           <tr>
                             <td className="p-0.5 sm:p-1.5 md:p-2 text-right text-[6px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 border-t border-gray-100">Tax ({data.taxRate}%)</td>
                             <td className="p-0.5 sm:p-1.5 md:p-2 text-right text-[6px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 border-t border-gray-100 whitespace-nowrap">
                               {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             </td>
                           </tr>
                         )}
                         <tr className={hasTax ? 'bg-village-blue/5' : ''}>
                           <td className="p-0.5 sm:p-2 md:p-3 text-right font-bold uppercase text-village-blue border-t-2 border-village-blue text-[7px] sm:text-xs md:text-sm">
                             {hasTax ? 'Grand Total' : 'Total Amount'}
                           </td>
                           <td className="p-0.5 sm:p-2 md:p-3 text-right font-bold text-[9px] sm:text-base md:text-lg text-village-green border-t-2 border-village-blue whitespace-nowrap">
                             {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                           </td>
                         </tr>
                       </tbody>
                     </table>
                  </div>

                  {/* Notes */}
                  {data.notes && (
                    <div className="mb-1 sm:mb-4 md:mb-8">
                      <h4 className="font-bold text-gray-800 mb-0.5 sm:mb-2 text-[6px] sm:text-[10px] md:text-xs uppercase border-b border-gray-300 inline-block pb-0.5 leading-tight">Note / Terms:</h4>
                      <div className="text-[6px] sm:text-[10px] md:text-xs text-gray-600 whitespace-pre-wrap leading-snug mt-0.5 sm:mt-1">
                        {data.notes}
                      </div>
                    </div>
                  )}

                  {/* Signature Block */}
                  <div className="pt-1 sm:pt-4 md:pt-8 pb-2 sm:pb-2 md:pb-4">
                    <p className="text-[7px] sm:text-xs md:text-sm font-bold text-gray-800 mb-2 sm:mb-12 md:mb-20 leading-tight">Thank You</p>
                    <div className="inline-block text-left">
                      <div className="w-12 sm:w-32 md:w-48 border-t border-gray-900 mb-0.5 sm:mb-2"></div>
                      <p className="text-[8px] sm:text-sm md:text-base font-bold text-gray-900 leading-tight">Shakhawat Hossain</p>
                      <p className="text-[6px] sm:text-[10px] md:text-xs text-gray-500 font-semibold tracking-wide leading-tight">Village Builders</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Decorative Bottom Bar - On Every Page */}
              <div className="absolute bottom-0 left-0 w-full h-1 sm:h-2 md:h-3 bg-gradient-to-r from-village-blue to-village-green z-20"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

QuotationPreview.displayName = "QuotationPreview";