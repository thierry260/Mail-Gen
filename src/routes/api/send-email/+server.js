import nodemailer from "nodemailer";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // Parse the form data sent from the frontend
    const { name, email, messageType, message } = await request.json();

    // Configure the email transport using Nodemailer
    const transporter = nodemailer.createTransport({
      host: "smtp.smtpserver.com", // Replace with your SMTP server
      port: 587, // Replace with the correct port, e.g., 587 for TLS
      secure: false, // Set to true if using SSL (port 465), false for TLS (port 587)
      auth: {
        user: "m.vereijken@hotmail.nl", // Your SMTP username
        pass: "7@jMYZ3L8B6F@Ht", // Your SMTP password
      },
      tls: {
        rejectUnauthorized: false, // For testing only, don't use in production
      },
    });

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