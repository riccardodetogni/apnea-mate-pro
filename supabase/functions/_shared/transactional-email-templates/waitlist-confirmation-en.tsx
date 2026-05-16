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
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = 'https://apneamate.com'
const ICON_BUDDY = `${SITE_URL}/assets/icons/buddy.png`
const ICON_GRUPPI = `${SITE_URL}/assets/icons/gruppi.png`

const inlineIconStyle = { verticalAlign: 'middle' as const, marginRight: '8px', display: 'inline-block' as const }

const WaitlistConfirmationEmailEn = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're on the Apnea Mate waitlist</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png" alt="Apnea Mate" width="180" style={logo} />
        <Heading style={h1}>
          You're on the list!{' '}
          <Img src={ICON_BUDDY} alt="Buddy" width="24" height="24" style={inlineIconStyle} />
        </Heading>
        <Text style={text}>
          Thanks for joining the <strong>Apnea Mate</strong> waitlist.
        </Text>
        <Text style={text}>
          We'll email you on launch day, <strong>May 22, 2026</strong>, so you'll
          be among the first to step into the community and connect with other
          freedivers.
        </Text>
        <Text style={text}>
          In the meantime, here's what you'll be able to do with Apnea Mate:
        </Text>
        <Text style={list}>
          <Img src={ICON_BUDDY} alt="" width="20" height="20" style={inlineIconStyle} />
          Find freediving sessions near you
          <br />
          <Img src={ICON_GRUPPI} alt="" width="20" height="20" style={inlineIconStyle} />
          Create or join groups and clubs
          <br />
          📊 Track your training and progress
        </Text>
        <Button style={button} href={SITE_URL}>
          Visit Apnea Mate
        </Button>
        <Text style={tagline}>Connect. Dive. Explore.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistConfirmationEmailEn,
  subject: "You're on the Apnea Mate waitlist 🌊",
  displayName: 'Waitlist confirmation (EN)',
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