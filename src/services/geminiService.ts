import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// The API key must be obtained exclusively from process.env.API_KEY.
// We assume this variable is pre-configured, valid, and accessible.
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

export const generateQuotationData = async (promptText: string): Promise<any> => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          toName: { type: SchemaType.STRING },
          toCompany: { type: SchemaType.STRING },
          toAddress: { type: SchemaType.STRING },
          subject: { type: SchemaType.STRING },
          items: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                description: { type: SchemaType.STRING },
                unit: { type: SchemaType.STRING, description: "e.g. M3, Sqft, L/S, Pcs" },
                quantity: { type: SchemaType.NUMBER },
                unitCost: { type: SchemaType.NUMBER },
              }
            }
          },
          vatRate: { type: SchemaType.NUMBER, description: "Percentage for VAT if mentioned (e.g. 15 for 15%)" },
          taxRate: { type: SchemaType.NUMBER, description: "Percentage for Tax/AIT if mentioned" },
          notes: { type: SchemaType.STRING, description: "A list of conditions numbered 1, 2, 3..." }
        }
      }
    }
  });
  
  const result = await model.generateContent(`Generate a realistic construction or service quotation based on this request: "${promptText}". 
    Return realistic quantities and market rates (in BDT or generic currency). 
    If VAT or Tax is mentioned, include the rates.
    Keep descriptions professional.`);

  const response = await result.response;
  return JSON.parse(response.text() || "{}");
};