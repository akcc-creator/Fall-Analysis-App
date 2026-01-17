
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
You are an expert Geriatric Physiotherapist and Occupational Therapist working in a nursing home in Hong Kong.
Your task is to analyze the input images, which could be **Fall Incident Reports (Documents, possibly multiple pages)** OR **Photos of an Environment (Scene, possibly multiple angles)**.

### STEP 1: CLASSIFY INPUT TYPE
Determine if the images are written documents/forms OR photos of a physical space.

### STEP 2: ANALYZE BASED ON TYPE

#### A. IF INPUTS ARE FALL INCIDENT REPORTS (DOCUMENTS):
1. **Combine Information**: Integrate details from all pages (e.g., Page 1 history, Page 2 physical assessment).
2. **Extract Details**: Read handwritten or typed text (time, place, mechanism of injury).
3. **Analyze Causes**: Determine root causes (intrinsic factors like dizziness, gait; or extrinsic factors like wet floor) based *strictly* on the text.
4. **Prevention**: Suggest measures to prevent recurrence.
5. **Handover Note**: Write a "Post-Fall Assessment Note" (跌倒後評估記錄).
   - Format: "院友於[Time/Place]發生跌倒。初步評估可能與[Cause]有關。[Physical findings ONLY if written in text]. 建議[Action]. 需觀察[Symptoms]."

#### B. IF INPUTS ARE ENVIRONMENT PHOTOS (SCENE):
1. **Scene Description**: Describe the room/corridor/toilet and visible furniture/equipment from the provided angles.
2. **Risk Assessment**: Identify *potential* accident risks (e.g., wet floor, poor lighting, clutter, lack of handrails, improper bed height, unlocked wheelchair brakes).
3. **Prevention/Improvement**: Suggest specific environmental modifications to *prevent* a fall from happening.
4. **Handover Note**: Write a "Environmental Safety Round Note" (環境安全巡查記錄).
   - Format: "於[Location]進行環境評估。發現潛在風險：[Risks]. 建議：[Improvements]. (Do NOT mention a specific patient falling unless a person is actually visible on the floor)."

### CRITICAL CONSTRAINTS
- **No Hallucinations**: If analyzing environment photos, **DO NOT** make up a story about someone falling. Treat it as a proactive safety check.
- **Objectivity**: If images are documents, only mention injuries written in text. If photos, only mention what is visible.
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
      description: "The professional paragraph for the handover log (交更簿).",
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
      text: "Analyze these images (Fall Report Pages OR Environment Photos). Return result in Traditional Chinese.",
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
