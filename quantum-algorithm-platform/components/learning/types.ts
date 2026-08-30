export interface LessonChallenge {
  title: string;
  targetDescription: string;
  mathTarget: string;
  requirements: string[];
  expectedState: string;
  expectedProbabilities: Record<string, number>;
  xpReward: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  number: number;
  title: string;
  subtitle?: string;
  duration: string;
  level: string;
  completed: boolean;
  conceptHeading: string;
  conceptBody: string[];
  keyInsight?: string;
  realWorldApplication?: string;
  historicalNote?: string;
  illustrationUrl?: string;
  illustrationCaption?: string;
  showBlochSphere?: boolean;
  predictionCheckpoint?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  calloutComparison?: {
    leftTitle: string;
    leftContent: string;
    rightTitle: string;
    rightContent: string;
  };
  interactiveExample?: {
    initialState: string;
    description: string;
    supportedGates: string[];
  };
  starterQasm: string;
  starterCircuitGates?: Array<{ name: string; qubit: number; step: number; params?: number[] }>;
  availableGates: string[];
  numQubits: number;
  challenge: LessonChallenge;
  hints: string[];
}

export interface Course {
  id: string;
  number: string;
  title: string;
  code: string;
  level: string;
  category: string;
  description: string;
  lessonsCount: number;
  completedLessonsCount: number;
  status: 'complete' | 'active' | 'open' | 'locked';
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  cardBg: string;
  cardBorder: string;
  accentColor: string;
  lessons: Lesson[];
  linkedChallengeId?: string;
}
