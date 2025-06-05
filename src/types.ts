export interface Post {
  id: string;
  title: string;
  description: string;
  companyName: string;
  location: string;
  employmentType: string;
  salary: string;
  experienceLevel?: string;
  experience?: string;
  skills: string[];
  postedDate: Date | string;
  companyLogo?: string;
  userId?: string;
  user?: {
    id: string;
    displayName?: string;
    photoURL?: string;
  };
  aiMatch?: number;
  aiMatchScore?: number;
  aiMatchReason?: string;
  aiMatchReasons?: string[];
  format?: string;
  requirements?: string[];
  benefits?: string[];
  authorId?: string;
  createdAt?: Date;
  status?: string;
  aiMatching?: boolean;
  skillsRequired?: string[];
  minExperience?: number;
  preferredUniversities?: string[];
  otherCriteria?: string;
  company?: string;
  city?: string;
  category?: string;
  responsibilities?: string[];
  gradeRange?: {
    // Added to match code usage
    min: number;
    max: number;
  };
}

export interface UserData {
  id?: string;
  uid: string;
  email: string;
  name?: string;
  displayName: string;
  role: 'student' | 'business';
  grade?: number;
  skills?: string[];
  interests?: string[];
  level?: number;
  xp?: number;
  savedPosts?: string[];
  education?: string;
  experience?: string;
  preferences?: {
    location?: string;
    salary?: string;
    type?: string;
  };
  about?: string;
  mode?: string;
  resumeData?: {
    education: string;
    skills: string;
    experience: string;
    achievements: string;
    languages: string[];
    portfolio: string;
  };
  createdAt?: string;
  premium?: boolean;
  bio?: string;
  location?: string;
  phoneNumber?: string;
  phone?: string;
  website?: string;
  company?: string;
  position?: string;
  yearsOfExperience?: number;
  photoURL?: string;
  university?: string;
  graduationYear?: string;
  major?: string;
  gpa?: string;
  industry?: string;
  employeeCount?: string;
  foundedYear?: string;
  linkedIn?: string;
  companyDescription?: string;
  points?: number;
  totalXp?: number;
  status?: string;
  languages?: string[] | string;
  achievements?: string[] | string;
  portfolio?: string[] | string;
  field?: string;
  age?: number;
  resumes?: any[];
}

// Keep other interfaces (User, AuthState) unchanged
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  savedPosts?: string[];
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface Filters {
  city: string;
  category: string;
  format: string;
  search: string;
  experience: string;
  salary: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp?: {
    toDate: () => Date;
  } | Date;
  createdAt?: {
    toDate: () => Date;
  } | Date;
  read: boolean;
  fileUrl?: string;
  fileType?: string;
}

export interface ChatData {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: { [key: string]: number };
  otherUser?: {
    id: string;
    name: string;
    role: string;
  };
}

// Micro-Internship Types
export interface MicroInternship {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  employerId: string;
  employer: {
    id: string;
    name: string;
    company: string;
    photoURL?: string;
  };
  xpReward: number;
  badgeId: string;
  badgeName: string;
  badgeImageUrl: string;
  deadline: Date | string;
  createdAt: Date | string;
  status: 'active' | 'completed' | 'expired';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  category: string;
  applicationsCount: number;
  completionsCount: number;
  aiTechSpec?: string; // Generated technical specification
}

export interface MicroApplication {
  id: string;
  microInternshipId: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    photoURL?: string;
    level: number;
  };
  status: 'applied' | 'in-progress' | 'submitted' | 'reviewed' | 'completed' | 'rejected';
  submissionUrl?: string; // Link to code repository or deployed solution
  submissionNotes?: string;
  submissionDate?: Date | string;
  aiReviewScore?: number;
  aiReviewFeedback?: string[];
  aiReviewDate?: Date | string;
  employerReview?: {
    rating: number; // 1-5 stars
    comment: string;
    feedbackPoints: string[];
    date: Date | string;
  };
  messages: MicroMessage[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MicroMessage {
  id: string;
  senderId: string;
  senderType: 'student' | 'employer' | 'ai';
  text: string;
  timestamp: Date | string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  xpValue: number;
  issuedCount: number;
  createdBy: string;
  createdAt: Date | string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
}

export interface AIPrompt {
  role: string;
  content: string;
}

export interface AIGuidanceTemplate {
  id: string;
  name: string;
  category: string;
  prompts: AIPrompt[];
  defaultContext: string;
} 