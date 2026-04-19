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

interface InvoicePaidThankyouEmailProps {
  customerName: string
  invoiceNumber: string
  companyName: string
  googleReviewUrl?: string
}

export function InvoicePaidThankyouEmail({
  customerName,
  invoiceNumber,
  companyName,
  googleReviewUrl,
}: InvoicePaidThankyouEmailProps) {
  return (
    <Html lang="da">
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#fdfcfa", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, padding: "40px 48px", border: "1px solid #e8e0d4" }}>
          <Heading style={{ fontSize: 22, fontWeight: 700, color: "#1a1208", marginBottom: 8 }}>
            Tak for betalingen
          </Heading>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Kære {customerName},
          </Text>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Tak for din betaling af faktura {invoiceNumber}. Vi sætter stor pris på din tillid og ser frem til at hjælpe dig igen.
          </Text>
          {googleReviewUrl && (
            <>
              <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
                Hvis du er tilfreds med vores arbejde, ville vi sætte stor pris på en anmeldelse. Det tager kun et minut og hjælper os enormt.
              </Text>
              <Section style={{ textAlign: "center", margin: "32px 0" }}>
                <Button
                  href={googleReviewUrl}
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
                  Skriv en anmeldelse
                </Button>
              </Section>
            </>
          )}
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
