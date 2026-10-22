export type Stage = 'try' | 'do' | 'choose';
export type Role = 'student' | 'mentor' | 'teacher' | 'parent' | 'judge';
export type Level = 'exploring' | 'developing' | 'confident';

export interface Student {
  id: string;
  nickname: string;
  grade: number; // 7–12
  stage: Stage;
  interests: string[];
  consentStatus: 'granted' | 'pending';
  avatarColor: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: 'volunteer' | 'shadowing' | 'internship';
  format: 'onsite' | 'online';
  durationHours: number;
  stage: Stage;
  skills: string[];
  interestTags: string[];
  supervisionNote: string;
  mentorId: string;
  capacity: number;
  description: string;
  schedule: string;
  expect: string[];
  location: string;
}

export interface Experience {
  id: string;
  studentId: string;
  opportunityId: string;
  date: string;
  reflection: string;
  enjoyment: number;
  energy: number;
  skillTags: string[];
  evidence: { label: string; color: string }[];
  mentorFeedbackId?: string;
}

export interface MentorFeedback {
  id: string;
  mentorId: string;
  strengths: string[];
  growthAreas: string[];
  note: string;
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  organization: string;
}

export interface SkillArea {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface SkillSnapshot {
  studentId: string;
  grade: number;
  skills: { skillAreaId: string; level: Level }[];
}

export interface WellbeingCheckin {
  studentId: string;
  date: string;
  stress: number;
  confidence: number;
  private: true;
}

export interface ProgramSuggestion {
  id: string;
  university: string;
  faculty: string;
  program: string;
  reasons: { text: string; experienceId?: string }[];
  fitTags: string[];
  unexpected?: boolean;
}

export interface Portfolio {
  studentId: string;
  selectedExperienceIds: string[];
  order: string[];
  exportStatus: 'draft' | 'exported';
}

export interface ConsentRecord {
  studentId: string;
  parentName: string;
  scope: string[];
  date: string;
}

export interface PilotKPI {
  name: string;
  baseline: number | null;
  after: number | null;
  target: string;
  unit: string;
  direction: 'down' | 'up';
}
