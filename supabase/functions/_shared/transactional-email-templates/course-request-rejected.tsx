/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

import { SITE_URL, LOGO_URL as LOGO, SUPPORT_EMAIL } from '../email-env.ts'

interface Props { recipientName?: string; courseTitle?: string; courseDate?: string; courseLocation?: string }

const CourseRequestRejectedEmail = ({ recipientName, courseTitle, courseDate, courseLocation }: Props) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Iscrizione al corso non approvata</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO} alt="Apnea Mate" width="180" style={logo} />
        <Heading style={h1}>Iscrizione non approvata</Heading>
        <Text style={text}>Ciao {recipientName || "freediver"},</Text>
        <Text style={text}>Purtroppo la tua iscrizione al corso non è stata approvata:</Text>
        <Container style={cardError}>
          <Text style={cardTitle}>{courseTitle}</Text>
          {courseLocation && <Text style={cardMeta}>📍 {courseLocation}</Text>}
          {courseDate && <Text style={cardMeta}>📅 {courseDate}</Text>}
        </Container>
        <Text style={text}>Esplora altri corsi disponibili nella community!</Text>
        <Button style={button} href={`${SITE_URL}/community`}>Esplora corsi</Button>
        <Text style={footer}>— Il team Apnea Mate</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CourseRequestRejectedEmail,
  subject: (d: any) => `Iscrizione non approvata per "${d.courseTitle || "il corso"}"`,
  displayName: "Course request rejected",
  previewData: { recipientName: "Luca", courseTitle: "Corso Apnea Outdoor Liv. 1", courseDate: "15-17 giugno 2026", courseLocation: "Y-40" },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { width: '180px', height: 'auto', margin: '0 0 24px', display: 'block' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#233a6b', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const cardError = { background: '#fef2f2', borderRadius: '12px', padding: '16px', margin: '16px 0', borderLeft: '4px solid #dc2626' }
const cardTitle = { fontSize: '17px', fontWeight: 'bold' as const, color: '#1e3a8a', margin: '0 0 8px' }
const cardMeta = { fontSize: '14px', color: '#64748b', margin: '0' }
const button = { backgroundColor: '#3f66e8', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '18px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' as const, margin: '8px 0 24px' }
const footer = { fontSize: '13px', color: '#64748b', margin: '24px 0 0' }