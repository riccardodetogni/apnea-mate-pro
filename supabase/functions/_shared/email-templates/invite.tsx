/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Sei stato invitato su Apnea Mate</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>🌊 Apnea Mate</Text>
        <Heading style={h1}>Sei stato invitato</Heading>
        <Text style={text}>
          Sei stato invitato a unirti ad{' '}
          <Link href={siteUrl} style={link}>
            <strong>Apnea Mate</strong>
          </Link>
          . Clicca il bottone qui sotto per accettare l'invito e creare il tuo account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accetta Invito
        </Button>
        <Text style={footer}>
          Se non ti aspettavi questo invito, puoi ignorare questa email.
        </Text>
        <Text style={tagline}>Connect. Dive. Explore.</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: '#233a6b', margin: '0 0 24px', letterSpacing: '-0.3px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#233a6b', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#3f66e8', textDecoration: 'underline' }
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
const footer = { fontSize: '13px', color: '#9ca3af', margin: '30px 0 0' }
const tagline = { fontSize: '12px', color: '#3fbdc8', margin: '20px 0 0', fontStyle: 'italic' as const }
