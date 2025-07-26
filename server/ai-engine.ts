
export class AIEngine {
  
  private static async callReplitAI(prompt: string, temperature: number = 0.3) {
    const response = await fetch('https://api.replit.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLIT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'replit-code-v1.5-3b',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Replit AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Smart pricing optimization
  static async optimizePricing(roomData: any, marketData: any, historicalData: any) {
    const prompt = `
    Analyze this STR data and recommend optimal pricing:
    
    Room: ${JSON.stringify(roomData)}
    Market Data: ${JSON.stringify(marketData)}
    Historical Performance: ${JSON.stringify(historicalData)}
    
    Provide pricing recommendations with confidence scores in JSON format.
    `;

    try {
      const response = await this.callReplitAI(prompt, 0.3);
      return this.parsePricingResponse(response);
    } catch (error) {
      console.error('AI pricing optimization error:', error);
      return { error: "Failed to generate pricing recommendations" };
    }
  }

  // Predictive maintenance
  static async predictMaintenance(roomHistory: any, currentStatus: any) {
    const prompt = `
    Based on this room's maintenance history and current status, 
    predict what maintenance issues might occur in the next 30 days:
    
    History: ${JSON.stringify(roomHistory)}
    Current Status: ${JSON.stringify(currentStatus)}
    
    Return probability scores and recommended preventive actions in JSON format.
    `;

    try {
      const response = await this.callReplitAI(prompt, 0.2);
      return this.parseMaintenanceResponse(response);
    } catch (error) {
      console.error('AI maintenance prediction error:', error);
      return { error: "Failed to generate maintenance predictions" };
    }
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

    try {
      const response = await this.callReplitAI(prompt, 0.7);
      return response;
    } catch (error) {
      console.error('AI guest response error:', error);
      return "I apologize, but I'm unable to process your request at the moment. Please contact our support team directly.";
    }
  }

  // Smart inventory management
  static async optimizeInventory(currentInventory: any, usagePatterns: any) {
    const prompt = `
    Analyze inventory usage patterns and recommend optimal stock levels:
    
    Current Inventory: ${JSON.stringify(currentInventory)}
    Usage Patterns: ${JSON.stringify(usagePatterns)}
    
    Suggest reorder points, quantities, and cost optimizations in JSON format.
    `;

    try {
      const response = await this.callReplitAI(prompt, 0.3);
      return this.parseInventoryResponse(response);
    } catch (error) {
      console.error('AI inventory optimization error:', error);
      return { error: "Failed to generate inventory recommendations" };
    }
  }

  private static parsePricingResponse(content: string | null) {
    try {
      return JSON.parse(content || '{}');
    } catch {
      return { error: "Failed to parse pricing recommendations" };
    }
  }

  private static parseMaintenanceResponse(content: string | null) {
    try {
      return JSON.parse(content || '{}');
    } catch {
      return { error: "Failed to parse maintenance predictions" };
    }
  }

  private static parseInventoryResponse(content: string | null) {
    try {
      return JSON.parse(content || '{}');
    } catch {
      return { error: "Failed to parse inventory recommendations" };
    }
  }
}
