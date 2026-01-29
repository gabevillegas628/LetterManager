import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config/index.js';

const router = Router();

// Validation schema for account request
const accountRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  institution: z.string().min(1, 'Institution is required'),
  howHeard: z.string().optional(),
  lettersPerYear: z.string().optional(),
});

// POST /api/contact/request-account - Submit account request
router.post('/request-account', async (req, res, next) => {
  try {
    const data = accountRequestSchema.parse(req.body);

    // Check if Brevo is configured
    if (!config.brevo.apiKey || !config.brevo.adminEmail) {
      console.error('Brevo not configured - BREVO_API_KEY or ADMIN_EMAIL missing');
      res.status(500).json({
        success: false,
        error: 'Email service not configured'
      });
      return;
    }

    // Send email via Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': config.brevo.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Recommate',
          email: config.brevo.senderEmail,
        },
        to: [
          {
            email: config.brevo.adminEmail,
            name: 'Admin',
          },
        ],
        subject: `New Account Request: ${data.name} - ${data.institution}`,
        htmlContent: `
          <h2>New Account Request</h2>
          <p>Someone has requested a Recommate account:</p>
          <table style="border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${data.email}">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Institution</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.institution}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">How they heard about us</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.howHeard || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Letters per year</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.lettersPerYear || 'Not specified'}</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 12px;">This email was sent from the Recommate account request form.</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      res.status(500).json({
        success: false,
        error: 'Failed to send request'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Account request submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
