// API Route for sending order emails
// Primary: Uses Hostinger SMTP if credentials are available
// Fallback: Proxies to Firebase Cloud Functions if SMTP is not configured

import nodemailer from 'nodemailer';
import { emailConfig, getOrderEmailTemplate, getOrderEmailText, getShippedEmailTemplate, getDeliveredEmailTemplate } from './emailTemplate.js';

// Check if SMTP credentials are available
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const HAS_SMTP = SMTP_USER && SMTP_PASS;

// SMTP Configuration - Only if credentials available
let transporter = null;
if (HAS_SMTP) {
  transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

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
      emailType = 'confirmation', // 'confirmation', 'shipped', or 'delivered'
      trackingNumber,
      carrierName,
      estimatedDeliveryDate,
    } = req.body;

    // Validate required fields
    if (!orderId || !customerEmail || !customerName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, customerEmail, customerName'
      });
    }

    let emailHtml, emailText, emailSubject;

    // Generate appropriate email template based on type
    switch (emailType) {
      case 'shipped':
        if (!orderItems) {
          return res.status(400).json({
            success: false,
            error: 'orderItems required for shipped email'
          });
        }
        emailHtml = getShippedEmailTemplate({
          customerName,
          orderId,
          trackingNumber,
          carrierName,
          estimatedDeliveryDate,
          address,
        });
        emailSubject = `Order Shipped - #${orderId.slice(0, 8).toUpperCase()}`;
        emailText = `Your order #${orderId.slice(0, 8)} has been shipped.\n\nTracking: ${trackingNumber || 'N/A'}\nCarrier: ${carrierName || 'N/A'}\nDelivery expected: ${estimatedDeliveryDate || 'Soon'}\n\nVisit ${emailConfig.websiteUrl} to track your order.`;
        break;

      case 'delivered':
        emailHtml = getDeliveredEmailTemplate({
          customerName,
          orderId,
          address,
        });
        emailSubject = `Order Delivered - #${orderId.slice(0, 8).toUpperCase()}`;
        emailText = `Your order #${orderId.slice(0, 8)} has been delivered!\n\nWe hope you enjoy your purchase. Please visit ${emailConfig.websiteUrl} to leave a review.`;
        break;

      case 'confirmation':
      default:
        // Format order date
        const orderDate = new Date(createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Generate email HTML and text using templates
        emailHtml = getOrderEmailTemplate({
          customerName,
          orderId,
          orderDate,
          paymentMethod,
          totalPrice,
          orderItems,
          address,
        });

        emailText = getOrderEmailText({
          customerName,
          orderId,
          orderDate,
          paymentMethod,
          totalPrice,
          orderItems,
          address,
        });

        emailSubject = emailConfig.subjectTemplate.replace('{orderId}', orderId.slice(0, 8));
    }

    // If SMTP credentials are not available, proxy to Firebase Cloud Functions
    if (!HAS_SMTP) {
      console.log('[Email] SMTP credentials not configured, proxying to Firebase Cloud Functions...');
      try {
        const firebaseResponse = await fetch('https://us-central1-newfit-35320.cloudfunctions.net/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            customerEmail,
            customerName,
            totalPrice,
            orderItems,
            address,
            paymentMethod,
            emailType,
            createdAt,
            trackingNumber,
            carrierName,
            estimatedDeliveryDate,
          }),
        });

        if (firebaseResponse.ok) {
          const firebaseData = await firebaseResponse.json();
          return res.status(200).json({
            success: true,
            message: `${emailType} email sent successfully (via Firebase)`,
            forwarded: true,
            ...firebaseData,
          });
        } else {
          const errorData = await firebaseResponse.text();
          console.error('[Email] Firebase proxy failed:', firebaseResponse.status, errorData);
          return res.status(500).json({
            success: false,
            error: 'Email service temporarily unavailable (Firebase proxy failed)',
          });
        }
      } catch (proxyErr) {
        console.error('[Email] Firebase proxy error:', proxyErr);
        return res.status(500).json({
          success: false,
          error: 'Email service not configured and Firebase proxy failed',
        });
      }
    }

    // Send email using local SMTP
    const info = await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.storeEmail}>`,
      to: customerEmail,
      replyTo: emailConfig.storeEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    });

    console.log(`[${emailType}] Email sent:`, info.messageId);

    return res.status(200).json({
      success: true,
      message: `${emailType} email sent successfully`,
      messageId: info.messageId,
      emailType,
    });
  } catch (error) {
    console.error('Email error:', error);
    
    // If there's an error and SMTP is configured, it's a real error
    if (HAS_SMTP) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to send email',
      });
    } else {
      // SMTP not configured and error occurred, try proxying to Firebase
      console.log('[Email] SMTP configuration missing, attempting Firebase fallback on error...');
      return res.status(500).json({
        success: false,
        error: 'Email service misconfigured - please contact support',
      });
    }
  }
};
