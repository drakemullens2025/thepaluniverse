const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;

export interface CringeAnalysis {
  hotLevel: number;
  cringeLevel: number;
  analysis: string;
  tips?: string[];
}

export interface RoastAnalysis {
  roastText: string;
  intensity: number;
  burnLevel: number; // 0-100 scale of how savage the roast is
}

export interface HomeworkAnalysis {
  solution: string;
  adaptedLevel: number;
  stepByStep?: string[];
  keyPoints?: string[];
  writingStyle?: string;
}

export async function generateRoast(input: string, intensity: number, imageUri?: string): Promise<RoastAnalysis> {
  let parts: any[] = [];
  
  // Use the same Gemini 2.5 Flash Preview model
  const model = 'gemini-2.5-flash-preview-05-20';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  // Define intensity levels
  const intensityLevels = {
    1: { name: 'Playful', description: 'Light-hearted teasing, friendly banter' },
    2: { name: 'Sassy', description: 'Witty comebacks with a bit more bite' },
    3: { name: 'Savage', description: 'Sharp roasts that sting but are still fun' },
    4: { name: 'Brutal', description: 'Harsh truths delivered with no mercy' },
    5: { name: 'Career Ending', description: 'Absolutely devastating, nuclear-level roasts' }
  };
  
  const currentLevel = intensityLevels[intensity as keyof typeof intensityLevels];
  
  // Build the prompt
  const promptText = `You are a professional roast comedian. Generate a roast for this ${imageUri ? 'image' : 'content'} at intensity level ${intensity}/5 (${currentLevel.name}).
        
${imageUri ? `Additional context: "${input}"` : `Content: "${input}"`}
        
Intensity Level: ${intensity}/5 - ${currentLevel.name}
Description: ${currentLevel.description}

Guidelines for each intensity level:
- Level 1 (Playful): Gentle teasing, wholesome humor, like roasting a friend
- Level 2 (Sassy): Clever wordplay, mild burns, witty observations
- Level 3 (Savage): Sharp wit, pointed observations, classic roast comedy
- Level 4 (Brutal): Harsh but creative insults, no holds barred
- Level 5 (Career Ending): Absolutely devastating, legendary-level roasts

You MUST provide your response as valid JSON only, with no markdown formatting or code blocks. Return ONLY this JSON structure:
{
  "roastText": "[your roast here - make it ${imageUri ? 'about what you see in the image' : 'about the provided content'}]",
  "intensity": ${intensity},
  "burnLevel": [0-100 number representing how savage this roast is]
}

Make the roast creative, original, and appropriately intense for level ${intensity}. 
IMPORTANT: Return ONLY the JSON object, no other text or formatting.`;

  if (imageUri) {
    try {
      // For image analysis, convert the image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Get the actual MIME type from the blob
      const mimeType = blob.type || 'image/jpeg';
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          } else {
            reject(new Error('Failed to read image'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(blob);
      });
      
      parts = [
        {
          text: promptText
        },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64
          }
        }
      ];
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  } else {
    parts = [{ text: promptText }];
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.8, // Higher temperature for more creative roasts
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
          candidateCount: 1,
          stopSequences: [],
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`Failed to generate roast: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('Invalid response structure - no candidates:', data);
      throw new Error('Invalid API response: no candidates');
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      console.error('Invalid response structure - no content parts:', candidate);
      throw new Error('Invalid API response: no content parts');
    }
    
    const text = candidate.content.parts[0].text;
    if (!text) {
      console.error('No text in response:', candidate.content.parts[0]);
      throw new Error('Invalid API response: no text content');
    }
    
    // Log the full response for debugging
    console.log('Full roast response:', text);
    
    // Clean the response text
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    
    // Try to find JSON object in the text
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonStart > jsonEnd) {
      console.error('No valid JSON structure found in text:', cleanedText);
      throw new Error('Invalid response format: no JSON found');
    }
    
    const jsonString = cleanedText.substring(jsonStart, jsonEnd + 1);
    
    try {
      const result = JSON.parse(jsonString);
      
      // Validate the result has required fields
      if (!result.roastText || typeof result.intensity !== 'number' || typeof result.burnLevel !== 'number') {
        console.error('Invalid JSON structure:', result);
        throw new Error('Invalid JSON structure: missing required fields');
      }
      
      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON:', jsonString);
      console.error('Parse error:', parseError);
      throw new Error('Invalid JSON in response');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate roast. Please try again.');
  }
}

export async function analyzeCringe(input: string, imageUri?: string): Promise<CringeAnalysis> {
  let parts: any[] = [];
  
  // Use the new Gemini 2.5 Flash Preview model for both text and image analysis
  const model = 'gemini-2.5-flash-preview-05-20';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  // Build the prompt - be more explicit about JSON format
  const promptText = `Analyze this ${imageUri ? 'image' : 'content'} for "cringe" vs "hot" (cool/fire) levels on a scale of 0-100.
        
${imageUri ? `Additional context: "${input}"` : `Content: "${input}"`}
        
You MUST provide your response as valid JSON only, with no markdown formatting or code blocks. Return ONLY this JSON structure:
{
  "hotLevel": [0-100 number],
  "cringeLevel": [0-100 number],
  "analysis": "[brief explanation of why it's hot or cringe in a roasting, humorous manner${imageUri ? ' based on the image' : ''}]",
  "tips": ["tip1", "tip2", "tip3"] (only include if cringeLevel > hotLevel)
}
        
Hot means attractive, cool, fire, impressive, or awesome.
Cringe means awkward, embarrassing, or trying too hard.
If cringe level is high, provide exactly 3 humorous tips to reduce cringe.
IMPORTANT: Return ONLY the JSON object, no other text or formatting.`;

  if (imageUri) {
    try {
      // For image analysis, convert the image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Get the actual MIME type from the blob
      const mimeType = blob.type || 'image/jpeg';
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          } else {
            reject(new Error('Failed to read image'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(blob);
      });
      
      parts = [
        {
          text: promptText
        },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64
          }
        }
      ];
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  } else {
    parts = [{ text: promptText }];
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048, // Increased to ensure full response
          candidateCount: 1,
          stopSequences: [],
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`Failed to analyze content: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('Invalid response structure - no candidates:', data);
      throw new Error('Invalid API response: no candidates');
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      console.error('Invalid response structure - no content parts:', candidate);
      throw new Error('Invalid API response: no content parts');
    }
    
    const text = candidate.content.parts[0].text;
    if (!text) {
      console.error('No text in response:', candidate.content.parts[0]);
      throw new Error('Invalid API response: no text content');
    }
    
    // Log the full response for debugging
    console.log('Full text response:', text);
    
    // Clean the response text
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    
    // Try to find JSON object in the text
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonStart > jsonEnd) {
      console.error('No valid JSON structure found in text:', cleanedText);
      throw new Error('Invalid response format: no JSON found');
    }
    
    const jsonString = cleanedText.substring(jsonStart, jsonEnd + 1);
    
    try {
      const result = JSON.parse(jsonString);
      
      // Validate the result has required fields
      if (typeof result.hotLevel !== 'number' || typeof result.cringeLevel !== 'number' || !result.analysis) {
        console.error('Invalid JSON structure:', result);
        throw new Error('Invalid JSON structure: missing required fields');
      }
      
      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON:', jsonString);
      console.error('Parse error:', parseError);
      throw new Error('Invalid JSON in response');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze content. Please try again.');
  }
}

export async function generateHomeworkHelp(input: string, iqLevel: number, imageUri?: string): Promise<HomeworkAnalysis> {
  let parts: any[] = [];
  
  // Use the same Gemini 2.5 Flash Preview model
  const model = 'gemini-2.5-flash-preview-05-20';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  // Define IQ level personas
  const getPersona = (iq: number) => {
    if (iq <= 110) return {
      level: 'High School',
      style: 'Use simple, clear language. Explain concepts step-by-step with basic examples. Avoid jargon.',
      complexity: 'basic'
    };
    if (iq <= 120) return {
      level: 'College Freshman',
      style: 'Use standard academic language with some technical terms. Provide moderate detail and context.',
      complexity: 'intermediate'
    };
    if (iq <= 130) return {
      level: 'College Advanced',
      style: 'Use sophisticated academic language. Include theoretical frameworks and analytical depth.',
      complexity: 'advanced'
    };
    if (iq <= 140) return {
      level: 'Graduate Level',
      style: 'Use complex academic discourse. Reference advanced theories and methodologies.',
      complexity: 'graduate'
    };
    if (iq <= 150) return {
      level: 'Expert Level',
      style: 'Use professional academic language with nuanced analysis and cross-disciplinary connections.',
      complexity: 'expert'
    };
    return {
      level: 'Genius Level',
      style: 'Use highly sophisticated language with cutting-edge theoretical insights and original analysis.',
      complexity: 'genius'
    };
  };
  
  const persona = getPersona(iqLevel);
  
  // Build the prompt
  const promptText = `You are an intelligent homework assistant. Help with this ${imageUri ? 'homework image' : 'homework question'} by adapting your response to an IQ level of ${iqLevel} (${persona.level}).
        
${imageUri ? `Additional context: "${input}"` : `Question: "${input}"`}
        
Writing Style Instructions:
- IQ Level: ${iqLevel} (${persona.level})
- Style Guide: ${persona.style}
- Complexity: ${persona.complexity}

IMPORTANT: This is a proprietary feature that tailors responses to match the user's natural academic writing style and intellectual level.

You MUST provide your response as valid JSON only, with no markdown formatting or code blocks. Return ONLY this JSON structure:
{
  "solution": "[comprehensive answer/solution adapted to the specified IQ level${imageUri ? ' based on the image' : ''}]",
  "adaptedLevel": ${iqLevel},
  "stepByStep": ["step1", "step2", "step3"] (optional array of solution steps if applicable),
  "keyPoints": ["point1", "point2", "point3"] (optional array of key learning points),
  "writingStyle": "[brief explanation of how the response was adapted to the IQ level]"
}

Adapt the complexity, vocabulary, depth of analysis, and explanation style to match the specified IQ level.
For higher IQ levels, include more sophisticated analysis, theoretical frameworks, and nuanced insights.
For lower IQ levels, focus on clarity, step-by-step explanations, and practical examples.

IMPORTANT: Return ONLY the JSON object, no other text or formatting.`;

  if (imageUri) {
    try {
      // For image analysis, convert the image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Get the actual MIME type from the blob
      const mimeType = blob.type || 'image/jpeg';
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          } else {
            reject(new Error('Failed to read image'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(blob);
      });
      
      parts = [
        {
          text: promptText
        },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64
          }
        }
      ];
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  } else {
    parts = [{ text: promptText }];
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.7, // Balanced creativity and accuracy for educational content
          topK: 1,
          topP: 1,
          maxOutputTokens: 3072, // Increased for detailed homework help
          candidateCount: 1,
          stopSequences: [],
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`Failed to generate homework help: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('Invalid response structure - no candidates:', data);
      throw new Error('Invalid API response: no candidates');
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      console.error('Invalid response structure - no content parts:', candidate);
      throw new Error('Invalid API response: no content parts');
    }
    
    const text = candidate.content.parts[0].text;
    if (!text) {
      console.error('No text in response:', candidate.content.parts[0]);
      throw new Error('Invalid API response: no text content');
    }
    
    // Log the full response for debugging
    console.log('Full homework response:', text);
    
    // Clean the response text
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    
    // Try to find JSON object in the text
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonStart > jsonEnd) {
      console.error('No valid JSON structure found in text:', cleanedText);
      throw new Error('Invalid response format: no JSON found');
    }
    
    const jsonString = cleanedText.substring(jsonStart, jsonEnd + 1);
    
    try {
      const result = JSON.parse(jsonString);
      
      // Validate the result has required fields
      if (!result.solution || typeof result.adaptedLevel !== 'number') {
        console.error('Invalid JSON structure:', result);
        throw new Error('Invalid JSON structure: missing required fields');
      }
      
      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON:', jsonString);
      console.error('Parse error:', parseError);
      throw new Error('Invalid JSON in response');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate homework help. Please try again.');
  }
}