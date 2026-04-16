import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Button,
  Section,
} from "@react-email/components"

interface QuoteSentEmailProps {
  customerName: string
  quoteNumber: string
  validUntil?: string
  shareUrl: string
}

export function QuoteSentEmail({
  customerName,
  quoteNumber,
  validUntil,
  shareUrl,
}: QuoteSentEmailProps) {
  return (
    <Html lang="da">
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#fdfcfa", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, padding: "40px 48px", border: "1px solid #e8e0d4" }}>
          <Heading style={{ fontSize: 22, fontWeight: 700, color: "#1a1208", marginBottom: 8 }}>
            Tilbud {quoteNumber}
          </Heading>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Kære {customerName},
          </Text>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Vi har sendt dig et tilbud. Du kan se og acceptere tilbuddet via knappen nedenfor.
          </Text>
          {validUntil && (
            <Text style={{ color: "#5a4e3a", fontSize: 14 }}>
              Tilbuddet er gyldigt til: <strong>{validUntil}</strong>
            </Text>
          )}
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button
              href={shareUrl}
              style={{
                backgroundColor: "#c87a1a",
                color: "#ffffff",
                padding: "14px 28px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Se tilbud
            </Button>
          </Section>
          <Hr style={{ borderColor: "#e8e0d4" }} />
          <Text style={{ color: "#8a7a62", fontSize: 13 }}>
            Du kan acceptere eller afvise tilbuddet direkte i linket ovenfor.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
