import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    const payload = await req.json();

    if (payload.event !== 'charge.success') {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { reference, amount, metadata } = payload.data;
    const userId = metadata?.user_id;
    const amountInNaira = amount / 100;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id in metadata' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get current wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: 'Wallet not found' }), { status: 400 });
    }

    // Update wallet balance
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amountInNaira })
      .eq('user_id', userId);

    // Insert transaction record
    await supabase.from('transactions').insert({
      user_id: userId,
      title: 'Wallet Funding via Paystack',
      amount: amountInNaira,
      type: 'credit',
      status: 'success',
      payment_reference: reference,
      gateway: 'paystack',
      verified: true,
    });

    // Insert notification
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Wallet Funded',
      message: `₦${amountInNaira.toLocaleString()} has been added to your wallet via Paystack.`,
      read: false,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});