/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = 'https://apneamate.com'
const LOGO = 'https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png'


interface Props { recipientName?: string; groupName?: string; groupId?: string; groupLocation?: string }

const GroupRequestApprovedEmail = ({ recipientName, groupName, groupId, groupLocation }: Props) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Benvenuto nel gruppo!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO} alt="Apnea Mate" width="180" style={logo} />
        <Heading style={h1}>Benvenuto nel gruppo! 🎉</Heading>
        <Text style={text}>Ciao {recipientName || "freediver"}!</Text>
        <Text style={text}>La tua richiesta di partecipazione è stata <strong>approvata</strong>.</Text>
        <Container style={cardSuccess}>
          <Text style={cardTitle}>{groupName}</Text>
          {groupLocation && <Text style={cardMeta}>📍 {groupLocation}</Text>}
        </Container>
        <Text style={text}>Ora puoi vedere le sessioni del gruppo e partecipare alle attività!</Text>
        <Button style={button} href={`${SITE_URL}/groups/${groupId}`}>Vai al gruppo</Button>
        <Text style={footer}>Buone immersioni 🌊<br/>— Il team Apnea Mate</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: GroupRequestApprovedEmail,
  subject: (d: any) => `Sei stato accettato in "${d.groupName || "il gruppo"}"! 🎉`,
  displayName: "Group request approved",
  previewData: { recipientName: "Luca", groupName: "Apnea Milano", groupId: "abc", groupLocation: "Milano" },
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
