import { GoogleGenAI, Type } from "@google/genai";
import { GenerationSettings, GeneratedContent } from "../types";

/**
 * Generates the text content (JSON data, image prompt, and formatted card)
 * for the magic item.
 */
export const generateMagicItemText = async (
  settings: GenerationSettings
): Promise<GeneratedContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are a Dungeons & Dragons magic-item generator.
    Your job is to create fully original, lore-rich magic items and produce specific outputs.
    
    Follow all user choices precisely.
    All mechanics must be original and rules-compatible (5e style) but not verbatim from published sources.
    
    Inputs provided:
    - Rarity: ${settings.rarity}
    - Type: ${settings.type}
    - Theme: ${settings.theme}
    - Style: ${settings.style}
    - Power Band: ${settings.powerBand}
    - Include Curse: ${settings.includeCurse}
    - Include Plot Hook: ${settings.includePlotHook}

    Price_gp should use pricing guidelines inspired by Xanathar's Guide but scaled.
    Tone: evocative, immersive, but mechanically precise.
  `;

  const prompt = `Generate a magic item based on the system instructions. Return JSON data only.`;

  // Define the schema for the structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      itemData: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          rarity: { type: Type.STRING },
          style: { type: Type.STRING },
          theme: { type: Type.STRING },
          description: { type: Type.STRING },
          mechanics: {
            type: Type.OBJECT,
            properties: {
              attunement: { type: Type.BOOLEAN },
              effects: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              activation: { type: Type.STRING },
              scaling: { type: Type.STRING },
            },
            required: ["attunement", "effects", "activation", "scaling"],
          },
          curse: { type: Type.STRING },
          plot_hook: { type: Type.STRING },
          price_gp: { type: Type.NUMBER },
        },
        required: ["name", "description", "mechanics", "price_gp"],
      },
      imagePrompt: {
        type: Type.STRING,
        description: "A concise, concrete description for the Imagen API. No text in image.",
      },
      itemCard: {
        type: Type.STRING,
        description: "A player-facing, well-formatted text description of the item including name, rarity, flavor, mechanics, and price.",
      },
    },
    required: ["itemData", "imagePrompt", "itemCard"],
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.9, // High creativity
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No content generated from Gemini.");
  }

  try {
    return JSON.parse(text) as GeneratedContent;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Invalid JSON response from generator.");
  }
};

/**
 * Generates the image for the magic item using the prompt created in the previous step.
 */
export const generateMagicItemImage = async (
  imagePrompt: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Use gemini-2.5-flash-image for reliable image generation
    // Using generateContent because this is a multimodal model, not an Imagen model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           const mimeType = part.inlineData.mimeType || 'image/png';
           return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Image generation failed", error);
    throw error;
  }
};
