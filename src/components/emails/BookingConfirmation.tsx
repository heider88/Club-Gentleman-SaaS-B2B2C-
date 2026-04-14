import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Row,
    Column,
    Button
} from "@react-email/components";
import * as React from "react";

interface BookingConfirmationProps {
    customerName: string;
    serviceName: string;
    barberName: string;
    date: string;
    time: string;
}

export const BookingConfirmation = ({
    customerName,
    serviceName,
    barberName,
    date,
    time
}: BookingConfirmationProps) => {
    const previewText = `Tu reserva para ${serviceName} ha sido confirmada.`;

    const mapUrl = "https://www.google.com/maps/search/?api=1&query=Calle+72+sur+%23+14-80,+Bogotá";

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header: Logo & Title */}
                    <Section style={headerSection}>
                        <Text style={logoText}>C L U B   G E N T L E M A N</Text>
                        <Text style={logoSubText}>FOR MEN</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={contentSection}>
                        <Heading style={heading}>¡Reserva Confirmada!</Heading>
                        <Text style={paragraph}>
                            Hola <strong style={{ color: "#ffffff" }}>{customerName}</strong>,
                        </Text>
                        <Text style={paragraph}>
                            Tu lugar ha sido reservado con éxito. A continuación te presentamos los detalles de tu cita:
                        </Text>

                        {/* Card Component */}
                        <Section style={card}>
                            <Row style={cardRow}>
                                <Column style={{ width: "30%" }}>
                                    <Text style={cardLabel}>Servicio:</Text>
                                </Column>
                                <Column>
                                    <Text style={cardValue}>{serviceName}</Text>
                                </Column>
                            </Row>
                            <Hr style={cardDivider} />
                            <Row style={cardRow}>
                                <Column style={{ width: "30%" }}>
                                    <Text style={cardLabel}>Barbero:</Text>
                                </Column>
                                <Column>
                                    <Text style={cardValue}>{barberName}</Text>
                                </Column>
                            </Row>
                            <Hr style={cardDivider} />
                            <Row style={cardRow}>
                                <Column style={{ width: "30%" }}>
                                    <Text style={cardLabel}>Fecha:</Text>
                                </Column>
                                <Column>
                                    <Text style={cardValue}>{date}</Text>
                                </Column>
                            </Row>
                            <Hr style={cardDivider} />
                            <Row style={cardRow}>
                                <Column style={{ width: "30%" }}>
                                    <Text style={cardLabel}>Hora:</Text>
                                </Column>
                                <Column>
                                    <Text style={cardValue}>{time}</Text>
                                </Column>
                            </Row>
                        </Section>

                        <Text style={paragraph}>
                            Te esperamos en nuestra sede física. Si necesitas reprogramar, por favor contáctanos con anticipación.
                        </Text>

                        <Section style={locationSection}>
                            <Text style={locationText}>
                                📍 <strong>Dirección:</strong> Calle 72 sur # 14-80, Bogotá
                            </Text>
                            <Button href={mapUrl} style={button}>
                                Ver en Google Maps
                            </Button>
                        </Section>

                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Club Gentleman For Men. Todos los derechos reservados.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles for Urban Dark aesthetics
const main = {
    backgroundColor: "#0a0a0a",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    width: "580px",
    maxWidth: "100%",
};

const headerSection = {
    padding: "32px 20px",
    textAlign: "center" as const,
    borderBottom: "1px solid #262626",
};

const logoText = {
    fontSize: "24px",
    lineHeight: "24px",
    fontWeight: "900",
    color: "#ffffff",
    margin: "0",
    letterSpacing: "4px",
};

const logoSubText = {
    fontSize: "10px",
    lineHeight: "10px",
    fontWeight: "700",
    color: "#a3a3a3",
    margin: "8px 0 0 0",
    letterSpacing: "8px",
};

const contentSection = {
    padding: "40px 20px",
};

const heading = {
    fontSize: "28px",
    lineHeight: "36px",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 24px 0",
};

const paragraph = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#a3a3a3",
    margin: "0 0 20px 0",
};

const card = {
    backgroundColor: "#171717",
    border: "1px solid #262626",
    borderRadius: "12px",
    padding: "24px",
    margin: "32px 0",
};

const cardRow = {
    margin: "0",
};

const cardLabel = {
    fontSize: "14px",
    color: "#737373",
    margin: "0",
    fontWeight: "600",
};

const cardValue = {
    fontSize: "14px",
    color: "#e5e5e5",
    margin: "0",
    fontWeight: "600",
    textAlign: "right" as const,
};

const cardDivider = {
    borderColor: "#262626",
    margin: "16px 0",
};

const locationSection = {
    textAlign: "center" as const,
    marginTop: "40px",
    padding: "24px",
    backgroundColor: "#171717",
    border: "1px solid #262626",
    borderRadius: "12px",
};

const locationText = {
    fontSize: "15px",
    color: "#e5e5e5",
    margin: "0 0 16px 0",
};

const button = {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    color: "#0a0a0a",
    fontSize: "15px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    width: "100%",
    padding: "14px 20px",
    fontWeight: "700",
};

const footer = {
    padding: "0 20px",
    textAlign: "center" as const,
};

const footerText = {
    fontSize: "12px",
    color: "#737373",
    lineHeight: "20px",
};

export default BookingConfirmation;
