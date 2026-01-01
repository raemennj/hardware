
import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
const getAi = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      console.warn("GEMINI_API_KEY is missing. AI logo resolution will be disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const CACHE_KEY = 'hardware_brand_logos_v1';

/**
 * High-quality vetted logos provided by the user.
 * These are prioritized before AI search.
 */
const HARDCODED_LOGOS: Record<string, string> = {
  "The Home Depot": "https://commons.wikimedia.org/wiki/Special:FilePath/TheHomeDepot.svg",
  "Home Depot": "https://commons.wikimedia.org/wiki/Special:FilePath/TheHomeDepot.svg",
  "Lowe's": "https://upload.wikimedia.org/wikipedia/commons/5/59/Lowe%27s_icon.png",
  "Ace Hardware": "https://commons.wikimedia.org/wiki/Special:FilePath/Ace%20Hardware%20logo.svg",
  "True Value": "https://commons.wikimedia.org/wiki/Special:FilePath/True%20Value%20logo.svg",
  "Do it Best": "https://commons.wikimedia.org/wiki/Special:FilePath/Do%20It%20Best%20-%202024.svg",
  "Harbor Freight Tools": "https://upload.wikimedia.org/wikipedia/commons/a/a1/Harbor_Freight_Logo.png",
  "Harbor Freight": "https://upload.wikimedia.org/wikipedia/commons/a/a1/Harbor_Freight_Logo.png",
  "Tractor Supply Co.": "https://commons.wikimedia.org/wiki/Special:FilePath/Tractor%20Supply%20logo.svg",
  "Fastenal": "https://commons.wikimedia.org/wiki/Special:FilePath/Fastenal%20logo.svg",
  "Grainger": "https://commons.wikimedia.org/wiki/Special:FilePath/Grainger%20logo.svg",
  "Friedman's Home Improvement (CA)": "https://commons.wikimedia.org/wiki/Special:FilePath/Friedman-logo.svg",
  "Outdoor Supply Hardware (OSH) (CA)": "https://www.outdoorsupplyhardware.com/ASSETS/IMAGES/LOGOS/CLIENT/21/logo.png",
  "Cole's Hardware (CA - Bay Area)": "https://www.coleshardware.com/site/assets/landing-images/Downloads/rgbjpgcolor.jpg",
  "Anawalt Lumber (CA - LA)": "https://cdn.builder.io/api/v1/image/assets%2F26de3b5246e2495c96cc9e6d7b9d10cf%2F7296fc3006974805986037f0562e054b",
  "Ganahl Lumber (CA - SoCal)": "https://www.ganahllumber.com/images/GanahlFooterLogoMobile.png"
};

const getCache = (): Record<string, string> => {
  const cached = localStorage.getItem(CACHE_KEY);
  return cached ? JSON.parse(cached) : {};
};

const setCache = (brand: string, url: string) => {
  const cache = getCache();
  cache[brand] = url;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

/**
 * Uses a hierarchy to resolve the best logo:
 * 1. Hardcoded list of vetted URLs.
 * 2. Local storage cache.
 * 3. Gemini with Google Search grounding.
 */
export const resolveBrandLogo = async (brandName: string): Promise<string> => {
  // 1. Check Hardcoded List first (Case-insensitive)
  const normalizedKey = Object.keys(HARDCODED_LOGOS).find(
    k => k.toLowerCase() === brandName.toLowerCase() || brandName.toLowerCase().includes(k.toLowerCase())
  );
  if (normalizedKey) return HARDCODED_LOGOS[normalizedKey];

  // 2. Check Cache
  const cache = getCache();
  if (cache[brandName]) return cache[brandName];

  // 3. AI Search Fallback
  const ai = getAi();
  if (!ai) return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%231A73E8'/%3E%3Cpath fill='white' d='M28.5,11.5c-2.1-2.1-5.5-2.1-7.6,0l-9.4,9.4c-0.4,0.4-0.4,1,0,1.4l2.1,2.1l-4.1,4.1c-0.4,0.4-0.4,1,0,1.4l1.4,1.4c0.4,0.4,1,0.4,1.4,0l4.1-4.1l2.1,2.1c0.4,0.4,1,0.4,1.4,0l9.4-9.4C30.6,17,30.6,13.6,28.5,11.5z M25.4,17.1l-1.4-1.4l4.2-4.2l1.4,1.4L25.4,17.1z'/%3E%3C/svg%3E`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the official high-resolution logo URL for the hardware store franchise: "${brandName}". 
      Look for a direct link to a transparent PNG, SVG, or high-quality favicon. 
      Return only the URL string.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            logoUrl: {
              type: Type.STRING,
              description: "The direct URL to the official franchise logo image."
            }
          },
          required: ["logoUrl"]
        }
      },
    });

    const result = JSON.parse(response.text);
    const url = result.logoUrl || "";

    if (url && url.startsWith('http')) {
      setCache(brandName, url);
      return url;
    }
  } catch (error) {
    console.error(`Error resolving logo for ${brandName}:`, error);
  }

  // Final fallback (Google Maps Hardware Icon)
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%231A73E8'/%3E%3Cpath fill='white' d='M28.5,11.5c-2.1-2.1-5.5-2.1-7.6,0l-9.4,9.4c-0.4,0.4-0.4,1,0,1.4l2.1,2.1l-4.1,4.1c-0.4,0.4-0.4,1,0,1.4l1.4,1.4c0.4,0.4,1,0.4,1.4,0l4.1-4.1l2.1,2.1c0.4,0.4,1,0.4,1.4,0l9.4-9.4C30.6,17,30.6,13.6,28.5,11.5z M25.4,17.1l-1.4-1.4l4.2-4.2l1.4,1.4L25.4,17.1z'/%3E%3C/svg%3E`;
};
