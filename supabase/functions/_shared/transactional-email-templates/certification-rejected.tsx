/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = 'https://apneamate.com'
const LOGO = 'https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png'


interface Props { recipientName?: string; reason?: string }

const CertificationRejectedEmail = ({ recipientName, reason }: Props) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Aggiornamento sulla tua certificazione</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO} alt="Apnea Mate" width="180" style={logo} />
        <Heading style={h1}>Certificazione non approvata</Heading>
        <Text style={text}>Ciao {recipientName || "freediver"},</Text>
        <Text style={text}>Purtroppo la tua richiesta di certificazione non è stata approvata.</Text>
        {reason && (
          <Container style={cardError}>
            <Text style={cardMeta}><strong>Motivo:</strong> {reason}</Text>
          </Container>
        )}
        <Text style={text}>Puoi inviare una nuova richiesta con documentazione aggiornata. Suggerimenti:</Text>
        <Text style={text}>
          • Assicurati che il documento sia leggibile<br/>
          • Verifica che il nome corrisponda al tuo profilo<br/>
          • Includi un documento valido e non scaduto
        </Text>
        <Button style={button} href={`${SITE_URL}/settings`}>Riprova</Button>
        <Text style={footer}>— Il team Apnea Mate</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CertificationRejectedEmail,
  subject: "Aggiornamento sulla tua certificazione",
  displayName: "Certification rejected",
  previewData: { recipientName: "Marco", reason: "Documento non leggibile" },
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
