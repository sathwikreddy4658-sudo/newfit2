// API Route for sending order confirmation emails via Hostinger SMTP
// This runs on your server/hosting and uses Nodemailer

import nodemailer from 'nodemailer';
import { emailConfig, getOrderEmailTemplate, getOrderEmailText } from './emailTemplate.js';

// SMTP Configuration - Uses environment variables only
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      orderId,
      customerEmail,
      customerName,
      totalPrice,
      orderItems,
      address,
      paymentMethod,
      createdAt,
    } = req.body;

    // Format order date
    const orderDate = new Date(createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Generate email HTML and text using templates
    const emailHtml = getOrderEmailTemplate({
      customerName,
      orderId,
      orderDate,
      paymentMethod,
      totalPrice,
      orderItems,
      address,
    });

    const emailText = getOrderEmailText({
      customerName,
      orderId,
      orderDate,
      paymentMethod,
      totalPrice,
      orderItems,
      address,
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.storeEmail}>`,
      to: customerEmail,
      replyTo: emailConfig.storeEmail,
      subject: emailConfig.subjectTemplate.replace('{orderId}', orderId.slice(0, 8)),
      html: emailHtml,
      text: emailText,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    });

    console.log('Email sent:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
};
