
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type, Schema } from "@google/genai";

// Initialize Express
const app = express();
const PORT = 3000;

// Enable CORS so the frontend can call this server
app.use(cors());

// Increase payload limit for Base64 images
app.use(express.json({ limit: '10mb' }));

// --- Configuration (Moved from Frontend to Backend) ---

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

// --- API Route ---

app.post('/analyze', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Get API Key from server environment variables
    // Support VITE_API_KEY as fallback for local dev convenience
    const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Use gemini-flash-latest for stability and speed
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

    const jsonResponse = JSON.parse(text);
    res.json(jsonResponse);

  } catch (error) {
    console.error("Backend Analysis Error:", error);
    
    // Check for 429 errors
    const errorStr = error.toString();
    if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({ error: 'API usage limit exceeded. Please try again later.' });
    }

    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${!!(process.env.API_KEY || process.env.VITE_API_KEY)}`);
});
