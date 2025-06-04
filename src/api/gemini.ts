import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Initialize the Google Generative AI client
// Use a fallback for API_KEY to prevent runtime errors if environment variable is missing
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL_NAME = "gemini-1.5-pro-latest"; // Standardize on the latest model

// Initialize the client only if API key is available
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

// Safety settings configuration
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Function to generate text using Gemini API
export async function generateText(prompt: string, role: string = 'career advisor') {
  try {
    // Check if API key is configured
    if (!API_KEY) {
      console.error('Gemini API key is not configured');
      return {
        success: false,
        error: 'API key not configured. Please contact the administrator.'
      };
    }

    // Check if client is initialized
    if (!genAI) {
      console.error('Gemini client initialization failed');
      return {
        success: false,
        error: 'AI service initialization failed. Please try again later.'
      };
    }

    // Select the model
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      safetySettings,
    });

    // Create system instruction based on role
    let systemInstruction = '';
    
    if (role === 'career advisor') {
      systemInstruction = 'You are an AI career advisor for JumysAL, a career platform for Kazakhstan. ' +
        'Provide helpful career advice tailored for Kazakhstan\'s job market. ' +
        'Be encouraging, positive, and provide specific actionable advice. ' +
        'Keep responses concise and focused on practical steps.';
    } else if (role === 'resume generator') {
      systemInstruction = 'You are an AI resume creator for JumysAL, a career platform for Kazakhstan. ' +
        'Create professional, modern resumes based on the information provided. ' +
        'Format using markdown with clear sections for experience, skills, education, etc. ' +
        'Highlight strengths and achievements in a professional tone. ' +
        'Keep the resume content appropriate for Kazakhstan\'s job market.';
    }

    // Form the full prompt
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;
    
    // Get response from the model with timeout handling
    const result = await Promise.race([
      model.generateContent(fullPrompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 30000)
      )
    ]) as any;
    
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      data: text
    };
    
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return {
      success: false,
      error: errorMessage === 'Request timed out'
        ? 'The AI service took too long to respond. Please try again later.'
        : errorMessage
    };
  }
}

// Generate a professional resume with detailed formatting
export async function generateResume(profileData: any) {
  try {
    if (!profileData?.displayName) {
      return { success: false, error: 'Недостаточно данных для генерации резюме.' };
    }

    const prompt = `
You are a professional resume writer. Generate a **PDF‑ready**, **two‑column** resume layout in **plain HTML + Tailwind CSS classes**, based on the following JSON.  
**Output only the HTML fragment**, without any markdown or extra comments.

**Input JSON**:
${JSON.stringify(profileData, null, 2)}

**Requirements**:
1. **Container**:  
   \`<div class="grid grid-cols-[250px_1fr] gap-8 p-8 bg-white text-gray-800">\`

2. **Left column** (dark background):
   - Photo:  
     \`<img class="w-32 h-32 rounded-full border-4 border-teal-400 mx-auto mb-6" src="...">\`
   - **Contact** section (icon + text, small uppercase header).
   - **Skills** as pills:  
     \`<span class="px-2 py-1 bg-gray-800 text-teal-400 rounded-full text-xs">Skill</span>\`
   - **Education** entries: degree, school, dates.
   - **Languages** list with proficiency badges.
   - **Interests** list with bullets.

3. **Right column** (light background):
   - **Header** with name (\`<h1 class="text-3xl font-bold">\`) и должность (\`<h2 class="text-xl text-gray-600">\`).
   - **Professional Summary** paragraph (\`<p class="mt-4 text-gray-700 leading-relaxed">\`).
   - **Experience**:
     - For each job:
       \`\`\`html
       <div class="mb-6">
         <h3 class="font-semibold text-lg">Job Title</h3>
         <span class="text-sm text-gray-500">Company • Dates • Location</span>
         <ul class="list-disc list-inside mt-2 text-gray-700">
           <li>Achievement or responsibility</li>
           <!-- ... -->
         </ul>
       </div>
       \`\`\`
   - **Certifications / Courses**:
     \`\`\`html
     <p class="mt-3">
       <strong>Course Name</strong>
       <span class="text-sm text-gray-500">(Provider, Type)</span>
     </p>
     \`\`\`

4. **Styling**:  
   - Только Tailwind‑классы, без inline‑стилей  
   - Чёткое разделение секций: \`border-b pb-2 mb-4\` для заголовков

5. **Output**:  
   Верни **только** готовый HTML‑фрагмент.

---

`;

    // вызываем утилиту генерации текста
    return generateText(prompt, 'professional resume generator');
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ошибка генерации резюме.' };
  }
} 