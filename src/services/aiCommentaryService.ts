import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a short, human-readable live commentary line
 */
export async function generateCommentary({
  sport,
  event,
  match,
}: {
  sport: string;
  event: any;
  match: any;
}) {
  try {
    const prompt = `
You are a professional sports commentator. 
Sport: ${sport}

Latest Event:
${JSON.stringify(event, null, 2)}

Match Snapshot:
${JSON.stringify(match, null, 2)}

Generate a concise, energetic one-line live commentary update.
Do not repeat old info. Use natural tone (like a human commentator).
Keep it under 25 words.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 80,
    });

    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("❌ AI Commentary Error:", error);
    return "";
  }
}
