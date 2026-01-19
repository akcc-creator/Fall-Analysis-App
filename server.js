
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Express
const app = express();
const PORT = 3000;

// Enable CORS so the frontend can call this server
app.use(cors());

// Increase payload limit for Base64 images
app.use(express.json({ limit: '20mb' }));

// --- Configuration ---

const SYSTEM_INSTRUCTION = `
You are an expert Geriatric Physiotherapist (PT) working in a nursing home in Hong Kong.
Your task is to analyze the input images (Fall Incident Reports or Environment Photos) and provide professional advice.

### 1. CLASSIFY INPUT
- Documents (Fall Report)
- Photos (Environment/Scene)

### 2. ANALYZE (Traditional Chinese)

#### A. IF DOCUMENTS (Fall Report):
- **Extract**: Time, place, injury, history.
- **Analyze**: Root cause (Intrinsic: gait, balance, strength / Extrinsic: shoes, floor, obstacles).
- **Handover Note**: Write a **concise** PT log entry (approx 30-50 words).
  - **Role**: Strictly Physiotherapist (PT).
  - **Tone**: Clinical, concise.
  - **Format**: "PT評估：院友於[Date/Time]在[Place]跌倒。分析顯示[Brief Cause: e.g. 步態不穩/環境濕滑]。建議：[Specific PT Actions: e.g. 轉介PT跟進/轉用四腳叉/加強肌力訓練]。"

#### B. IF PHOTOS (Environment):
- **Analyze**: Hazards (lighting, floor surface, obstacles, handrails).
- **Handover Note**: Write a **concise** PT safety check entry.
  - **Format**: "PT環境評估：[Location]發現[Specific Hazard]。建議：[Modification]。"

### CRITICAL CONSTRAINTS
- **No Hallucinations**: Do not invent injuries not mentioned in text.
- **Language**: Traditional Chinese (Cantonese clinical style).
- **Perspective**: **PT only**. Do not mention nursing tasks like "check BP" or "notify family" unless directly relevant to the physical fall mechanism.

### OUTPUT MAPPING
- \`detectedTextSummary\`: Brief summary of document text OR environment.
- \`possibleCauses\`: Root causes of fall OR Environmental hazards.
- \`preventionStrategies\`: PT-focused measures (Environment, Physical, Care).
- \`handoverNote\`: The short, professional PT note.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    detectedTextSummary: {
      type: Type.STRING,
      description: "A brief summary of what was read from the documents or described in the scene.",
    },
    possibleCauses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of analyzed root causes OR potential environmental hazards.",
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
      description: "The professional PT assessment note (concise).",
    },
  },
  required: ["detectedTextSummary", "possibleCauses", "preventionStrategies", "handoverNote"],
};

// --- API Route ---

app.post('/analyze', async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Construct parts
    const parts = images.map(img => ({
      inlineData: {
        data: img,
        mimeType: 'image/jpeg',
      },
    }));
    
    parts.push({
      text: "Analyze these images as a PT. Return result in Traditional Chinese.",
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: parts,
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
