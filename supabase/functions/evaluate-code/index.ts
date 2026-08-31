// Supabase Edge Function: Gemini AI Code Evaluator
// Deployed at: /functions/v1/evaluate-code
//
// Evaluates a student's code submission strictly based on the challenge title,
// description, requirements, and external resource link using Gemini Flash.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Server misconfiguration: GEMINI_API_KEY environment variable is not set.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      code,
      language = 'typescript',
      challengeTitle = 'Coding Challenge',
      challengeDescription = '',
      externalSourceLink = null,
    } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty "code" field in request payload.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct the comprehensive evaluation prompt for Gemini
    const promptText = `
You are an elite Senior Staff Software Engineer and Technical Mentor grading a student's code submission for Challenge Tracker Pro.

### CHALLENGE CONTEXT & SPECIFICATIONS
- Challenge Title: ${challengeTitle}
- Challenge Requirements & Description:
${challengeDescription || 'No description provided.'}
- External Specifications / Resource URL: ${externalSourceLink || 'None provided'}

### STUDENT SUBMISSION
- Programming Language: ${language}
- Student's Code:
\`\`\`${language}
${code}
\`\`\`

### EVALUATION INSTRUCTIONS
1. Analyze the student's code strictly against the Challenge Context, requirements, edge cases, and best practices for ${language}.
2. Check for correctness, code cleanliness, performance, potential bugs, security issues, and alignment with the challenge specs.
3. Assign an integer score from 0 to 100 based on:
   - 90-100: Flawless or production-ready implementation fulfilling all requirements.
   - 75-89: Solid implementation with minor style or edge-case omissions.
   - 50-74: Partially working, missing key requirements, or has logical bugs.
   - 0-49: Incomplete, non-functional, or fundamentally incorrect.
4. Write structured, constructive mentor feedback in Markdown. Provide FULL, comprehensive technical details, but keep the initial summary highly concise so it is easy to read at a glance. Use exactly these headers:
   - ### 🎯 Evaluation Summary (Limit to 1-2 short sentences maximum)
   - ### ✅ What You Did Well (Detailed bullet points)
   - ### 🔍 Areas for Improvement & Bugs (Comprehensive breakdown of logic flaws or edge cases)
   - ### 💡 Actionable Recommendations & Code Tips (Full, actionable advice and syntax examples)

### MANDATORY OUTPUT FORMAT
Do NOT output JSON. You must output raw plain text.
The very first line of your response MUST be exactly "SCORE: X" (where X is the integer score).
The rest of your response should be the markdown formatted feedback.
`.trim();

    // Generation config without JSON constraints
    const generationConfig = {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 2048,
    };

    // Call Gemini REST API (gemini-2.5-flash-latest with fallback to gemini-2.5-flash)
    const primaryUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent?key=${apiKey}`;
    
    let geminiResponse = await fetch(primaryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig,
      }),
    });

    // Fallback model if latest alias endpoint is not available
    if (!geminiResponse.ok && geminiResponse.status === 404) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      geminiResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig,
        }),
      });
    }

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API Error:', errText);
      return new Response(
        JSON.stringify({ error: `Gemini API returned error: ${geminiResponse.statusText}`, details: errText }),
        { status: geminiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsedResult = { score: 75, feedback: 'Evaluation completed.' };

    try {
      // Extract the score from the first line (e.g., "SCORE: 95")
      const scoreMatch = rawText.match(/SCORE:\s*(\d+)/i);
      const score = scoreMatch ? Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10))) : 75;

      // Remove the SCORE line to isolate the markdown feedback
      const feedback = rawText.replace(/SCORE:\s*\d+/i, '').trim() || rawText;

      parsedResult = { score, feedback };
    } catch (error) {
      console.error('Regex parsing failed:', error);
      parsedResult.feedback = rawText || 'An error occurred while formatting the AI feedback.';
    }

    return new Response(JSON.stringify(parsedResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('evaluate-code unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error during evaluation.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});