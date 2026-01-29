export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  NOTES = 'NOTES',
  ROUTINE = 'ROUTINE',
  STUDY = 'STUDY'
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: 'work' | 'personal' | 'meeting';
  date: Date;
  description?: string;
  recurrence?: RecurrenceType;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastEdited: Date;
  tags: string[];
}

export interface RoutineItem {
  id: string;
  time: string;
  activity: string;
  completed: boolean;
  icon?: string;
}

export interface RoutineResponse {
  routineName: string;
  items: {
    time: string;
    activity: string;
    icon: string;
  }[];
}

export interface StudyTopic {
  id: string;
  title: string;
  estimatedHours: number;
  completed: boolean;
}

export interface StudyModule {
  id: string;
  title: string;
  topics: StudyTopic[];
}

export interface StudyPlan {
  id: string;
  title: string;
  description: string;
  modules: StudyModule[];
  createdAt: Date;
  color: string; // For UI aesthetics
}

export interface StudyPlanResponse {
  title: string;
  description: string;
  modules: {
    title: string;
    topics: {
      title: string;
      estimatedHours: number;
    }[];
  }[];
}