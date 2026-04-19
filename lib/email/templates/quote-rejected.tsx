import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from "@react-email/components"

interface QuoteRejectedEmailProps {
  customerName: string
  quoteNumber: string
  companyName: string
}

export function QuoteRejectedEmail({
  customerName,
  quoteNumber,
  companyName,
}: QuoteRejectedEmailProps) {
  return (
    <Html lang="da">
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#fdfcfa", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, padding: "40px 48px", border: "1px solid #e8e0d4" }}>
          <Heading style={{ fontSize: 22, fontWeight: 700, color: "#1a1208", marginBottom: 8 }}>
            Ang. tilbud {quoteNumber}
          </Heading>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Kære {customerName},
          </Text>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Vi har modtaget din afvisning af tilbud {quoteNumber}. Tak for at du tog dig tid til at kigge på det.
          </Text>
          <Text style={{ color: "#5a4e3a", fontSize: 15 }}>
            Har du feedback til, hvad vi kunne have gjort anderledes? Din tilbagemelding hjælper os med at blive bedre. Du er altid velkommen til at kontakte os, hvis du har spørgsmål eller ønsker et nyt tilbud på et andet tidspunkt.
          </Text>
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
