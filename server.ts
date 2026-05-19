import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from 'stripe';
import { Resend } from 'resend';

// NOTE: To make these endpoints work, you must add your keys to the platform settings.
// DO NOT default instantiate stripe/resend if the environment keys are missing, 
// wait until the endpoint is invoked to show a helpful error message or allow the server to start safely.
let stripeClient: Stripe | null = null;
let resendClient: Resend | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is missing.');
    }
    stripeClient = new Stripe(key, { apiVersion: '2026-04-22.dahlia' as any });
  }
  return stripeClient;
}

function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is missing.');
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // We need raw body for Stripe Webhooks
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      if (!sig) return res.status(400).send('Missing signature');
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("Missing STRIPE_WEBHOOK_SECRET");
      }
      
      const stripe = getStripe();
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle the checkout.session.completed event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        // In a real app we'd update Firebase here, but for security, 
        // we'd probably use server-side firebase admin.
        // For this prototype, we'll return fire and forget and handle client side simulation,
        // or actually we CAN use firebase SDK. But let's just log it.
        console.log("Payment successful for invoice:", session.client_reference_id);
      }
      
      res.json({received: true});
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Standard JSON body parsing for API
  app.use(express.json());

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { invoiceId, amountStr, title, origin } = req.body;
      const stripe = getStripe();
      const amount = Math.round(parseFloat(amountStr.replace(/[^0-9.-]+/g,"")) * 100);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Invoice: ${title}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/?mode=invoice&id=${invoiceId}&payment=success`,
        cancel_url: `${origin}/?mode=invoice&id=${invoiceId}&payment=cancelled`,
        client_reference_id: invoiceId,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      const resend = getResend();
      
      const data = await resend.emails.send({
        from: 'June <onboarding@resend.dev>', // Free tier limited to onboarding
        to: [to],
        subject: subject,
        html: html,
      });

      res.json(data);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // Simple in-memory store for magic links
  const magicLinks = new Map<string, string>();

  app.post("/api/generate-magic-link", async (req, res) => {
    try {
      const { clientId, viewType } = req.body;
      const { v4: uuidv4 } = await import('uuid');
      const token = uuidv4();
      
      magicLinks.set(token, JSON.stringify({ clientId, viewType }));
      
      // In a real app we'd email this. Here we just return it so it can be copied.
      res.json({ token, url: `${req.headers.origin || 'http://localhost:3000'}/?mode=${viewType}&id=${clientId}&token=${token}` });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/verify-magic-link/:token", (req, res) => {
    const dataStr = magicLinks.get(req.params.token);
    if (!dataStr) return res.status(404).json({ error: "Invalid or expired token" });
    
    res.json(JSON.parse(dataStr));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Vite builds to dist/client by default if configured or just dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
