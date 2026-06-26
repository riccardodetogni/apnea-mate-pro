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

import { SITE_URL, LOGO_URL, SUPPORT_EMAIL } from '../email-env.ts'

const LaunchAnnouncementIt = () => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Apnea Mate è aperto — entra nella prima ondata 🌊</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={LOGO_URL}
          alt="Apnea Mate"
          width="180"
          style={logo}
        />
        <Heading style={h1}>Ciao,</Heading>
        <Text style={text}>
          Sono ufficialmente aperte le iscrizioni ad <strong>Apnea Mate</strong>! 🎉
        </Text>
        <Text style={text}>
          Un'app per chi pratica apnea, pensata per rendere più semplice allenarsi
          in sicurezza insieme al resto della community. Un posto solo per trovare
          <strong> buddy, gruppi, spot e scuole</strong>.
        </Text>
        <Text style={text}>
          Che tu abbia esperienza o stia iniziando, che insegni apnea o gestisca
          una scuola, se fai parte di questo mondo a qualsiasi livello, iscriviti
          su <strong>apneamate.com</strong> per entrare nella prima ondata 🌊
        </Text>
        <Button style={button} href={SITE_URL}>
          Vai su apneamate.com
        </Button>
        <Text style={text}>
          È un progetto appena partito, nato dal basso e portato avanti con tempo,
          lavoro ed energie per costruire qualcosa di bello per tutta la community.
          Se mentre la provi trovi qualcosa che non funziona come dovrebbe,
          scrivici a <strong>support@apneamate.com</strong> (o rispondi
          direttamente a questa email) per dircelo. Ogni segnalazione ci aiuta
          a farla crescere.
        </Text>
        <Text style={text}>L'apnea non si fa da soli. 💙</Text>
        <Text style={signoff}>Il team di Apnea Mate</Text>
        <Text style={tagline}>Connect. Dive. Explore.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LaunchAnnouncementIt,
  subject: 'Apnea Mate è aperto 🌊 Entra nella prima ondata',
  displayName: 'Launch announcement (IT)',
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