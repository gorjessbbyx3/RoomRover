
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIEngine {
  
  // Smart pricing optimization
  static async optimizePricing(roomData: any, marketData: any, historicalData: any) {
    const prompt = `
    Analyze this STR data and recommend optimal pricing:
    
    Room: ${JSON.stringify(roomData)}
    Market Data: ${JSON.stringify(marketData)}
    Historical Performance: ${JSON.stringify(historicalData)}
    
    Provide pricing recommendations with confidence scores.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return this.parsePricingResponse(response.choices[0].message.content);
  }

  // Predictive maintenance
  static async predictMaintenance(roomHistory: any, currentStatus: any) {
    const prompt = `
    Based on this room's maintenance history and current status, 
    predict what maintenance issues might occur in the next 30 days:
    
    History: ${JSON.stringify(roomHistory)}
    Current Status: ${JSON.stringify(currentStatus)}
    
    Return probability scores and recommended preventive actions.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    return this.parseMaintenanceResponse(response.choices[0].message.content);
  }

  // Guest communication assistant
  static async generateGuestResponse(inquiry: string, context: any) {
    const prompt = `
    You are a professional STR property manager assistant. 
    Respond to this guest inquiry professionally and helpfully:
    
    Inquiry: "${inquiry}"
    Property Context: ${JSON.stringify(context)}
    
    Keep responses concise, friendly, and informative.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  }

  // Smart inventory management
  static async optimizeInventory(currentInventory: any, usagePatterns: any) {
    const prompt = `
    Analyze inventory usage patterns and recommend optimal stock levels:
    
    Current Inventory: ${JSON.stringify(currentInventory)}
    Usage Patterns: ${JSON.stringify(usagePatterns)}
    
    Suggest reorder points, quantities, and cost optimizations.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return this.parseInventoryResponse(response.choices[0].message.content);
  }

  private static parsePricingResponse(content: string | null) {
    // Parse AI response into structured pricing data
    try {
      return JSON.parse(content || '{}');
    } catch {
      return { error: "Failed to parse pricing recommendations" };
    }
  }

  private static parseMaintenanceResponse(content: string | null) {
    // Parse AI response into structured maintenance predictions
    try {
      return JSON.parse(content || '{}');
    } catch {
      return { error: "Failed to parse maintenance predictions" };
    }
  }

  private static parseInventoryResponse(content: string | null) {
    // Parse AI response into structured inventory recommendations
    try {
      return JSON.parse(content || '{}');
    } catch {
      return { error: "Failed to parse inventory recommendations" };
    }
  }
}
