import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Dispatches pending chat unread notification emails.
// Invoked by pg_cron every minute (see companion cron migration).
// verify_jwt is left at the project default; cron calls with the service role bearer.


const MAX_BATCH = 100
const PREVIEW_MAX_CHARS = 140

function truncate(s: string, n: number) {
  const t = (s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const now = new Date().toISOString()

  // Load due pending rows that have never been emailed yet.
  // We send exactly ONE email per unread cycle. The row is cleared by:
  //   - the on_conversation_read_clear_pending trigger when the recipient reads, or
  //   - the 24h housekeeping sweep below.
  // A subsequent new message starts a fresh cycle (new row via enqueue trigger).
  const { data: pending, error: pendingErr } = await supabase
    .from('pending_chat_email_notifications')
    .select('id, conversation_id, user_id, first_unread_message_id, first_unread_at, scheduled_for, last_emailed_at')
    .lte('scheduled_for', now)
    .is('last_emailed_at', null)
    .order('scheduled_for', { ascending: true })
    .limit(MAX_BATCH)

  if (pendingErr) {
    console.error('pending fetch error', pendingErr)
    return new Response(JSON.stringify({ error: pendingErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let skipped = 0
  let cleared = 0

  for (const row of pending || []) {
    try {
      // Recipient profile: email + opt-out + name
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, name, last_name, email_notify_chat')
        .eq('user_id', row.user_id)
        .maybeSingle()

      if (!profile?.email) {
        await supabase.from('pending_chat_email_notifications').delete().eq('id', row.id)
        cleared++
        continue
      }
      if (profile.email_notify_chat === false) {
        await supabase.from('pending_chat_email_notifications').delete().eq('id', row.id)
        cleared++
        continue
      }

      // Read state
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('last_read_at')
        .eq('conversation_id', row.conversation_id)
        .eq('user_id', row.user_id)
        .maybeSingle()

      const lastRead = participant?.last_read_at ? new Date(participant.last_read_at) : null

      // First unread message
      const { data: firstMsg } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, deleted_at')
        .eq('id', row.first_unread_message_id)
        .maybeSingle()

      if (!firstMsg) {
        await supabase.from('pending_chat_email_notifications').delete().eq('id', row.id)
        cleared++
        continue
      }

      const msgCreatedAt = new Date(firstMsg.created_at)
      if (lastRead && lastRead >= msgCreatedAt) {
        // Already read
        await supabase.from('pending_chat_email_notifications').delete().eq('id', row.id)
        cleared++
        continue
      }

      // Unread count
      const unreadFilter = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', row.conversation_id)
        .neq('sender_id', row.user_id)
        .is('deleted_at', null)
      const { count: unreadCount } = lastRead
        ? await unreadFilter.gt('created_at', lastRead.toISOString())
        : await unreadFilter

      // Sender name
      const { data: sender } = await supabase
        .from('profiles')
        .select('name, last_name')
        .eq('user_id', firstMsg.sender_id)
        .maybeSingle()
      const senderName = [sender?.name, sender?.last_name].filter(Boolean).join(' ') || 'Un freediver'

      // Conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('type, name, group_id, session_id, event_id')
        .eq('id', row.conversation_id)
        .maybeSingle()

      const isGroup = !!conversation && conversation.type !== 'direct' && conversation.type !== 'dm'
      const conversationName = conversation?.name || senderName

      const recipientName = profile.name || 'freediver'
      const previewText = firstMsg.deleted_at ? '' : truncate(firstMsg.content || '', PREVIEW_MAX_CHARS)

      const hourBucket = Math.floor(Date.now() / 3_600_000)
      const idempotencyKey = `chat-unread-${row.conversation_id}-${row.user_id}-${hourBucket}`

      const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'chat-unread-messages',
          recipientEmail: profile.email,
          idempotencyKey,
          templateData: {
            recipientName,
            senderName,
            conversationName,
            conversationId: row.conversation_id,
            messagePreview: previewText,
            unreadCount: unreadCount ?? 1,
            isGroup,
          },
        },
      })

      if (sendErr) {
        console.error('send failed', { id: row.id, err: sendErr })
        skipped++
        continue
      }

      await supabase
        .from('pending_chat_email_notifications')
        .update({ last_emailed_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } catch (e) {
      console.error('row failed', row.id, e)
      skipped++
    }
  }

  // Housekeeping: drop rows already emailed >24h ago (recipient never read, cooldown passed multiple times)
  await supabase
    .from('pending_chat_email_notifications')
    .delete()
    .lt('last_emailed_at', new Date(Date.now() - 24 * 60 * 60_000).toISOString())

  return new Response(
    JSON.stringify({ processed: pending?.length || 0, sent, skipped, cleared }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
