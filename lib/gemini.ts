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

export interface NoteAnalysis {
  digitalText?: string;
  summary?: string;
  deeperInsights?: string;
  keyPoints?: string[];
  actionItems?: string[];
  processedType: 'textify' | 'summarize' | 'depth';
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

CRITICAL JSON FORMATTING REQUIREMENTS:
- You MUST return ONLY valid JSON with no additional text, explanations, or formatting
- ALL keys and string values MUST be enclosed in double quotes
- Do NOT use markdown code blocks, backticks, or any other formatting
- Do NOT include any text before or after the JSON object
- Ensure the JSON is complete and properly closed

Return ONLY this exact JSON structure:
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

CRITICAL: Return ONLY the JSON object with proper double quotes around all keys and string values.`;

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
          maxOutputTokens: 8192, // Further increased to prevent truncation
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
    
    // Enhanced JSON parsing with fallback mechanisms
    const parseJsonResponse = (responseText: string) => {
      // Clean the response text
      let cleanedText = responseText.trim();
      
      // Check if response appears to be truncated
      if (!cleanedText.endsWith('}') && !cleanedText.endsWith('"}')) {
        console.warn('Response appears to be truncated:', cleanedText.slice(-100));
        // Try to find the last complete JSON object
        const lastBraceIndex = cleanedText.lastIndexOf('}');
        if (lastBraceIndex > 0) {
          cleanedText = cleanedText.substring(0, lastBraceIndex + 1);
        }
      }
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      cleanedText = cleanedText.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      
      // Try to find JSON object in the text
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart > jsonEnd) {
        console.error('No valid JSON structure found in text:', cleanedText);
        throw new Error('Invalid response format: no JSON found');
      }
      
      let jsonString = cleanedText.substring(jsonStart, jsonEnd + 1);
      
      // First attempt: direct parsing
      try {
        const result = JSON.parse(jsonString);
        
        // Validate the result has required fields
        if (!result.solution || typeof result.adaptedLevel !== 'number') {
          console.error('Invalid JSON structure:', result);
          throw new Error('Invalid JSON structure: missing required fields');
        }
        
        return result;
      } catch (parseError) {
        console.log('Direct JSON parse failed, attempting to fix formatting...');
        
        // Second attempt: fix common JSON formatting issues
        try {
          // Handle truncated strings by closing them
          if (jsonString.match(/:\s*"[^"]*$/)) {
            jsonString = jsonString.replace(/:\s*"[^"]*$/, ': "Response truncated"');
          }
          
          // Handle incomplete arrays
          if (jsonString.match(/:\s*\[[^\]]*$/)) {
            jsonString = jsonString.replace(/:\s*\[[^\]]*$/, ': []');
          }
          
          // Fix unquoted keys
          let fixedJson = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
          
          // Fix single quotes to double quotes
          fixedJson = fixedJson.replace(/'/g, '"');
          
          // Fix trailing commas
          fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
          
          // Ensure the JSON ends properly
          if (!fixedJson.endsWith('}')) {
            fixedJson += '}';
          }
          
          const result = JSON.parse(fixedJson);
          
          // Validate the result has required fields
          if (!result.solution || typeof result.adaptedLevel !== 'number') {
            console.error('Invalid JSON structure after fixing:', result);
            throw new Error('Invalid JSON structure: missing required fields');
          }
          
          return result;
        } catch (secondParseError) {
          // Third attempt: Create a minimal valid response
          console.log('All parsing attempts failed, creating fallback response');
          return {
            solution: "I apologize, but I encountered an issue processing your homework question. Please try again with a shorter question or break it into smaller parts.",
            adaptedLevel: 120,
            stepByStep: ["Please try submitting your question again"],
            keyPoints: ["Response processing error occurred"],
            writingStyle: "Simplified due to processing error"
          };
        }
      }
    };
          console.error('Failed to parse JSON even after fixing:', jsonString);
          console.error('Original parse error:', parseError);
          console.error('Second parse error:', secondParseError);
          throw new Error('Invalid JSON in response');
        }
      }
    };
    
    return parseJsonResponse(text);
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate homework help. Please try again.');
  }
}

export async function processNote(
  input: string, 
  action: 'textify' | 'summarize' | 'depth',
  imageUri?: string,
  existingText?: string
): Promise<NoteAnalysis> {
  let parts: any[] = [];
  
  // Use the same Gemini 2.5 Flash Preview model
  const model = 'gemini-2.5-flash-preview-05-20';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  let promptText = '';
  
  if (action === 'textify') {
    promptText = `You are a note digitization expert. ${imageUri ? 'Extract and transcribe all text from this handwritten note image' : 'Process this text input'}.
        
${imageUri ? `Additional context: "${input}"` : `Text: "${input}"`}
        
Instructions:
- Extract ALL text accurately, maintaining structure and formatting
- Preserve bullet points, numbering, and organization
- Fix obvious spelling errors but maintain the original meaning
- Keep the same tone and style as the original
- If handwriting is unclear, use [unclear] notation

You MUST provide your response as valid JSON only, with no markdown formatting or code blocks. Return ONLY this JSON structure:
{
  "digitalText": "[complete transcribed text with proper formatting]",
  "processedType": "textify"
}

IMPORTANT: Return ONLY the JSON object, no other text or formatting.`;
  } else if (action === 'summarize') {
    const textToSummarize = existingText || input;
    promptText = `You are a note summarization expert. Create a concise, well-structured summary of this text.
        
Text to summarize: "${textToSummarize}"
        
Instructions:
- Create a clear, concise summary that captures the main points
- Use bullet points or numbered lists for clarity
- Maintain the key information and context
- Make it easy to scan and understand quickly
- Keep it roughly 1/3 the length of the original

You MUST provide your response as valid JSON only, with no markdown formatting or code blocks. Return ONLY this JSON structure:
{
  "summary": "[well-structured summary with bullet points]",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "processedType": "summarize"
}

IMPORTANT: Return ONLY the JSON object, no other text or formatting.`;
  } else if (action === 'depth') {
    const textToAnalyze = existingText || input;
    promptText = `You are an expert analyst. Provide deeper insights, context, and analysis for this content.
        
Content to analyze: "${textToAnalyze}"
        
Instructions:
- Add relevant context and background information
- Provide deeper analysis and insights
- Connect concepts to broader themes or applications
- Suggest related topics or areas to explore
- Include practical applications or implications
- Make connections that enhance understanding

You MUST provide your response as valid JSON only, with no markdown formatting or code blocks. Return ONLY this JSON structure:
{
  "deeperInsights": "[comprehensive analysis with added context and insights]",
  "actionItems": ["actionable insight 1", "actionable insight 2", "actionable insight 3"],
  "processedType": "depth"
}

IMPORTANT: Return ONLY the JSON object, no other text or formatting.`;
  }

  if (imageUri && action === 'textify') {
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
          temperature: 0.3, // Lower temperature for more accurate transcription/analysis
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
      throw new Error(`Failed to process note: ${response.status}`);
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
    console.log('Full note processing response:', text);
    
 
  }
}
  }
}   // Clean the response text
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
      
      // Validate the result has required fields based on action
      if (action === 'textify' && !result.digitalText) {
        console.error('Invalid JSON structure for textify:', result);
        throw new Error('Invalid JSON structure: missing digitalText');
      }
      if (action === 'summarize' && !result.summary) {
        console.error('Invalid JSON structure for summarize:', result);
        throw new Error('Invalid JSON structure: missing summary');
      }
      if (action === 'depth' && !result.deeperInsights) {
        console.error('Invalid JSON structure for depth:', result);
        throw new Error('Invalid JSON structure: missing deeperInsights');
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
    throw new Error('Failed to process note. Please try again.');
  }