
import { GoogleGenAI, Type } from "@google/genai";

// Vercel Serverless Function Config
// Increase body size limit to handle images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const SYSTEM_INSTRUCTION = `
You are an expert Geriatric Physiotherapist and Occupational Therapist working in a nursing home in Hong Kong.
Your task is to analyze an image of a "Fall Incident Report" (跌倒意外報告).

1. Identify the key details from the report (handwritten or typed).
2. Analyze the root causes of the fall (intrinsic factors like dizziness, weakness; or extrinsic factors like wet floor, footwear).
3. Formulate specific prevention strategies.
4. IMPORTANT: Write a concise "Post-Fall Assessment Note" (跌倒後評估結果) in Traditional Chinese (Cantonese context) suitable for a Therapist to copy directly into the shift handover log (交更簿).

CRITICAL CONSTRAINTS:
- **Objectivity**: If the image is a document (form/report) and NOT a photo of a patient's injury, do NOT invent or hallucinate physical findings (e.g., "redness on left knee", "head abrasion", "swelling") unless these specific details are clearly written in the text of the document.
- If the document does not mention specific injuries, state "未有提及明顯傷勢" (No obvious injuries mentioned) or strictly stick to what is written.
- Only describe physical injuries if you clearly see a photo of a wound or if the text explicitly describes them.

The handover note should be professional, concise, and follow this format roughly:
"院友於[Time/Place]發生跌倒。初步評估可能與[Cause]有關。[Physical findings ONLY if written in text or visible in photo]. 建議[Specific Actions]. 需持續觀察[Specific Symptoms]."
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    detectedTextSummary: {
      type: Type.STRING,
      description: "A brief summary of what was read from the document.",
    },
    possibleCauses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of analyzed root causes.",
    },
    preventionStrategies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          measure: { type: Type.STRING },
          rationale: { type: Type.STRING },
          category: { 
            type: Type.STRING, 
            enum: ['Environment', 'Physical', 'Medication', 'Care', 'Other'] 
          },
        },
        required: ["measure", "rationale", "category"],
      },
    },
    handoverNote: {
      type: Type.STRING,
      description: "The professional paragraph for the handover log (交更簿).",
    },
  },
  required: ["detectedTextSummary", "possibleCauses", "preventionStrategies", "handoverNote"],
};

export default async function handler(req, res) {
  // 1. Handle CORS (Allow frontend to call this function)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Validate Request Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // 3. Get API Key from Environment (Vercel Project Settings)
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: API_KEY is missing in Vercel settings.' });
    }

    // 4. Call Gemini API
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: {
        parts: [
          {
            inlineData: {
              data: image,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: "Analyze this fall report document. Return the result in Traditional Chinese (Cantonese clinical style). Remember to be objective about injuries.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    // 5. Return Result
    const jsonResponse = JSON.parse(text);
    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Vercel Backend Error:", error);
    
    const errorStr = error.toString();
    if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({ error: 'API usage limit exceeded. Please try again later.' });
    }

    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
