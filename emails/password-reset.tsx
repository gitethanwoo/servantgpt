import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Logo } from './components/logo';

interface PasswordResetEmailProps {
  resetUrl?: string;
}

const PasswordResetEmail = ({
  resetUrl = 'https://servantgpt.com/reset-password?token=123',
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your ServantGPT password</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.content}>
            <div style={styles.logoWrapper}>
              <Logo />
            </div>
            
            <Heading style={styles.heading}>Reset your password</Heading>
            <Text style={styles.text}>
              We received a request to reset your password. Click the button below to create a new password.
              This link will expire in 1 hour.
            </Text>
            
            <Button style={styles.button} href={resetUrl}>
              Reset Password
            </Button>
            
            <div style={styles.urlSection}>
              <Text style={styles.urlIntro}>
                You can also copy and paste this URL into your browser:
              </Text>
              <Link href={resetUrl} style={styles.link}>
                {resetUrl}
              </Link>
            </div>
            
            <Text style={styles.disclaimer}>
              If you didn&apos;t request a password reset, you can safely ignore this email.
            </Text>
          </Section>
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Powered by ServantGPT
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

const styles = {
  body: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f5f5f7',
    margin: '0',
    padding: '0',
    color: '#333333',
  },
  container: {
    margin: '32px auto 0',
    padding: '20px',
  },
  logoWrapper: {
    marginBottom: '24px',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '32px 32px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: '600',
    marginTop: '72px',
    color: '#121212',
    textAlign: 'left' as const,
  },
  text: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#666',
    marginBottom: '20px',
    textAlign: 'left' as const,
  },
  button: {
    backgroundColor: '#000',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '4px',
    fontWeight: '500',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    marginBottom: '64px',
  },
  urlSection: {
    marginBottom: '32px',
  },
  urlIntro: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#666',
    marginBottom: '4px',
    textAlign: 'left' as const,
  },
  link: {
    color: '#000',
    textDecoration: 'underline',
    wordBreak: 'break-all' as const,
    display: 'block',
    fontSize: '14px',
    textAlign: 'left' as const,
  },
  disclaimer: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#666',
    marginBottom: '0',
    textAlign: 'left' as const,
    borderTop: '1px solid #eaeaea',
    paddingTop: '16px',
  },
  footer: {
    padding: '16px 0px',
    textAlign: 'center' as const,
    marginTop: '0',
  },
  footerText: {
    fontSize: '13px',
    color: '#888',
    margin: '0',
    textAlign: 'center' as const,
  },
}; 