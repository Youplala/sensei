// This file is a fallback for Vercel to recognize the API route
// The actual implementation is in src/app/api/generate-daily-word/route.ts

export default function handler(req, res) {
  res.status(200).json({ 
    message: 'This is a fallback handler. The actual implementation is in the App Router.',
    info: 'If you\'re seeing this, make sure your Vercel project is configured to use the App Router.'
  });
}
