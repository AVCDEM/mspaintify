// Serverless function — runs on Vercel/Cloudflare/etc.
// Receives a base64 image, asks Gemini to describe it, returns description.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured. Set it in Vercel environment variables.' });
  }

  const prompt = `Look at this rough drawing. Describe in vivid detail what is depicted, in one paragraph (max 60 words), as if writing a prompt for a photorealistic image generator. Include subject, composition, lighting, mood. Be specific and concrete. Do not mention that this is a drawing — describe the SUBJECT as if it were real. Avoid any unsafe, sexual, violent, or harmful content; if the drawing contains any, return only the word "BLOCKED". Output ONLY the description, no preamble.`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: image,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini error:', data);
      return res.status(500).json({ error: 'Vision API failed', details: data?.error?.message });
    }

    const description = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!description) {
      return res.status(500).json({ error: 'No description returned' });
    }

    if (description.includes('BLOCKED')) {
      return res.status(400).json({ error: 'Content not allowed. Try a different drawing.' });
    }

    return res.status(200).json({ description });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
