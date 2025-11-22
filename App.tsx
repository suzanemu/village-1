import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Plus, Trash2, Download, Sparkles, FileText, Loader2, Menu, X, Eye, EyeOff, Upload, Image as ImageIcon, DownloadCloud, UploadCloud, Check, RotateCcw } from 'lucide-react';
import { QuotationData, QuotationItem, INITIAL_DATA } from './types';
import { QuotationPreview } from './src/components/QuotationPreview';
import { generateQuotationData } from './src/services/geminiService';

const App: React.FC = () => {
  // Initialize state from localStorage if available, otherwise use INITIAL_DATA
  const [data, setData] = useState<QuotationData>(() => {
    const saved = localStorage.getItem('village_quotation_draft');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // --- Auto-Save Draft ---
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('village_quotation_draft', JSON.stringify(data));
      } catch (error) {
        // If quota exceeded, try saving without images (they take up most space)
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          try {
            const dataWithoutImages = {
              ...data,
              logoImage: undefined,
              signatureImage: undefined
            };
            localStorage.setItem('village_quotation_draft', JSON.stringify(dataWithoutImages));
            showNotification("Storage full. Images not saved in draft.", "error");
          } catch (fallbackError) {
            // If even that fails, clear the draft
            console.error('Failed to save draft even without images:', fallbackError);
            localStorage.removeItem('village_quotation_draft');
            showNotification("Storage full. Draft auto-save disabled.", "error");
          }
        } else {
          console.error('Failed to save draft:', error);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [data]);

  // --- Actions ---

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleReset = () => {
    // Preserve images and their settings
    const imagesToKeep = {
      logoImage: data.logoImage,
      signatureImage: data.signatureImage,
      watermarkImage: data.watermarkImage,
      logoWidth: data.logoImage ? data.logoWidth : INITIAL_DATA.logoWidth,
      watermarkWidth: data.watermarkImage ? data.watermarkWidth : INITIAL_DATA.watermarkWidth,
      watermarkVerticalPosition: data.watermarkImage ? data.watermarkVerticalPosition : INITIAL_DATA.watermarkVerticalPosition
    };
    
    // Reset all data but keep images
    setData({
      ...INITIAL_DATA,
      ...imagesToKeep
    });
    
    localStorage.removeItem('village_quotation_draft');
    
    // Do NOT clear file input refs - keep uploaded images
    
    setShowResetConfirm(false);
    showNotification("Text data has been reset! Images preserved.");
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Quotation_${data.toCompany.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification("File downloaded! Save this to your Cloud Drive.");
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const importedData = JSON.parse(result);
        
        // Simple validation to ensure it's a valid quotation file
        if (importedData.items && Array.isArray(importedData.items)) {
             setData(prev => ({...prev, ...importedData}));
             showNotification("Quotation loaded successfully!");
        } else {
            showNotification("Invalid file format.", "error");
        }
      } catch (error) {
        console.error(error);
        showNotification("Failed to read file.", "error");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be loaded again if needed
    event.target.value = ''; 
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      // Find all page elements
      const pages = previewRef.current.querySelectorAll('.quotation-page');
      if (pages.length === 0) return;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        // If not the first page, add a new page to the PDF
        if (i > 0) {
          pdf.addPage();
        }

        const pageElement = pages[i] as HTMLElement;
        
        // Capture the specific page
        const canvas = await html2canvas(pageElement, {
          scale: 2.5, // Good balance between quality and size
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`Quotation_${data.toCompany.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMagicFill = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const aiData = await generateQuotationData(prompt);
      
      // Merge AI data with existing structure to ensure IDs exist
      const newItems = (aiData.items || []).map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9)
      }));

      setData(prev => ({
        ...prev,
        ...aiData,
        items: newItems.length > 0 ? newItems : prev.items,
        vatRate: aiData.vatRate !== undefined ? aiData.vatRate : prev.vatRate,
        taxRate: aiData.taxRate !== undefined ? aiData.taxRate : prev.taxRate
      }));
      setPrompt("");
      showNotification("Magic Fill completed!");
    } catch (error) {
      console.error(error);
      alert("AI Generation failed. Please check your API key or try a different prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, logoImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, signatureImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, watermarkImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    const newItem: QuotationItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: "",
      unit: "L/S",
      quantity: 1,
      unitCost: 0
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // --- Render Helpers ---

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Reset All Data?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              This will clear all your current data including items, client details, images, and settings. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Left Panel: Editor --- */}
      <div className={`w-full md:w-5/12 lg:w-1/3 h-screen overflow-y-auto bg-white border-r border-slate-200 z-20 flex flex-col transition-transform duration-300 fixed md:relative ${showMobilePreview ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
        
        <div className="p-6 bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-village-blue rounded-lg flex items-center justify-center text-white font-script text-xl font-bold">V</div>
               <h1 className="text-xl font-bold text-slate-900">Village Builder</h1>
            </div>
            
            {/* File Actions */}
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={jsonInputRef} 
                onChange={handleImportJSON} 
                accept=".json" 
                className="hidden" 
              />
              <button 
                onClick={() => jsonInputRef.current?.click()}
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:bg-slate-100 px-2 py-2 rounded-lg transition-colors"
                title="Load from File"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Load</span>
              </button>

              <button 
                onClick={handleExportJSON}
                className="flex items-center gap-1 text-xs font-medium text-village-blue hover:bg-blue-50 px-2 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                title="Save to Cloud (File)"
              >
                <DownloadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>

              <button 
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-2 rounded-lg transition-colors"
                title="Reset All Data"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
          
          {/* AI Input */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <label className="block text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> 
              MAGIC FILL WITH AI
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Quotation for 1500 sqft office painting with 15% VAT..."
                className="flex-1 text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={handleMagicFill}
                disabled={isGenerating || !prompt}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8 pb-24">
          
          {/* Company Branding */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Company Branding</h3>
            
            {/* Header Logo Upload */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-600 mb-3">HEADER LOGO</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                  {data.logoImage ? (
                    <img src={data.logoImage} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-medium text-village-blue border border-village-blue rounded-md px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 transition-colors mb-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Logo
                  </button>
                  {data.logoImage && (
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">SIZE: {data.logoWidth}px</label>
                      <input 
                        type="range" 
                        min="80" 
                        max="400" 
                        value={data.logoWidth}
                        onChange={(e) => setData({...data, logoWidth: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-village-green"
                      />
                    </div>
                  )}
                  {!data.logoImage && <p className="text-[10px] text-slate-400 mt-1">Use the 'Village' logo image</p>}
                </div>
              </div>
            </div>

            {/* Watermark Logo Upload */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <label className="block text-xs font-bold text-amber-800 mb-3">WATERMARK LOGO (Background)</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-white border border-amber-200 flex items-center justify-center overflow-hidden">
                  {data.watermarkImage ? (
                    <img src={data.watermarkImage} alt="Watermark" className="w-full h-full object-contain opacity-30" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-amber-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    ref={watermarkInputRef}
                    onChange={handleWatermarkUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    onClick={() => watermarkInputRef.current?.click()}
                    className="text-sm font-medium text-amber-700 border border-amber-700 rounded-md px-3 py-1.5 hover:bg-amber-100 flex items-center gap-2 transition-colors mb-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Watermark
                  </button>
                  {data.watermarkImage && (
                    <>
                      <div className="mb-2">
                        <label className="block text-[10px] text-amber-600 font-bold mb-1">SIZE: {data.watermarkWidth}px</label>
                        <input 
                          type="range" 
                          min="300" 
                          max="800" 
                          value={data.watermarkWidth}
                          onChange={(e) => setData({...data, watermarkWidth: parseInt(e.target.value)})}
                          className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-[10px] text-amber-600 font-bold mb-1 flex items-center justify-between">
                          <span>VERTICAL POSITION</span>
                          <span className="text-xs font-bold text-amber-700">{data.watermarkVerticalPosition}</span>
                        </label>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={data.watermarkVerticalPosition}
                          onChange={(e) => setData({...data, watermarkVerticalPosition: parseInt(e.target.value)})}
                          className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        />
                        <div className="flex justify-between text-[9px] text-amber-600 mt-0.5">
                          <span>Bottom</span>
                          <span>Top</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setData({...data, watermarkImage: undefined})}
                        className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </>
                  )}
                  {!data.watermarkImage && <p className="text-[10px] text-amber-600 mt-1">Appears faded on every page</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Client Info Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Client Details</h3>
              <button 
                onClick={() => setData({...data, hideClientDetails: !data.hideClientDetails})}
                className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-2 transition-all ${data.hideClientDetails ? 'bg-slate-200 text-slate-600' : 'bg-blue-50 text-blue-600'}`}
              >
                {data.hideClientDetails ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Hidden
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Visible
                  </>
                )}
              </button>
            </div>
            <div className={`space-y-4 transition-opacity duration-200 ${data.hideClientDetails ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Client Name</label>
                <input 
                  value={data.toName}
                  onChange={e => setData({...data, toName: e.target.value})}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-village-green focus:border-transparent outline-none bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company</label>
                <input 
                  value={data.toCompany}
                  onChange={e => setData({...data, toCompany: e.target.value})}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-village-green focus:border-transparent outline-none bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                <textarea 
                  value={data.toAddress}
                  onChange={e => setData({...data, toAddress: e.target.value})}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-village-green focus:border-transparent outline-none h-20 resize-none bg-white text-slate-900"
                />
              </div>
            </div>
          </section>

          {/* Quotation Details */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quotation Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input 
                  type="date"
                  value={data.date}
                  onChange={e => setData({...data, date: e.target.value})}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-village-green outline-none bg-white text-slate-900"
                />
              </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                <input 
                  value={data.subject}
                  onChange={e => setData({...data, subject: e.target.value})}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-village-green outline-none bg-white text-slate-900"
                />
            </div>
          </section>

          {/* Line Items */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Items</h3>
              <button onClick={addItem} className="text-xs flex items-center gap-1 text-village-green font-semibold hover:bg-green-50 px-2 py-1 rounded">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {data.items.map((item, index) => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  
                  <div className="space-y-3">
                    <input 
                      placeholder="Description"
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      className="w-full font-medium border-b border-dashed border-slate-300 py-1 focus:border-village-blue outline-none text-sm bg-transparent text-slate-900"
                    />
                    
                    <div className="flex gap-3">
                      <div className="w-20">
                        <label className="text-[10px] text-slate-400 font-bold">UNIT</label>
                        <input 
                          value={item.unit}
                          onChange={e => updateItem(item.id, 'unit', e.target.value)}
                          className="w-full bg-slate-50 rounded px-2 py-1 text-sm outline-none text-slate-900 border border-slate-100"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-slate-400 font-bold">QTY</label>
                        <input 
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 rounded px-2 py-1 text-sm outline-none text-slate-900 border border-slate-100"
                        />
                      </div>
                      <div className="flex-1">
                         <label className="text-[10px] text-slate-400 font-bold">UNIT PRICE</label>
                         <input 
                          type="number"
                          value={item.unitCost}
                          onChange={e => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 rounded px-2 py-1 text-sm outline-none text-right text-slate-900 border border-slate-100"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end border-t border-slate-100 pt-2 mt-1">
                       <span className="text-xs font-bold text-slate-500">Total: {(item.quantity * item.unitCost).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tax & VAT Section - UPDATED STYLE */}
          <section>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Tax & VAT</h3>
             <div className="grid grid-cols-2 gap-4">
                {/* VAT Input */}
                <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1">VAT (%)</label>
                   <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        step="0.5"
                        value={data.vatRate}
                        onChange={e => setData({...data, vatRate: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                        className="w-full border border-slate-300 rounded-md pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-village-green focus:border-transparent outline-none bg-white text-slate-900"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-sm font-medium">%</span>
                   </div>
                </div>

                {/* Tax Input */}
                <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1">Tax (%)</label>
                   <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        step="0.5"
                        value={data.taxRate}
                        onChange={e => setData({...data, taxRate: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                        className="w-full border border-slate-300 rounded-md pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-village-green focus:border-transparent outline-none bg-white text-slate-900"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-sm font-medium">%</span>
                   </div>
                </div>
             </div>
          </section>

          {/* Notes */}
          <section>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Terms & Conditions</h3>
             <textarea 
                value={data.notes}
                onChange={e => setData({...data, notes: e.target.value})}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-village-green focus:border-transparent outline-none h-32 bg-white text-slate-900"
             />
          </section>

          {/* Box Width Controls */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Layout Controls</h3>
            
            {/* Notes Box Width */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
              <label className="block text-xs font-bold text-slate-600 mb-3">NOTES BOX WIDTH</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="30" 
                  max="70" 
                  value={data.notesBoxWidth}
                  onChange={(e) => setData({...data, notesBoxWidth: parseInt(e.target.value), totalBoxWidth: 100 - parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-village-green"
                />
                <span className="text-sm font-bold text-slate-700 min-w-[60px] text-right">{data.notesBoxWidth}%</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Narrower</span>
                <span>Wider</span>
              </div>
            </div>

            {/* Total Box Width */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-600 mb-3">TOTAL BOX WIDTH</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="30" 
                  max="70" 
                  value={data.totalBoxWidth}
                  onChange={(e) => setData({...data, totalBoxWidth: parseInt(e.target.value), notesBoxWidth: 100 - parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-village-blue"
                />
                <span className="text-sm font-bold text-slate-700 min-w-[60px] text-right">{data.totalBoxWidth}%</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Narrower</span>
                <span>Wider</span>
              </div>
            </div>
          </section>

          {/* E-Signature Upload */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">E-Signature</h3>
            <div className="flex items-center gap-4">
              <div className="h-20 w-full max-w-[200px] rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                {data.signatureImage ? (
                  <img src={data.signatureImage} alt="Signature" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  ref={signatureInputRef}
                  onChange={handleSignatureUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  onClick={() => signatureInputRef.current?.click()}
                  className="text-sm font-medium text-village-blue border border-village-blue rounded-md px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 transition-colors mb-2"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Signature
                </button>
                {data.signatureImage && (
                  <button 
                    onClick={() => setData({...data, signatureImage: undefined})}
                    className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
                {!data.signatureImage && <p className="text-[10px] text-slate-400 mt-1">Upload your e-signature image</p>}
              </div>
            </div>
            
            {/* Size Controls */}
            <div className="mt-6 space-y-4">
              {/* Thank You Size Control */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-3">"THANK YOU" TEXT SIZE</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="12" 
                    max="24" 
                    value={data.thankYouSize}
                    onChange={(e) => setData({...data, thankYouSize: parseInt(e.target.value)})}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-village-green"
                  />
                  <span className="text-sm font-bold text-slate-700 min-w-[60px] text-right">{data.thankYouSize}px</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>

              {/* Signature Block Scale Control */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-3">SIGNATURE BLOCK SIZE</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="80" 
                    max="120" 
                    value={data.signatureBlockSize}
                    onChange={(e) => setData({...data, signatureBlockSize: parseInt(e.target.value)})}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-village-green"
                  />
                  <span className="text-sm font-bold text-slate-700 min-w-[60px] text-right">{data.signatureBlockSize}%</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Smaller</span>
                  <span>Bigger</span>
                </div>
              </div>
            </div>
            
            {/* Vertical Page Control Slider */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-600 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                PAGE LAYOUT CONTROL
              </label>
              <div className="flex gap-6 items-center">
                {/* Vertical Slider */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 mb-2 font-medium">Push to Page 2</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="12" 
                    step="1"
                    value={data.signatureSpacing}
                    onChange={(e) => setData({...data, signatureSpacing: parseInt(e.target.value)})}
                    className="h-32 appearance-none bg-slate-200 rounded-lg cursor-pointer accent-village-blue"
                    style={{
                      writingMode: 'bt-lr',
                      WebkitAppearance: 'slider-vertical',
                      width: '8px'
                    }}
                  />
                  <span className="text-[10px] text-slate-500 mt-2 font-medium">Pull to Page 1</span>
                </div>
                
                {/* Description */}
                <div className="flex-1 text-xs text-slate-600 leading-relaxed">
                  <p className="mb-2">
                    <strong>Current: {data.signatureSpacing}/12</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Slide <strong>down</strong> to pull signature block to page 1 when there's space.
                    Slide <strong>up</strong> to push it to page 2 for cleaner layout.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* --- Right Panel: Preview --- */}
      <div className={`flex-1 bg-slate-800 h-screen overflow-y-auto relative flex items-start justify-center py-12 px-4 transition-all duration-300 ${showMobilePreview ? 'block fixed inset-0 z-30' : 'hidden md:flex'}`}>
        
        {/* Mobile Close Button */}
        {showMobilePreview && (
          <button 
            onClick={() => setShowMobilePreview(false)}
            className="absolute top-4 right-4 bg-white/10 text-white p-2 rounded-full backdrop-blur-md z-50"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Toast Notification */}
        {notification && (
          <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in transition-all ${notification.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}`}>
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        <div className="relative">
           {/* Toolbar */}
          <div className="fixed md:absolute top-0 md:-top-12 left-0 w-full flex justify-between items-center text-white/80 text-sm z-50 px-4 md:px-0 pt-4 md:pt-0 bg-slate-800 md:bg-transparent">
             <span className="hidden md:inline">Preview Mode</span>
             <button 
               onClick={handleDownloadPDF}
               disabled={isDownloading}
               className="flex items-center gap-2 bg-village-green hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg transition-all font-semibold disabled:opacity-70 ml-auto"
             >
               {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
               Download PDF
             </button>
          </div>
          
          {/* The actual A4 Component */}
          <div className="mt-12 md:mt-0">
            <QuotationPreview ref={previewRef} data={data} />
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 md:hidden z-40 flex flex-col gap-4">
        <button 
          onClick={() => setShowMobilePreview(!showMobilePreview)}
          className="bg-slate-900 text-white p-4 rounded-full shadow-xl flex items-center justify-center"
        >
          <FileText className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default App;