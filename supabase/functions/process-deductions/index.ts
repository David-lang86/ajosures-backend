import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all active groups with contribution amount
    const { data: groups } = await supabase
      .from('groups')
      .select('id, contribution_amount, group_name')
      .eq('status', 'active');

    let deductionsProcessed = 0;

    for (const group of groups ?? []) {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id);

      for (const member of members ?? []) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', member.user_id)
          .single();

        // Skip if wallet not found or insufficient balance
        if (!wallet || wallet.balance < group.contribution_amount) continue;

        // Deduct contribution
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance - group.contribution_amount })
          .eq('user_id', member.user_id);

        // Log transaction
        await supabase.from('transactions').insert({
          user_id: member.user_id,
          title: `Group contribution — ${group.group_name}`,
          amount: group.contribution_amount,
          type: 'debit',
          status: 'success',
          gateway: 'internal',
          verified: true,
        });

        deductionsProcessed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, deductionsProcessed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});