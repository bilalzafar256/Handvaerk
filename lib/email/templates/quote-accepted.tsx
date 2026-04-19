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

interface QuoteAcceptedEmailProps {
  customerName: string
  quoteNumber: string
  companyName: string
}

export function QuoteAcceptedEmail({
  customerName,
  quoteNumber,
  companyName,
}: QuoteAcceptedEmailProps) {
  return (
    <Html lang="da">
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#fdfcfa", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, padding: "40px 48px", border: "1px solid #e8e0d4" }}>
          <Heading style={{ fontSize: 22, fontWeight: 700, color: "#1a1208", marginBottom: 8 }}>
            Tak for din accept
          </Heading>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Kære {customerName},
          </Text>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Tak fordi du har accepteret tilbud {quoteNumber}. Vi glæder os til at komme i gang med opgaven og vil kontakte dig snarest for at aftale nærmere.
          </Text>
          <Section style={{ backgroundColor: "#fdf8f0", borderRadius: 8, padding: "16px 20px", margin: "24px 0", border: "1px solid #f0e4d0" }}>
            <Text style={{ margin: 0, color: "#8a7a62", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tilbudsnummer
            </Text>
            <Text style={{ margin: "4px 0 0", color: "#1a1208", fontSize: 16, fontWeight: 700 }}>
              {quoteNumber}
            </Text>
          </Section>
          <Hr style={{ borderColor: "#e8e0d4" }} />
          <Text style={{ color: "#8a7a62", fontSize: 13 }}>
            Med venlig hilsen<br />
            {companyName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
