import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { UserData } from '../types';

interface AIMatchCriteria {
  skillsRequired: string[];
  minExperience: number;
  location: string;
  preferredUniversities: string[];
  otherCriteria?: string;
}

interface MatchedCandidate {
  studentId: string;
  displayName: string;
  photoURL?: string;
  totalScore: number;
  skillMatch: number;
  experienceMatch: number;
  locationMatch: number;
  universityMatch: number;
  resumeQualityScore: number;
  matchedAt: Date;
}

/**
 * Match candidates based on job criteria
 * @param jobId The job ID to match candidates for
 * @param criteria The matching criteria
 * @returns Array of matched candidates sorted by score
 */
export const matchCandidates = async (jobId: string, criteria: AIMatchCriteria): Promise<MatchedCandidate[]> => {
  try {
    // Fetch all students
    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'school') // Assuming 'school' is the role for students
    );
    
    const studentsSnapshot = await getDocs(studentsQuery);
    const students = studentsSnapshot.docs.map(doc => ({ 
      ...doc.data(), 
      uid: doc.id 
    } as UserData));
    
    // Calculate match score for each student
    const matchedCandidates: MatchedCandidate[] = [];
    
    for (const student of students) {
      const totalScore = calculateMatchScore(student, criteria);
      
      if (totalScore > 0) {
        // Calculate individual match components for transparency
        const totalRequiredSkills = criteria.skillsRequired.length;
        const matchingSkills = student.skills ? 
          student.skills.filter(skill => 
            criteria.skillsRequired.some(reqSkill => 
              reqSkill.toLowerCase() === skill.toLowerCase()
            )
          ) : [];
        
        const skillMatch = totalRequiredSkills > 0 ? 
          matchingSkills.length / totalRequiredSkills : 0;
        
        const experienceMatch = Math.min(
          (student.yearsOfExperience || 0) / (criteria.minExperience || 1), 
          1
        );
        
        const locationMatch = student.location === criteria.location ? 1 : 0;
        
        const universityMatch = criteria.preferredUniversities.length > 0 && student.university
          ? criteria.preferredUniversities.some(uni => 
              uni.toLowerCase() === student.university?.toLowerCase()
            ) ? 1 : 0
          : 0;
        
        const resumeQualityScore = student.resumeData ? 1 : 0;
        
        matchedCandidates.push({
          studentId: student.uid,
          displayName: student.displayName || 'Anonymous Student',
          photoURL: student.photoURL,
          totalScore,
          skillMatch,
          experienceMatch,
          locationMatch,
          universityMatch,
          resumeQualityScore,
          matchedAt: new Date()
        });
      }
    }
    
    // Sort candidates by score (highest first)
    matchedCandidates.sort((a, b) => b.totalScore - a.totalScore);
    
    // Save top 10 candidates to Firestore
    await saveMatchedCandidates(jobId, matchedCandidates.slice(0, 10));
    
    return matchedCandidates.slice(0, 10);
  } catch (error) {
    console.error('Error matching candidates:', error);
    throw error;
  }
};

/**
 * Calculate match score for a student based on job criteria
 * @param student The student to calculate score for
 * @param criteria The job criteria
 * @returns Match score between 0 and 1
 */
const calculateMatchScore = (student: UserData, criteria: AIMatchCriteria): number => {
  // 1. Skills match
  const totalRequiredSkills = criteria.skillsRequired.length;
  const matchingSkills = student.skills ? 
    student.skills.filter(skill => 
      criteria.skillsRequired.some(reqSkill => 
        reqSkill.toLowerCase() === skill.toLowerCase()
      )
    ) : [];
  
  const skillMatch = totalRequiredSkills > 0 ? 
    matchingSkills.length / totalRequiredSkills : 0;
  
  // 2. Experience match (years of experience)
  const experienceMatch = Math.min(
    (student.yearsOfExperience || 0) / (criteria.minExperience || 1), 
    1
  );
  
  // 3. Location match
  const locationMatch = student.location === criteria.location ? 1 : 0;
  
  // 4. University match
  const universityMatch = criteria.preferredUniversities.length > 0 && student.university
    ? criteria.preferredUniversities.some(uni => 
        uni.toLowerCase() === student.university?.toLowerCase()
      ) ? 1 : 0
    : 0;
  
  // 5. Resume quality score
  const resumeQualityScore = student.resumeData ? 1 : 0;
  
  // Calculate weighted score
  const weightedScore = 
    (skillMatch * 0.4) + 
    (experienceMatch * 0.2) + 
    (locationMatch * 0.1) + 
    (universityMatch * 0.1) + 
    (resumeQualityScore * 0.2);
  
  return weightedScore;
};

/**
 * Save matched candidates to Firestore
 * @param jobId The job ID
 * @param candidates Array of matched candidates
 */
const saveMatchedCandidates = async (jobId: string, candidates: MatchedCandidate[]): Promise<void> => {
  try {
    // Clear existing matches first
    const matchesRef = collection(db, `jobs/${jobId}/matches`);
    const existingMatches = await getDocs(matchesRef);
    
    // Delete existing matches in batch
    for (const match of existingMatches.docs) {
      await setDoc(doc(db, `jobs/${jobId}/matches/${match.id}`), { deleted: true });
    }
    
    // Add new matches
    for (const candidate of candidates) {
      await setDoc(
        doc(db, `jobs/${jobId}/matches/${candidate.studentId}`),
        candidate
      );
    }
  } catch (error) {
    console.error('Error saving matched candidates:', error);
    throw error;
  }
};

/**
 * Get matched candidates for a job
 * @param jobId The job ID
 * @returns Array of matched candidates
 */
export const getMatchedCandidates = async (jobId: string): Promise<MatchedCandidate[]> => {
  try {
    const matchesQuery = query(collection(db, `jobs/${jobId}/matches`));
    const matchesSnapshot = await getDocs(matchesQuery);
    
    const matches = matchesSnapshot.docs
      .map(doc => doc.data() as MatchedCandidate)
      .filter(match => !match.deleted)
      .sort((a, b) => b.totalScore - a.totalScore);
    
    return matches;
  } catch (error) {
    console.error('Error getting matched candidates:', error);
    return [];
  }
};

/**
 * Trigger the matching process after a job is created or updated
 * @param jobId The job ID
 * @returns True if successful, false otherwise
 */
export const triggerCandidateMatching = async (jobId: string): Promise<boolean> => {
  try {
    // Get the job data
    const jobDoc = await getDoc(doc(db, 'posts', jobId));
    
    if (!jobDoc.exists()) {
      console.error(`Job ${jobId} not found`);
      return false;
    }
    
    const jobData = jobDoc.data();
    
    // Check if AI matching is enabled
    if (!jobData.aiMatching) {
      console.log(`AI matching is not enabled for job ${jobId}`);
      return false;
    }
    
    // Extract matching criteria
    const criteria: AIMatchCriteria = {
      skillsRequired: jobData.skillsRequired || [],
      minExperience: jobData.minExperience || 0,
      location: jobData.location || '',
      preferredUniversities: jobData.preferredUniversities || [],
      otherCriteria: jobData.otherCriteria
    };
    
    // Match candidates
    await matchCandidates(jobId, criteria);
    
    return true;
  } catch (error) {
    console.error('Error triggering candidate matching:', error);
    return false;
  }
}; 