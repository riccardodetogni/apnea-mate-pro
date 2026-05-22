/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = 'https://apneamate.com'

const LaunchAnnouncementEn = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Apnea Mate is live — join the first wave 🌊</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png"
          alt="Apnea Mate"
          width="180"
          style={logo}
        />
        <Heading style={h1}>Hi,</Heading>
        <Text style={text}>
          Sign-ups for <strong>Apnea Mate</strong> are officially open! 🎉
        </Text>
        <Text style={text}>
          An app for freedivers, built to make training together safely easier
          for the whole community. One place to find{' '}
          <strong>buddies, groups, spots and schools</strong>.
        </Text>
        <Text style={text}>
          Whether you're experienced or just starting out, teaching freediving
          or running a school — if you're part of this world at any level, head
          to <strong>apneamate.com</strong> to join the first wave 🌊
        </Text>
        <Button style={button} href={SITE_URL}>
          Go to apneamate.com
        </Button>
        <Text style={text}>
          This is a project that just got started, born from the ground up and
          built with time, work and energy to create something good for the
          whole community. If you find something that doesn't work as it
          should while using it, drop us a line at{' '}
          <strong>support@apneamate.com</strong> (or just reply to this email)
          and let us know. Every report helps us grow.
        </Text>
        <Text style={text}>Freediving isn't done alone. 💙</Text>
        <Text style={signoff}>The Apnea Mate team</Text>
        <Text style={tagline}>Connect. Dive. Explore.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LaunchAnnouncementEn,
  subject: 'Apnea Mate is live 🌊 Join the first wave',
  displayName: 'Launch announcement (EN)',
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
const button = {
  backgroundColor: '#3f66e8',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '18px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block' as const,
  margin: '4px 0 24px',
}
const signoff = {
  fontSize: '15px',
  color: '#233a6b',
  fontWeight: 'bold' as const,
  margin: '20px 0 0',
}
const tagline = {
  fontSize: '12px',
  color: '#3fbdc8',
  margin: '28px 0 0',
  fontStyle: 'italic' as const,
}