import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GenerativeModel } from '@google/generative-ai';

// Import correct types for Firebase Functions v2
import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Initialize Gemini AI with environment variable
const API_KEY = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(API_KEY);

interface CandidateEvaluation {
  match: number; // 0-100 score
  reason: string; // Explanation of the match
  candidateId: string;
  displayName: string;
  photoURL?: string;
  evaluatedAt: admin.firestore.Timestamp;
}

// Define types for function parameters
interface EvaluateCandidateData {
  microInternshipId: string;
  candidateId: string;
}

interface EvaluateAllCandidatesData {
  microInternshipId: string;
  limit?: number;
}

/**
 * Firebase Cloud Function to evaluate a candidate for a micro-internship
 */
export const evaluateCandidate = onCall<EvaluateCandidateData>(async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to evaluate candidates');
  }

  const data = request.data;
  
  const { microInternshipId, candidateId } = data;
  
  if (!microInternshipId || !candidateId) {
    throw new HttpsError(
      'invalid-argument',
      'The function must be called with microInternshipId and candidateId arguments.'
    );
  }

  try {
    // Get the micro-internship data
    const internshipDoc = await db.collection('microInternships').doc(microInternshipId).get();
    
    if (!internshipDoc.exists) {
      throw new HttpsError(
        'not-found',
        'The specified micro-internship was not found.'
      );
    }
    
    const internship = internshipDoc.data()!;
    
    // Check if the authenticated user owns this internship
    if (internship.employerId !== request.auth.uid) {
      throw new HttpsError(
        'permission-denied',
        'You can only evaluate candidates for your own micro-internships.'
      );
    }
    
    // Get the application data
    const applicationDoc = await db
      .collection('microApplications')
      .where('microInternshipId', '==', microInternshipId)
      .where('studentId', '==', candidateId)
      .limit(1)
      .get();
    
    if (applicationDoc.empty) {
      throw new HttpsError(
        'not-found',
        'No application found for this candidate and micro-internship.'
      );
    }
    
    const application = applicationDoc.docs[0].data();
    
    // Get additional student data if available
    const studentDoc = await db.collection('users').doc(candidateId).get();
    const userData = studentDoc.exists ? studentDoc.data() : null;
    
    // Combine data for evaluation
    const candidate = {
      id: candidateId,
      name: application.student?.name || userData?.displayName || 'Unknown',
      photoURL: application.student?.photoURL || userData?.photoURL,
      level: application.student?.level || 1,
      // Additional data from userData if available
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

    // Get Gemini model
    const model: GenerativeModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new HttpsError(
        'internal',
        'Failed to extract evaluation results from AI response.'
      );
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Create evaluation result
    const evaluation: CandidateEvaluation = {
      match: parsed.match,
      reason: parsed.reason,
      candidateId: candidateId,
      displayName: candidate.name,
      photoURL: candidate.photoURL,
      evaluatedAt: admin.firestore.Timestamp.now()
    };
    
    // Store the evaluation result
    await db.collection('microInternships')
      .doc(microInternshipId)
      .collection('evaluations')
      .doc(candidateId)
      .set(evaluation);
      
    // Update the application with the AI match score
    await db.collection('microApplications')
      .doc(applicationDoc.docs[0].id)
      .update({
        aiMatchScore: parsed.match,
        aiMatchReason: parsed.reason,
        aiEvaluationDate: admin.firestore.Timestamp.now()
      });
    
    return evaluation;
    
  } catch (error) {
    console.error('Error evaluating candidate:', error);
    throw new HttpsError(
      'internal',
      'An error occurred while evaluating the candidate.',
      error as Error
    );
  }
});

/**
 * Firebase Cloud Function to evaluate all candidates for a micro-internship
 */
export const evaluateAllCandidates = onCall<EvaluateAllCandidatesData>(async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to evaluate candidates');
  }

  const data = request.data;
  
  const { microInternshipId, limit = 10 } = data;
  
  if (!microInternshipId) {
    throw new HttpsError(
      'invalid-argument',
      'The function must be called with a microInternshipId argument.'
    );
  }

  try {
    // Get the micro-internship data
    const internshipDoc = await db.collection('microInternships').doc(microInternshipId).get();
    
    if (!internshipDoc.exists) {
      throw new HttpsError(
        'not-found',
        'The specified micro-internship was not found.'
      );
    }
    
    const internship = internshipDoc.data()!;
    
    // Check if the authenticated user owns this internship
    if (internship.employerId !== request.auth.uid) {
      throw new HttpsError(
        'permission-denied',
        'You can only evaluate candidates for your own micro-internships.'
      );
    }
    
    // Get all applications for this micro-internship
    const applicationsSnapshot = await db
      .collection('microApplications')
      .where('microInternshipId', '==', microInternshipId)
      .limit(limit)
      .get();
    
    if (applicationsSnapshot.empty) {
      return { message: 'No applications found for this micro-internship.', evaluations: [] };
    }
    
    const applications = applicationsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
    
    // Collect all candidate IDs
    const candidateIds = applications.map((app: any) => app.studentId);
    
    // Get additional user data for all candidates
    const usersSnapshot = await db
      .collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', candidateIds)
      .get();
    
    // Create a map of user data
    const userDataMap: Record<string, any> = {};
    usersSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      userDataMap[doc.id] = doc.data();
    });
    
    // Evaluate each candidate
    const evaluationPromises = applications.map(async (application: any) => {
      try {
        // Combine data for evaluation
        const userData = userDataMap[application.studentId];
        
        const candidate = {
          id: application.studentId,
          name: application.student?.name || userData?.displayName || 'Unknown',
          photoURL: application.student?.photoURL || userData?.photoURL,
          level: application.student?.level || 1,
          // Additional data from userData if available
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

        // Get Gemini model
        const model: GenerativeModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        
        // Call Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          throw new Error('Failed to extract evaluation results from AI response.');
        }
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Create evaluation result
        const evaluation: CandidateEvaluation = {
          match: parsed.match,
          reason: parsed.reason,
          candidateId: application.studentId,
          displayName: candidate.name,
          photoURL: candidate.photoURL,
          evaluatedAt: admin.firestore.Timestamp.now()
        };
        
        // Store the evaluation result
        await db.collection('microInternships')
          .doc(microInternshipId)
          .collection('evaluations')
          .doc(application.studentId)
          .set(evaluation);
          
        // Update the application with the AI match score
        await db.collection('microApplications')
          .doc(application.id)
          .update({
            aiMatchScore: parsed.match,
            aiMatchReason: parsed.reason,
            aiEvaluationDate: admin.firestore.Timestamp.now()
          });
        
        return evaluation;
        
      } catch (error) {
        console.error(`Error evaluating candidate ${application.studentId}:`, error);
        return {
          match: 0,
          reason: 'Error during evaluation',
          candidateId: application.studentId,
          displayName: application.student?.name || 'Unknown',
          photoURL: application.student?.photoURL,
          evaluatedAt: admin.firestore.Timestamp.now()
        };
      }
    });
    
    // Wait for all evaluations to complete
    const evaluations = await Promise.all(evaluationPromises);
    
    // Sort by match score (highest first)
    const sortedEvaluations = evaluations.sort((a: any, b: any) => b.match - a.match);
    
    return { 
      message: `Evaluated ${evaluations.length} candidates.`,
      evaluations: sortedEvaluations
    };
    
  } catch (error) {
    console.error('Error evaluating all candidates:', error);
    throw new HttpsError(
      'internal',
      'An error occurred while evaluating candidates.',
      error as Error
    );
  }
}); 