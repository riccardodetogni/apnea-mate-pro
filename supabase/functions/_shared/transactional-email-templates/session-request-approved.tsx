/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = 'https://apneamate.com'
const LOGO = 'https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png'
const ICON_SPOT = `${SITE_URL}/assets/icons/spot.png`
const inlineIcon = { verticalAlign: 'middle' as const, marginRight: '6px', display: 'inline-block' as const }


interface Props { recipientName?: string; sessionTitle?: string; sessionId?: string; spotName?: string; sessionDate?: string }

const SessionRequestApprovedEmail = ({ recipientName, sessionTitle, sessionId, spotName, sessionDate }: Props) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Richiesta approvata!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO} alt="Apnea Mate" width="180" style={logo} />
        <Heading style={h1}>Richiesta approvata! 🎉</Heading>
        <Text style={text}>Ciao {recipientName || "freediver"}!</Text>
        <Text style={text}>La tua richiesta di partecipazione è stata <strong>approvata</strong>!</Text>
        <Container style={cardSuccess}>
          <Text style={cardTitle}>{sessionTitle}</Text>
          {spotName && (
            <Text style={cardMeta}>
              <Img src={ICON_SPOT} alt="" width="14" height="14" style={inlineIcon} />
              {spotName}
            </Text>
          )}
          {sessionDate && <Text style={cardMeta}>📅 {sessionDate}</Text>}
        </Container>
        <Text style={text}>Non dimenticare l'attrezzatura e arriva puntuale!</Text>
        <Button style={button} href={`${SITE_URL}/sessions/${sessionId}`}>Vedi sessione</Button>
        <Text style={footer}>Buone immersioni 🌊<br/>— Il team Apnea Mate</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SessionRequestApprovedEmail,
  subject: (d: any) => `Sei stato approvato per "${d.sessionTitle || "la sessione"}"! 🎉`,
  displayName: "Session request approved",
  previewData: { recipientName: "Luca", sessionTitle: "Apnea profonda Y-40", sessionId: "abc", spotName: "Y-40", sessionDate: "sabato 1 giugno, 10:00" },
} satisfies TemplateEntry


const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { width: '180px', height: 'auto', margin: '0 0 24px', display: 'block' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#233a6b', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const card = { background: '#eff6ff', borderRadius: '12px', padding: '16px', margin: '16px 0', borderLeft: '4px solid #3f66e8' }
const cardSuccess = { background: '#f0fdf4', borderRadius: '12px', padding: '16px', margin: '16px 0', borderLeft: '4px solid #16a34a' }
const cardError = { background: '#fef2f2', borderRadius: '12px', padding: '16px', margin: '16px 0', borderLeft: '4px solid #dc2626' }
const cardTitle = { fontSize: '17px', fontWeight: 'bold' as const, color: '#1e3a8a', margin: '0 0 8px' }
const cardMeta = { fontSize: '14px', color: '#64748b', margin: '0' }
const button = { backgroundColor: '#3f66e8', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '18px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' as const, margin: '8px 0 24px' }
const footer = { fontSize: '13px', color: '#64748b', margin: '24px 0 0' }
