export interface QuotationItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
}

export interface QuotationData {
  logoImage?: string;
  logoWidth: number;
  watermarkImage?: string;
  watermarkWidth: number;
  watermarkVerticalPosition: number; // Vertical position offset (0-100, where 0 is bottom, 100 is top)
  headerVerticalPosition: number; // Header top spacing (0-100px)
  date: string;
  toName: string;
  toCompany: string;
  toAddress: string;
  subject: string;
  items: QuotationItem[];
  notes: string;
  vatRate: number;
  taxRate: number;
  hideClientDetails: boolean;
  signatureImage?: string;
  signatureSpacing: number; // Spacing before signature block in pixels
  thankYouSize: number; // Font size for "Thank You" text (12-24px)
  signatureBlockSize: number; // Scale for signature block (80-120%)
}

export const INITIAL_DATA: QuotationData = {
  logoWidth: 200,
  watermarkWidth: 500,
  watermarkVerticalPosition: 0, // Default at bottom
  headerVerticalPosition: 0, // Default at top (no offset)
  date: new Date().toISOString().split('T')[0],
  toName: "Mr. John Doe",
  toCompany: "ABC Construction Ltd.",
  toAddress: "123 Main Street, Dhaka-1200, Bangladesh",
  subject: "Quotation for Construction Work",
  items: [
    {
      id: "1",
      description: "Excavation Work and Back Filling",
      unit: "M3",
      quantity: 1,
      unitCost: 90090
    }
  ],
  notes: "1. All materials will be supplied by us.\n2. Payment terms: 50% advance, 50% on completion.\n3. Validity: 30 days from the date of quotation.",
  vatRate: 0,
  taxRate: 0,
  hideClientDetails: false,
  signatureSpacing: 32, // Default spacing (32px = 8 * 4 in Tailwind units)
  thankYouSize: 14, // Default 14px (text-sm)
  signatureBlockSize: 100 // Default 100% scale
};