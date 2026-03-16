import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Require admin role for transaction data
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    const { data: isAdmin } = await serviceClient.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { startDate, endDate, process, eventType } = await req.json();

    // Input validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && (typeof startDate !== 'string' || !dateRegex.test(startDate) || startDate.length > 10)) {
      return new Response(JSON.stringify({ error: 'Invalid startDate format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (endDate && (typeof endDate !== 'string' || !dateRegex.test(endDate) || endDate.length > 10)) {
      return new Response(JSON.stringify({ error: 'Invalid endDate format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const allowedProcesses = ['locked', 'extended', 'paid'];
    if (process && !allowedProcesses.includes(process)) {
      return new Response(JSON.stringify({ error: 'Invalid process value' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const allowedEventTypes = ['sale', 'lead'];
    if (eventType && !allowedEventTypes.includes(eventType)) {
      return new Response(JSON.stringify({ error: 'Invalid eventType value' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const rakutenToken = Deno.env.get('RAKUTEN_ADVERTISING_TOKEN');
    if (!rakutenToken) {
      throw new Error('Rakuten API token not configured');
    }

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (process) params.append('process', process);
    if (eventType) params.append('eventType', eventType);

    const rakutenUrl = `https://api.linksynergy.com/events/1.0/transactions?${params.toString()}`;
    
    console.log('Calling Rakuten Events API');

    const response = await fetch(rakutenUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${rakutenToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Rakuten Events API error:', response.status);
      throw new Error(`Rakuten API returned ${response.status}`);
    }

    const data = await response.json();
    
    const transactions = data.transactions?.map((txn: any) => ({
      transactionId: txn.etransactionId || txn.orderId,
      advertiserId: txn.mid,
      advertiserName: txn.merchantName,
      orderDate: txn.transactionDate,
      processDate: txn.processDate,
      status: txn.process,
      saleAmount: parseFloat(txn.saleAmount || '0'),
      commission: parseFloat(txn.commissions || '0'),
      currency: txn.currency || 'USD',
      productSku: txn.sku,
      quantity: parseInt(txn.quantity || '1'),
      u1: txn.u1,
      clickDate: txn.clickDate,
      eventType: txn.transactionType,
    })) || [];

    console.log(`Retrieved ${transactions.length} transactions`);

    return new Response(
      JSON.stringify({ 
        transactions, 
        total: transactions.length,
        totalCommission: transactions.reduce((sum: number, txn: any) => sum + txn.commission, 0),
        totalSales: transactions.reduce((sum: number, txn: any) => sum + txn.saleAmount, 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in rakuten-transactions:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: 'Internal server error', transactions: [], total: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
