import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
} from "@react-email/components"

interface AccountDeletionConfirmationEmailProps {
  email: string
}

export function AccountDeletionConfirmationEmail({
  email,
}: AccountDeletionConfirmationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#fdfcfa", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, padding: "40px 48px", border: "1px solid #e8e0d4" }}>
          <Heading style={{ fontSize: 22, fontWeight: 700, color: "#1a1208", marginBottom: 8 }}>
            Your account has been deleted
          </Heading>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Hi {email},
          </Text>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            We have received your account deletion request. Your Håndværk Pro account has been
            deactivated immediately.
          </Text>
          <Section style={{ backgroundColor: "#fdf8f0", borderRadius: 8, padding: "16px 20px", margin: "24px 0", border: "1px solid #f0e4d0" }}>
            <Text style={{ margin: 0, color: "#8a7a62", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              What happens next
            </Text>
            <Text style={{ margin: "8px 0 0", color: "#1a1208", fontSize: 14 }}>
              All your data (customers, jobs, quotes, invoices) will be permanently deleted after a
              30-day grace period in accordance with our data retention policy and GDPR requirements.
            </Text>
          </Section>
          <Hr style={{ borderColor: "#e8e0d4" }} />
          <Text style={{ color: "#8a7a62", fontSize: 13 }}>
            If this was a mistake, contact us within 30 days to restore your account.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
