export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, captchaToken } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!captchaToken) {
      return res.status(400).json({ error: 'Captcha requerido' });
    }

    // Validación opcional de reCAPTCHA en servidor
    if (process.env.RECAPTCHA_SECRET_KEY) {
      const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken
        })
      });

      const captchaData = await captchaRes.json();

      if (!captchaData.success) {
        return res.status(400).json({ error: 'reCAPTCHA inválido' });
      }
    }

    const esc = (str) =>
      String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const receiverEmail = process.env.BREVO_RECEIVER_EMAIL;
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!senderEmail || !receiverEmail || !brevoApiKey) {
      return res.status(500).json({ error: 'Faltan variables de entorno del servidor' });
    }

    const sendEmail = async ({ to, subject, htmlContent, replyTo }) => {
      const payload = {
        sender: { name: 'Portafolio Dariluz Morillo', email: senderEmail },
        to,
        subject,
        htmlContent
      };

      if (replyTo) payload.replyTo = replyTo;

      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify(payload)
      });

      if (!brevoRes.ok) {
        const errText = await brevoRes.text();
        throw new Error(`Brevo error: ${brevoRes.status} ${errText}`);
      }

      return brevoRes.json();
    };

    await sendEmail({
      to: [{ email: receiverEmail, name: 'Dariluz Morillo' }],
      replyTo: { email, name },
      subject: `[Portafolio] Nuevo mensaje: ${subject}`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;border-radius:10px;">
          <h2 style="color:#8b5fbf;border-bottom:2px solid #8b5fbf;padding-bottom:10px;">
            Nuevo mensaje desde tu portafolio
          </h2>
          <div style="background:#fff;padding:20px;border-radius:8px;margin:20px 0;">
            <p><strong>Nombre:</strong> ${esc(name)}</p>
            <p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
            <p><strong>Asunto:</strong> ${esc(subject)}</p>
          </div>
          <div style="background:#f9f9f9;padding:15px;border-left:4px solid #8b5fbf;border-radius:4px;margin:20px 0;">
            <p><strong>Mensaje:</strong></p>
            <p style="color:#555;line-height:1.6;white-space:pre-wrap;">${esc(message)}</p>
          </div>
        </div>`
    });

    await sendEmail({
      to: [{ email, name }],
      subject: 'Hemos recibido tu mensaje — Dariluz Morillo',
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;border-radius:10px;">
          <h2 style="color:#8b5fbf;text-align:center;">Mensaje recibido</h2>
          <div style="background:#fff;padding:30px;border-radius:8px;margin:20px 0;text-align:center;">
            <p>Hola <strong>${esc(name)}</strong>,</p>
            <p>Gracias por escribirme. Revisaré tu mensaje y te responderé pronto.</p>
          </div>
        </div>`
    });

    return res.status(200).json({ ok: true, message: 'Mensaje enviado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'No fue posible enviar el mensaje' });
  }
}