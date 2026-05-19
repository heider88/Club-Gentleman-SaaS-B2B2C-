import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface BookingReminderProps {
    customerName: string;
    serviceName: string;
    barberName: string;
    time: string;
}

export const BookingReminder = ({
    customerName,
    serviceName,
    barberName,
    time,
}: BookingReminderProps) => {
    return (
        <Html>
            <Head />
            <Preview>¡Tu cita en Club Gentleman es en menos de 2 horas!</Preview>
            <Tailwind>
                <Body className="bg-[#121212] my-auto mx-auto font-sans text-white px-2">
                    <Container className="border border-solid border-[#ffffff20] rounded-[24px] my-[40px] mx-auto p-[40px] max-w-[500px] bg-[#1a1a1a]">
                        <Section className="mt-[20px] text-center">
                            {/* Logo Placeholder */}
                            <Text className="text-[#d946ef] text-[24px] font-bold tracking-widest uppercase m-0">
                                Club Gentleman
                            </Text>
                            <Text className="text-[#a1a1aa] text-[12px] tracking-[0.2em] m-0 mt-1">
                                FOR MEN
                            </Text>
                        </Section>

                        <Heading className="text-white text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            <strong>{customerName}</strong>, ¡te esperamos pronto!
                        </Heading>

                        <Text className="text-[#a1a1aa] text-[15px] leading-[24px]">
                            Este es un recordatorio automático. Tu cita está programada en menos de dos horas:
                        </Text>

                        <Section className="bg-[#000000] rounded-xl border border-[#ffffff10] p-6 my-6 text-center">
                            <Text className="m-0 text-[#d946ef] text-[20px] font-bold">
                                Hoy a las {time}
                            </Text>
                            <Text className="m-0 mt-2 text-white text-[16px]">
                                {serviceName}
                            </Text>
                            <Text className="m-0 mt-1 text-[#a1a1aa] text-[14px]">
                                con {barberName}
                            </Text>
                        </Section>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Text className="text-[#a1a1aa] text-[14px]">
                                📍 <strong>Dirección:</strong> Cll 72 sur #14-80, Bogotá.
                            </Text>
                        </Section>

                        <Text className="text-[#666666] text-[12px] leading-[24px] mt-[40px] text-center">
                            Si tienes algún inconveniente o necesitas reprogramar, por favor comunícate con nosotros inmediatamente.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default BookingReminder;
