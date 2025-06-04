import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GenerativeModel } from '@google/generative-ai';
import { UserData, MicroInternship, MicroApplication } from '../types';

// Initialize Gemini AI
// We're using environment variable, but have a fallback for development
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDOhnsWVQWjF2d4Fjphg2c-vPE9zkNYJ_A';
const genAI = new GoogleGenerativeAI(API_KEY);

// Interface for candidate evaluation result
export interface CandidateEvaluation {
  match: number; // 0-100 score
  reason: string; // Explanation of the match
  candidateId: string;
  displayName: string;
  photoURL?: string;
  evaluatedAt: Date;
}

/**
 * Rule-based pre-filtering of candidates
 * This helps reduce API calls by eliminating completely irrelevant candidates
 */
export function preFilterCandidates(
  internship: MicroInternship,
  applications: MicroApplication[]
): MicroApplication[] {
  return applications.filter(application => {
    // Ensure the application has related data
    if (!application.student) return false;
    
    // Keep candidates who have at least one matching skill
    // If the candidate has skills defined in their profile
    const userData = application.student as UserData & { skills?: string[] };
    if (userData.skills && userData.skills.length > 0) {
      return userData.skills.some(skill => 
        internship.skills.some(requiredSkill => 
          requiredSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(requiredSkill.toLowerCase())
        )
      );
    }
    
    // If no skills defined, still consider them (benefit of doubt)
    return true;
  });
}

/**
 * Evaluates a single candidate against a job using Gemini AI
 */
export async function evaluateCandidate(
  internship: MicroInternship,
  application: MicroApplication,
  userData?: UserData
): Promise<CandidateEvaluation> {
  try {
    // Get the Gemini model
    const model: GenerativeModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Combine data from application and userData (if available)
    const candidate = {
      id: application.studentId,
      name: application.student?.name || 'Unknown',
      photoURL: application.student?.photoURL,
      level: application.student?.level || 1,
      // Additional data from UserData if available
      skills: userData?.skills || [],
      education: userData?.education || '',
      experience: userData?.experience || '',
      bio: userData?.bio || '',
      university: userData?.university || '',
      major: userData?.major || '',
      graduationYear: userData?.graduationYear || '',
      yearsOfExperience: userData?.yearsOfExperience || 0,
    };
    
    // Create detailed prompt for Gemini
    const prompt = `
You are an expert HR AI assistant for JumysAL, an educational platform that connects students with micro-internships.
Your task is to evaluate how well a candidate matches a micro-internship opportunity.

# MICRO-INTERNSHIP DETAILS
- Title: ${internship.title}
- Description: ${internship.description}
- Required Skills: ${internship.skills.join(', ')}
- Requirements: ${internship.requirements.join(', ')}
- Difficulty Level: ${internship.difficulty}
- Category: ${internship.category}
- Estimated Hours: ${internship.estimatedHours}

# CANDIDATE DETAILS
- Name: ${candidate.name}
- Skills: ${candidate.skills.length > 0 ? candidate.skills.join(', ') : 'Not specified'}
- Education: ${candidate.education || 'Not specified'}
- Experience: ${candidate.experience || 'Not specified'}
- University: ${candidate.university || 'Not specified'}
- Major: ${candidate.major || 'Not specified'}
- Graduation Year: ${candidate.graduationYear || 'Not specified'}
- Years of Experience: ${candidate.yearsOfExperience || 'Not specified'}
- Bio: ${candidate.bio || 'Not specified'}
- Level in platform: ${candidate.level}

# TASK
1. Evaluate how well this candidate matches the micro-internship requirements
2. Provide a match percentage (0-100)
3. Give a brief explanation for your evaluation

Return ONLY a JSON object with the following format:
\`\`\`json
{"match": number, "reason": "string explanation"}
\`\`\`
`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    // The response might contain ```json and ``` markers or other text,
    // so we need to extract just the JSON part
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('Failed to extract JSON from Gemini response:', text);
      return {
        match: 0,
        reason: 'Failed to evaluate candidate',
        candidateId: application.studentId,
        displayName: candidate.name,
        photoURL: candidate.photoURL,
        evaluatedAt: new Date()
      };
    }
    
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        match: parsed.match,
        reason: parsed.reason,
        candidateId: application.studentId,
        displayName: candidate.name,
        photoURL: candidate.photoURL,
        evaluatedAt: new Date()
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        match: 0,
        reason: 'Error in evaluation process',
        candidateId: application.studentId,
        displayName: candidate.name,
        photoURL: candidate.photoURL,
        evaluatedAt: new Date()
      };
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      match: 0,
      reason: 'Error connecting to AI service',
      candidateId: application.studentId,
      displayName: application.student?.name || 'Unknown',
      photoURL: application.student?.photoURL,
      evaluatedAt: new Date()
    };
  }
}

/**
 * Batch evaluate multiple candidates and return sorted results
 */
export async function evaluateCandidates(
  internship: MicroInternship, 
  applications: MicroApplication[],
  userDataMap?: Record<string, UserData>
): Promise<CandidateEvaluation[]> {
  // Apply rule-based pre-filtering
  const filteredApplications = preFilterCandidates(internship, applications);
  
  // Limit to top 10 candidates if more than 10 (to save on API calls)
  const candidatesToEvaluate = filteredApplications.slice(0, 10);
  
  // Evaluate each candidate
  const evaluationPromises = candidatesToEvaluate.map(application => 
    evaluateCandidate(
      internship, 
      application, 
      userDataMap?.[application.studentId]
    )
  );
  
  // Wait for all evaluations to complete
  const evaluations = await Promise.all(evaluationPromises);
  
  // Sort by match score (highest first)
  return evaluations.sort((a, b) => b.match - a.match);
} 