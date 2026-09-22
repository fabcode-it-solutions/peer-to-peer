"use server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendResetEmailParams {
  to: string;
  token: string;
}

export async function sendPasswordResetEmail({
  to,
  token,
}: SendResetEmailParams) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: "Reset Your Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #000; margin-bottom: 20px;">Reset Your Password</h1>
            <p style="margin-bottom: 20px;">You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-bottom: 20px;">
              Reset Password
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour.
            </p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #000;">${resetUrl}</a>
          </p>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

interface SendInvoiceEmailParams {
  to: string;
  invoiceId: string;
  amount: number;
  note: string;
  storeName: string;
  invoiceUrl: string;
}

export async function sendInvoiceEmail({
  to,
  invoiceId,
  amount,
  note,
  storeName,
  invoiceUrl,
}: SendInvoiceEmailParams) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `New Invoice from Aovmax.io`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
            }
            .invoice-details {
              background-color: white;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
              font-weight: bold;
              font-size: 18px;
            }
            .label {
              color: #666;
            }
            .value {
              color: #333;
              font-weight: 500;
            }
            .note {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: white !important;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Invoice</h1>
              <p>You have received a new invoice</p>
            </div>

            <div class="invoice-details">
              <div class="detail-row">
                <span class="label">Invoice ID:</span>
                <span class="value">${invoiceId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Store:</span>
                <span class="value">${storeName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">$${amount.toFixed(2)}</span>
              </div>
            </div>

            ${
              note
                ? `
              <div class="note">
                <strong>Note:</strong><br/>
                ${note}
              </div>
            `
                : ""
            }

            <div style="text-align: center;">
              <a href="${invoiceUrl}" class="button">
                View Invoice
              </a>
            </div>

            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}
