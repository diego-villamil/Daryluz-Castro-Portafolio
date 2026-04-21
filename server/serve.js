/**
 * 🚀 Servidor Express + Brevo SMTP
 * 
 * Instrucciones de uso:
 * 1. npm install
 * 2. Configurar archivo .env
 * 3. node server.js
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// =============== MIDDLEWARE ===============
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(cors());

// =============== VALIDACIÓN DE CONFIGURACIÓN ===============
if (!process.env.BREVO_EMAIL || !process.env.BREVO_PASSWORD) {
    console.error('❌ ERROR: Falta configurar BREVO_EMAIL y BREVO_PASSWORD en .env');
    process.exit(1);
}

// =============== CONFIGURAR TRANSPORTER BREVO ===============
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // TLS
    auth: {
        user: process.env.BREVO_EMAIL,
        pass: process.env.BREVO_PASSWORD
    }
});

// Verificar conexión
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Error SMTP:', error);
    } else {
        console.log('✅ Servidor SMTP conectado correctamente');
    }
});

// =============== RUTA: ENVIAR EMAIL ===============
app.post('/api/send-email', async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validación de campos
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
            error: 'Todos los campos son requeridos' 
        });
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            error: 'Email inválido' 
        });
    }

    // Sanitizar mensaje (prevenir inyecciones)
    const sanitizedMessage = message
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    try {
        // ========== EMAIL 1: Notificación al dueño ==========
        await transporter.sendMail({
            from: process.env.BREVO_EMAIL,
            to: process.env.RECEIVER_EMAIL || process.env.BREVO_EMAIL,
            replyTo: email, // Permitir responder directamente al contacto
            subject: `[NUEVO CONTACTO] ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #e94560; border-bottom: 2px solid #e94560; padding-bottom: 10px;">
                        📬 Nuevo Mensaje desde tu Portafolio
                    </h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong style="color: #333;">Nombre:</strong><br>${name}</p>
                        <p><strong style="color: #333;">Email:</strong><br><a href="mailto:${email}">${email}</a></p>
                        <p><strong style="color: #333;">Asunto:</strong><br>${subject}</p>
                    </div>

                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #e94560; border-radius: 4px; margin: 20px 0;">
                        <p><strong style="color: #333;">Mensaje:</strong></p>
                        <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">
                            ${sanitizedMessage}
                        </p>
                    </div>

                    <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #666; margin: 0;">
                            <strong>💡 Consejo:</strong> Puedes responder directamente a este email para contactar al usuario.
                        </p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Este mensaje fue generado automáticamente desde tu portafolio web
                    </p>
                </div>
            `
        });

        // ========== EMAIL 2: Confirmación al usuario ==========
        await transporter.sendMail({
            from: process.env.BREVO_EMAIL,
            to: email,
            subject: '✅ Hemos recibido tu mensaje',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #e94560; text-align: center;">
                        ✅ Mensaje Recibido
                    </h2>
                    
                    <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 16px; color: #333;">Hola <strong>${name}</strong>,</p>
                        <p style="color: #666; line-height: 1.8;">
                            Gracias por contactarme. He recibido tu mensaje y lo revisaré con atención.
                        </p>
                        <p style="color: #666; line-height: 1.8;">
                            Me pondré en contacto pronto para discutir tu proyecto.
                        </p>
                    </div>

                    <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #e94560; margin-top: 0;">Resumen de tu mensaje:</h3>
                        <p><strong>Asunto:</strong> ${subject}</p>
                        <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #e94560;">
                            <p style="white-space: pre-wrap; color: #555; margin: 0;">
                                ${sanitizedMessage.substring(0, 200)}${sanitizedMessage.length > 200 ? '...' : ''}
                            </p>
                        </div>
                    </div>

                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <div style="text-align: center; color: #999; font-size: 12px;">
                        <p>Si tienes más preguntas mientras tanto, no dudes en visitar mi portafolio:</p>
                        <a href="${process.env.WEBSITE_URL || '#'}" style="color: #e94560; text-decoration: none;">
                            Mi Portafolio Web
                        </a>
                    </div>

                    <p style="color: #999; font-size: 11px; text-align: center; margin-top: 30px;">
                        Este es un email automático. Por favor no respondas a este mensaje.
                    </p>
                </div>
            `
        });

        // ✅ Respuesta exitosa
        console.log(`✅ Email enviado: ${name} (${email})`);
        res.json({ 
            success: true, 
            message: 'Email enviado correctamente' 
        });

    } catch (error) {
        console.error('❌ Error al enviar email:', error.message);
        res.status(500).json({ 
            error: 'Error al enviar el email. Por favor intenta de nuevo.' 
        });
    }
});

// =============== RUTA: HEALTH CHECK ===============
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        brevoConfigured: !!process.env.BREVO_EMAIL
    });
});

// =============== RUTAS ESTÁTICAS ===============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// =============== MANEJO DE ERRORES 404 ===============
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// =============== INICIAR SERVIDOR ===============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════════════════╗
    ║  🚀 Servidor ejecutándose                             ║
    ║  📍 http://localhost:${PORT}                            ║
    ║  📧 Email: ${process.env.BREVO_EMAIL}                   ║
    ║  ✅ Estado: Listo para recibir mensajes               ║
    ╚════════════════════════════════════════════════════════╝
    `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Error no capturado:', reason);
});