import { Resend } from "resend";

const resend = new Resend("re_dummy_fake_token_for_test");

async function test() {
    console.log("Probando...");
    const res = await resend.emails.send({
        from: 'reservas@clubgentlemanformen.com',
        to: 'heidernavarro@yopmail.com', 
        subject: 'Test',
        html: '<p>Test</p>'
    });

    console.log("Returned:", res);
}

test();