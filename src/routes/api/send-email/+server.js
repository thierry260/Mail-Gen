import nodemailer from "nodemailer";
import mailgunTransport from "nodemailer-mailgun-transport";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // Parse the form data sent from the frontend
    const { name, email, messageType, message } = await request.json();

    // Mailgun configuration options
    const mailgunAuth = {
      auth: {
        api_key: "32f94259c517140aa6044d8068fbdb9c-d010bdaf-3ddf5761", // Use your Mailgun API key
        domain: "mail.mailgen.nl", // Use your Mailgun domain (e.g., mail.mailgen.nl)
      },
    };

    // Create the Mailgun transport
    const transporter = nodemailer.createTransport(
      mailgunTransport(mailgunAuth)
    );

    // Email details
    const mailOptions = {
      from: '"Support Team" <support@mailgen.nl>', // sender address
      to: "support@mailgen.nl", // replace with your support email
      subject: `${messageType} from ${name}`,
      html: `
        <h1>${messageType}</h1>
        <p><strong>Naam:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Bericht:</strong> ${message}</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
