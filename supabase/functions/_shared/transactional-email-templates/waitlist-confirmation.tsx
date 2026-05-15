/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Img,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = 'https://apnea-mate-pro.com'

const WaitlistConfirmationEmail = () => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Sei nella lista d'attesa di Apnea Mate</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png" alt="Apnea Mate" width="180" style={logo} />
        <Heading style={h1}>Sei nella lista! 🤿</Heading>
        <Text style={text}>
          Grazie per esserti iscritto alla lista d'attesa di{' '}
          <strong>Apnea Mate</strong>.
        </Text>
        <Text style={text}>
          Ti avviseremo via email il giorno del lancio, il{' '}
          <strong>22 maggio 2026</strong>, così sarai tra i primi a entrare nella
          community e a connetterti con altri apneisti.
        </Text>
        <Text style={text}>
          Nel frattempo, ecco cosa potrai fare con Apnea Mate:
        </Text>
        <Text style={list}>
          🤿 Trovare sessioni di apnea vicino a te
          <br />
          👥 Creare o unirti a gruppi e club
          <br />
          📊 Tracciare i tuoi allenamenti e progressi
        </Text>
        <Button style={button} href={SITE_URL}>
          Visita Apnea Mate
        </Button>
        <Text style={tagline}>Connect. Dive. Explore.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistConfirmationEmail,
  subject: "Sei nella lista d'attesa di Apnea Mate 🌊",
  displayName: 'Waitlist confirmation',
  previewData: {},
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { width: '180px', height: 'auto', margin: '0 0 24px', display: 'block' as const }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#233a6b',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const list = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: '1.9',
  margin: '0 0 28px',
}
const button = {
  backgroundColor: '#3f66e8',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '18px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const tagline = {
  fontSize: '12px',
  color: '#3fbdc8',
  margin: '28px 0 0',
  fontStyle: 'italic' as const,
}