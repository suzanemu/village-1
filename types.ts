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
}

export const INITIAL_DATA: QuotationData = {
  logoWidth: 200,
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
  signatureSpacing: 32 // Default spacing (32px = 8 * 4 in Tailwind units)
};