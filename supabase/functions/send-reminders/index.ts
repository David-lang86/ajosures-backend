import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: groups } = await supabase
      .from('groups')
      .select('id, contribution_amount, group_name')
      .eq('status', 'active');

    let remindersSent = 0;

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

        if (!wallet) continue;

        // Send reminder if balance is below contribution requirement
        if (wallet.balance < group.contribution_amount) {
          await supabase.from('notifications').insert({
            user_id: member.user_id,
            title: 'Low Balance Reminder',
            message: `Your wallet balance (₦${wallet.balance.toLocaleString()}) is too low for your upcoming contribution of ₦${group.contribution_amount.toLocaleString()} in "${group.group_name}". Please fund your wallet.`,
            read: false,
            created_at: new Date().toISOString(),
          });

          remindersSent++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, remindersSent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});