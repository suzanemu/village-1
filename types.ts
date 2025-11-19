export interface QuotationItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
}

export interface QuotationData {
  toName: string;
  toCompany: string;
  toAddress: string;
  date: string;
  subject: string;
  items: QuotationItem[];
  notes: string;
  vatRate: number;
  taxRate: number;
  hideClientDetails: boolean;
  logoImage?: string;
  logoWidth: number;
}

export const INITIAL_DATA: QuotationData = {
  toName: "Project Manager",
  toCompany: "Shimizu Corporation",
  toAddress: "Dhaka, Bangladesh",
  date: new Date().toISOString().split('T')[0],
  subject: "QUOTATION FOR SITE OFFICE RENOVATION",
  items: [
    { id: '1', description: "Excavation Work and Back Filling", unit: "M3", quantity: 1, unitCost: 90090 },
    { id: '2', description: "Floor Finishing Work", unit: "L/S", quantity: 1, unitCost: 24000 },
  ],
  notes: "1. Payment terms: 50% advance, 50% upon completion.\n2. Validity: 15 days from date of issue.",
  vatRate: 0,
  taxRate: 0,
  hideClientDetails: false,
  logoWidth: 160,
};