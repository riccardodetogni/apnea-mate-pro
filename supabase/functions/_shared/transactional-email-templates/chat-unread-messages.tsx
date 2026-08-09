/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

import { SITE_URL, LOGO_URL as LOGO } from '../email-env.ts'

interface Props {
  recipientName?: string
  senderName?: string
  conversationName?: string
  conversationId?: string
  messagePreview?: string
  unreadCount?: number
  isGroup?: boolean
}

const ChatUnreadMessagesEmail = ({
  recipientName,
  senderName,
  conversationName,
  conversationId,
  messagePreview,
  unreadCount,
  isGroup,
}: Props) => {
  const count = unreadCount ?? 1
  const previewText = isGroup
    ? `${count} nuovi messaggi in ${conversationName || 'una conversazione'}`
    : `Nuovo messaggio da ${senderName || 'un freediver'}`

  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={LOGO} alt="Apnea Mate" width="180" style={logo} />
          <Heading style={h1}>
            {isGroup
              ? `${count} ${count === 1 ? 'nuovo messaggio' : 'nuovi messaggi'} in chat 💬`
              : `Nuovo messaggio da ${senderName || 'un freediver'} 💬`}
          </Heading>
          <Text style={text}>Ciao {recipientName || 'freediver'},</Text>
          <Text style={text}>
            {isGroup ? (
              <>
                Hai <strong>{count}</strong> {count === 1 ? 'nuovo messaggio' : 'nuovi messaggi'} non letti in{' '}
                <strong>{conversationName || 'una conversazione'}</strong>.
              </>
            ) : (
              <>
                <strong>{senderName || 'Un freediver'}</strong> ti ha scritto un nuovo messaggio.
              </>
            )}
          </Text>
          {messagePreview && (
            <Container style={card}>
              {isGroup && senderName && <Text style={cardMeta}>{senderName}</Text>}
              <Text style={cardText}>“{messagePreview}”</Text>
            </Container>
          )}
          <Button style={button} href={`${SITE_URL}/chat/${conversationId}`}>
            Apri la conversazione
          </Button>
          <Text style={footer}>— Il team Apnea Mate</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ChatUnreadMessagesEmail,
  subject: (d: any) =>
    d.isGroup
      ? `${d.unreadCount ?? 1} nuovi messaggi in ${d.conversationName || 'chat'}`
      : `Nuovo messaggio da ${d.senderName || 'un freediver'}`,
  displayName: 'Chat unread messages',
  previewData: {
    recipientName: 'Marco',
    senderName: 'Luca',
    conversationName: 'Sessione Y-40',
    conversationId: 'abc',
    messagePreview: 'Ciao! Ci sei domani per la sessione?',
    unreadCount: 3,
    isGroup: false,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { width: '180px', height: 'auto', margin: '0 0 24px', display: 'block' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#233a6b', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const card = { background: '#eff6ff', borderRadius: '12px', padding: '16px', margin: '16px 0', borderLeft: '4px solid #3f66e8' }
const cardMeta = { fontSize: '13px', color: '#64748b', margin: '0 0 6px', fontWeight: 'bold' as const }
const cardText = { fontSize: '15px', color: '#1e3a8a', margin: '0', fontStyle: 'italic' as const }
const button = { backgroundColor: '#3f66e8', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '18px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' as const, margin: '8px 0 24px' }
const footer = { fontSize: '13px', color: '#64748b', margin: '24px 0 0' }
