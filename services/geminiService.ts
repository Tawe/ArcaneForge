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
    - Item Type: ${settings.type} (This is the actual type of magic item - weapon, armor, wondrous item, etc. NOT a visual style)
    - Theme: ${settings.theme}
    - Visual Art Style: ${settings.style} (This is ONLY for the image generation visual style - oil painting, watercolor, etc. It does NOT affect the item type or description)
    - Power Band: ${settings.powerBand}
    - Include Curse: ${settings.includeCurse}
    - Include Plot Hook: ${settings.includePlotHook}

    IMPORTANT: The "Visual Art Style" (${settings.style}) is ONLY for how the image should be rendered visually. 
    The item itself must be a ${settings.type}, not a painting or artwork. 
    For example, if the type is "Wondrous Item" and style is "Oil Painting", create a wondrous item (like an amulet, orb, or artifact) 
    that will be DEPICTED in an oil painting style, not an item that IS a painting.

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
        description: `A concise, concrete description for image generation. Describe the ${settings.type} itself (not a painting of it). The visual style "${settings.style}" will be applied automatically - do not mention the style in the prompt. Focus on the item's appearance, materials, magical effects visible, and composition. No text in image.`,
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
  imagePrompt: string,
  style: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Combine the image prompt with the style instruction
    const fullPrompt = `${imagePrompt}\n\nStyle: Render this in the style of ${style}.`;
    
    // Use gemini-2.5-flash-image for reliable image generation
    // Using generateContent because this is a multimodal model, not an Imagen model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }],
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
