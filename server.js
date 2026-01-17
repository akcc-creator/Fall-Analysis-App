
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
Your task is to analyze the input image, which could be either a **Fall Incident Report (Document)** OR a **Photo of an Environment (Scene)**.

### STEP 1: CLASSIFY IMAGE TYPE
Determine if the image is a written document/form OR a photo of a physical space.

### STEP 2: ANALYZE BASED ON TYPE

#### A. IF IT IS A FALL INCIDENT REPORT (DOCUMENT):
1. **Extract Details**: Read handwritten or typed text (time, place, mechanism of injury).
2. **Analyze Causes**: Determine root causes (intrinsic factors like dizziness, gait; or extrinsic factors like wet floor) based *strictly* on the text.
3. **Prevention**: Suggest measures to prevent recurrence.
4. **Handover Note**: Write a "Post-Fall Assessment Note" (跌倒後評估記錄).
   - Format: "院友於[Time/Place]發生跌倒。初步評估可能與[Cause]有關。[Physical findings ONLY if written in text]. 建議[Action]. 需觀察[Symptoms]."

#### B. IF IT IS AN ENVIRONMENT PHOTO (SCENE):
1. **Scene Description**: Describe the room/corridor/toilet and visible furniture/equipment.
2. **Risk Assessment**: Identify *potential* accident risks (e.g., wet floor, poor lighting, clutter, lack of handrails, improper bed height, unlocked wheelchair brakes).
3. **Prevention/Improvement**: Suggest specific environmental modifications to *prevent* a fall from happening.
4. **Handover Note**: Write a "Environmental Safety Round Note" (環境安全巡查記錄).
   - Format: "於[Location]進行環境評估。發現潛在風險：[Risks]. 建議：[Improvements]. (Do NOT mention a specific patient falling unless a person is actually visible on the floor)."

### CRITICAL CONSTRAINTS
- **No Hallucinations**: If analyzing an environment photo, **DO NOT** make up a story about someone falling. Treat it as a proactive safety check.
- **Objectivity**: If the image is a document, only mention injuries written in text. If it is a photo, only mention what is visible.
- **Language**: Traditional Chinese (Cantonese clinical style).

### OUTPUT MAPPING
- \`detectedTextSummary\`: Summary of document text OR Description of the environment.
- \`possibleCauses\`: Causes of the specific fall (Document) OR Potential safety hazards identified (Environment).
- \`preventionStrategies\`: Measures to prevent future falls (Document) OR Environmental modifications (Environment).
- \`handoverNote\`: The professional paragraph for the logbook (Post-Fall Note OR Safety Round Note).
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    detectedTextSummary: {
      type: Type.STRING,
      description: "A brief summary of what was read from the document or described in the scene.",
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
            text: "Analyze this image (Fall Report OR Environment Photo). Return result in Traditional Chinese.",
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
