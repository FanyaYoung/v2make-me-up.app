import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate, process, eventType } = await req.json();
    
    const rakutenToken = Deno.env.get('RAKUTEN_ADVERTISING_TOKEN');
    if (!rakutenToken) {
      throw new Error('Rakuten API token not configured');
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (process) params.append('process', process); // e.g., 'locked', 'extended', 'paid'
    if (eventType) params.append('eventType', eventType); // e.g., 'sale', 'lead'

    const rakutenUrl = `https://api.linksynergy.com/events/1.0/transactions?${params.toString()}`;
    
    console.log('Calling Rakuten Events API:', rakutenUrl.replace(rakutenToken, 'REDACTED'));

    const response = await fetch(rakutenUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${rakutenToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rakuten Events API error:', response.status, errorText);
      throw new Error(`Rakuten API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Parse and format the response
    const transactions = data.transactions?.map((txn: any) => ({
      transactionId: txn.etransactionId || txn.orderId,
      advertiserId: txn.mid,
      advertiserName: txn.merchantName,
      orderDate: txn.transactionDate,
      processDate: txn.processDate,
      status: txn.process, // locked, extended, paid, voided
      saleAmount: parseFloat(txn.saleAmount || '0'),
      commission: parseFloat(txn.commissions || '0'),
      currency: txn.currency || 'USD',
      productSku: txn.sku,
      quantity: parseInt(txn.quantity || '1'),
      u1: txn.u1, // Custom tracking parameter
      clickDate: txn.clickDate,
      eventType: txn.transactionType, // sale, lead, etc.
    })) || [];

    console.log(`Retrieved ${transactions.length} transactions from Rakuten Events API`);

    return new Response(
      JSON.stringify({ 
        transactions, 
        total: transactions.length,
        totalCommission: transactions.reduce((sum: number, txn: any) => sum + txn.commission, 0),
        totalSales: transactions.reduce((sum: number, txn: any) => sum + txn.saleAmount, 0)
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in rakuten-transactions:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        transactions: [],
        total: 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});
