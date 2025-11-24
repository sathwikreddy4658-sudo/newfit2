// Simple Express server for email API
// Run with: node server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sendEmail from './api/send-email.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email API endpoint
app.post('/api/send-email', sendEmail);

// Test endpoint for mail-tester.com
app.post('/api/test-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email address required' });
  }

  // Send test email
  const testOrder = {
    orderId: 'TEST-' + Date.now(),
    customerEmail: email,
    customerName: 'Test Customer',
    totalPrice: '299.00',
    orderItems: [
      {
        product_name: 'Test Product - Protein Bar',
        quantity: 3,
        product_price: 99.67
      }
    ],
    address: 'Test Address, Test City, Test State - 123456',
    paymentMethod: 'COD',
    createdAt: new Date().toISOString()
  };

  req.body = testOrder;
  return sendEmail(req, res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email API is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Email API server running on http://localhost:${PORT}`);
  console.log(`📧 Email endpoint: http://localhost:${PORT}/api/send-email`);
});
