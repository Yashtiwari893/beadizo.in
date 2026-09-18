import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { clientKey, rateLimit } from '@/lib/auth/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function callGroqAI(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error('NO_API_KEY');

  const models = [
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'groq/compound',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
  ];
  let lastError: Error | null = null;


  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert e-commerce copywriter for Beadizo, a modern handcrafted jewellery brand known for anti-tarnish, waterproof, elegant accessories.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.6,
          max_tokens: 350,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('INVALID_API_KEY');
        if (res.status === 429) throw new Error('AI_RATE_LIMIT');
        throw new Error(errData?.error?.message || `Groq returned status ${res.status}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text === 'string' && text.trim().length > 0) return text;
    } catch (err: any) {
      if (err.message === 'INVALID_API_KEY' || err.message === 'AI_RATE_LIMIT') {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate with Groq.');
}


async function callGeminiAI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('NO_API_KEY');

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: 'You are an expert e-commerce copywriter for Beadizo, a modern handcrafted jewellery brand known for anti-tarnish, waterproof, elegant accessories.',
                },
              ],
            },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 450,
            },
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = (errData?.error?.message || '').toLowerCase();
        if (res.status === 400 || res.status === 403) {
          if (errMsg.includes('api key') || errMsg.includes('key not valid') || errMsg.includes('permission')) {
            throw new Error('INVALID_API_KEY');
          }
        }
        if (res.status === 429) throw new Error('AI_RATE_LIMIT');
        throw new Error(errData?.error?.message || `Gemini returned status ${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string') return text;
    } catch (err: any) {
      if (err.message === 'INVALID_API_KEY' || err.message === 'AI_RATE_LIMIT') {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate with Gemini.');
}

async function generateWithAI(prompt: string): Promise<string> {
  if (process.env.GEMINI_API_KEY?.trim()) {
    return await callGeminiAI(prompt);
  }
  if (process.env.GROQ_API_KEY?.trim()) {
    return await callGroqAI(prompt);
  }
  throw new Error('NO_API_KEY');
}


export async function POST(request: NextRequest) {
  // 1. Authentication + CSRF protection
  const denied = requireAdmin(request);
  if (denied) return denied;

  // 2. Rate limit: 10 requests per minute per admin to prevent spam
  const limit = rateLimit(`admin-ai-generate:${clientKey(request)}`, { limit: 10, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many AI requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const type = body?.type;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  const existingDescription =
    typeof body?.existingDescription === 'string' ? body.existingDescription.trim() : '';

  if (type !== 'description' && type !== 'features') {
    return NextResponse.json(
      { error: "Invalid type. Must be 'description' or 'features'." },
      { status: 400 }
    );
  }

  if (!title || title.length < 2) {
    return NextResponse.json(
      { error: 'Product title is required to generate AI content.' },
      { status: 400 }
    );
  }

  if (title.length > 200) {
    return NextResponse.json({ error: 'Product title is too long (max 200 characters).' }, { status: 400 });
  }

  try {
    if (type === 'description') {
      const prompt = `Write a compelling, SEO-optimized product description for an e-commerce jewellery listing.
Product Title: "${title}"
URL Slug: "${slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"
${existingDescription ? `Existing notes to improve upon: "${existingDescription}"` : ''}

Requirements:
- 2 to 4 sentences, warm and premium tone (handcrafted jewellery brand Beadizo)
- Naturally include relevant keywords from the title for SEO (e.g. material, style, gemstones)
- No exaggerated claims, no emojis, no markdown formatting (plain text only)
- Return only the description text, nothing else.`;

      const rawOutput = await generateWithAI(prompt);

      // Clean plain text
      const cleanDesc = rawOutput
        .replace(/^["']|["']$/g, '')
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/```/g, '')
        .replace(/\*\*/g, '')
        .trim();

      return NextResponse.json({ result: cleanDesc });
    } else {
      // type === 'features'
      const prompt = `Suggest 4 to 6 short product feature or badge tags for this jewellery product, each 2-4 words max (e.g. "18K Gold Plated", "Waterproof & Sweatproof", "Anti-Tarnish Finish", "Hypoallergenic", "Free Pan-India Delivery").
Product Title: "${title}"
${slug ? `URL Slug: "${slug}"` : ''}

Return as a JSON array of strings only, nothing else.
Example format:
["18K Gold Plated", "Waterproof & Sweatproof", "Anti-Tarnish Finish", "Hypoallergenic Brass"]`;

      const rawOutput = await generateWithAI(prompt);

      let tags: string[] = [];
      try {
        const jsonMatch = rawOutput.match(/\[\s*[\s\S]*?\s*\]/);
        if (jsonMatch) {
          tags = JSON.parse(jsonMatch[0]);
        } else {
          const parsed = JSON.parse(rawOutput);
          if (Array.isArray(parsed)) tags = parsed;
          else if (Array.isArray(parsed?.features)) tags = parsed.features;
          else if (Array.isArray(parsed?.tags)) tags = parsed.tags;
        }
      } catch {
        // Fallback: split lines or commas
        tags = rawOutput
          .split(/[\n,]+/)
          .map((s) => s.replace(/^[0-9.-]+/, '').replace(/["'\[\]]/g, '').trim())
          .filter((s) => s.length > 2 && s.length < 40);
      }

      const cleanTags = tags
        .filter((t) => typeof t === 'string' && t.trim().length > 1)
        .map((t) => t.trim().replace(/^["']|["']$/g, ''))
        .slice(0, 6);

      return NextResponse.json({
        result: cleanTags.length > 0 ? cleanTags : ['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
      });
    }
  } catch (err: any) {
    console.error('[admin/ai-generate] Error:', err?.message || err);

    if (err?.message === 'NO_API_KEY') {
      return NextResponse.json(
        {
          error:
            'AI API key is not configured. Please set GEMINI_API_KEY in .env.local to enable AI Assist, or write manually.',
        },
        { status: 503 }
      );
    }

    if (err?.message === 'INVALID_API_KEY') {
      return NextResponse.json(
        { error: 'Invalid Gemini API key in .env.local. Please verify your GEMINI_API_KEY.' },
        { status: 401 }
      );
    }

    if (err?.message === 'AI_RATE_LIMIT') {
      return NextResponse.json(
        { error: 'AI rate limit exceeded. Please wait a moment or write manually.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Could not generate right now. Please try again or write manually.' },
      { status: 500 }
    );
  }
}
