import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabaseClient';
import { QUANTUM_COURSES } from '@/components/learning/coursesData';
import { Course, Lesson, LessonChallenge } from '@/components/learning/types';

export interface LessonBlockRecord {
  id: string;
  module_id: string;
  block_type: 'theory' | 'prediction' | 'interactive' | 'simulation' | 'ai_question' | 'challenge';
  order_index: number;
  content: any;
  created_at?: string;
}

export interface UserProgressRecord {
  id?: string;
  user_id: string;
  course_id: string;
  module_id: string;
  completed: boolean;
  xp_earned: number;
  saved_qasm?: string;
  circuit_state?: any;
  completed_at?: string;
}

export interface UserNoteRecord {
  id?: string;
  user_id: string;
  module_id: string;
  note_text: string;
  updated_at?: string;
}

/**
 * Transforms Supabase database rows into the Course interface used by the UI.
 */
function transformSupabaseDataToCourses(
  coursesRows: any[],
  modulesRows: any[],
  blocksRows: any[]
): Course[] {
  const blocksByModuleId = new Map<string, LessonBlockRecord[]>();
  for (const block of blocksRows) {
    const list = blocksByModuleId.get(block.module_id) || [];
    list.push(block);
    blocksByModuleId.set(block.module_id, list);
  }

  const modulesByCourseId = new Map<string, Lesson[]>();
  for (const mod of modulesRows) {
    const blocks = blocksByModuleId.get(mod.id) || [];
    blocks.sort((a, b) => a.order_index - b.order_index);

    const theoryBlock = blocks.find((b) => b.block_type === 'theory')?.content;
    const interactiveBlock = blocks.find((b) => b.block_type === 'interactive')?.content;
    const simulationBlock = blocks.find((b) => b.block_type === 'simulation')?.content;
    const aiQuestionBlock = blocks.find((b) => b.block_type === 'ai_question')?.content;
    const challengeBlock = blocks.find((b) => b.block_type === 'challenge')?.content;

    const lesson: Lesson = {
      id: mod.id,
      courseId: mod.course_id,
      number: mod.number,
      title: mod.title,
      subtitle: mod.subtitle || undefined,
      duration: mod.duration,
      level: mod.level,
      completed: false,
      conceptHeading: mod.concept_heading,
      conceptBody: theoryBlock?.paragraphs || [],
      keyInsight: mod.key_insight || theoryBlock?.key_insight || undefined,
      realWorldApplication: mod.real_world_application || theoryBlock?.real_world_application || undefined,
      historicalNote: mod.historical_note || theoryBlock?.historical_note || undefined,
      illustrationUrl: mod.illustration_url || theoryBlock?.illustration_url || undefined,
      illustrationCaption: mod.illustration_caption || theoryBlock?.illustration_caption || undefined,
      calloutComparison: theoryBlock?.comparison || undefined,
      interactiveExample: interactiveBlock || undefined,
      starterQasm: mod.starter_qasm || simulationBlock?.starter_qasm || '',
      starterCircuitGates: simulationBlock?.starter_circuit_gates || [],
      availableGates: mod.available_gates || simulationBlock?.available_gates || ['h', 'x', 'z'],
      numQubits: mod.num_qubits || simulationBlock?.num_qubits || 1,
      challenge: challengeBlock || {
        title: mod.title,
        targetDescription: 'Complete circuit challenge',
        mathTarget: '|ψ⟩ = |0⟩',
        requirements: ['Construct quantum circuit'],
        expectedState: '|0⟩',
        expectedProbabilities: { '0': 1.0 },
        xpReward: 100,
      },
      hints: aiQuestionBlock?.hints || [],
    };

    const list = modulesByCourseId.get(mod.course_id) || [];
    list.push(lesson);
    modulesByCourseId.set(mod.course_id, list);
  }

  return coursesRows.map((courseRow) => {
    const lessons = modulesByCourseId.get(courseRow.id) || [];
    lessons.sort((a, b) => a.number - b.number);

    return {
      id: courseRow.id,
      number: courseRow.number,
      title: courseRow.title,
      code: courseRow.code,
      level: courseRow.level,
      category: courseRow.category,
      description: courseRow.description,
      lessonsCount: courseRow.lessons_count || lessons.length,
      completedLessonsCount: courseRow.completed_lessons_count || 0,
      status: courseRow.status,
      badgeBg: courseRow.badge_bg,
      badgeBorder: courseRow.badge_border,
      badgeText: courseRow.badge_text,
      cardBg: courseRow.card_bg,
      cardBorder: courseRow.card_border,
      accentColor: courseRow.accent_color,
      linkedChallengeId: courseRow.linked_challenge_id || undefined,
      lessons,
    };
  });
}

/**
 * Service to fetch courses, modules, lesson blocks, user progress, and user notes.
 */
export const CourseService = {
  /**
   * Fetch all courses from Supabase. Falls back to local seed data if offline/unconfigured.
   */
  async getAllCourses(): Promise<{ courses: Course[]; isLive: boolean }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { courses: QUANTUM_COURSES, isLive: false };
    }

    try {
      const [coursesRes, modulesRes, blocksRes] = await Promise.all([
        supabase.from('courses').select('*').order('order_index', { ascending: true }),
        supabase.from('modules').select('*').order('order_index', { ascending: true }),
        supabase.from('lesson_blocks').select('*').order('order_index', { ascending: true }),
      ]);

      if (coursesRes.error || !coursesRes.data || coursesRes.data.length === 0) {
        console.warn('Supabase courses empty or error, using local curriculum:', coursesRes.error?.message);
        return { courses: QUANTUM_COURSES, isLive: false };
      }

      const courses = transformSupabaseDataToCourses(
        coursesRes.data,
        modulesRes.data || [],
        blocksRes.data || []
      );

      return { courses, isLive: true };
    } catch (err) {
      console.error('Error fetching courses from Supabase, falling back to local:', err);
      return { courses: QUANTUM_COURSES, isLive: false };
    }
  },

  /**
   * Fetch a single course with all its lessons and granular blocks.
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    const { courses } = await this.getAllCourses();
    return courses.find((c) => c.id === courseId) || null;
  },

  /**
   * Fetch granular lesson blocks for a specific module.
   */
  async getLessonBlocks(moduleId: string): Promise<LessonBlockRecord[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('lesson_blocks')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error(`Error fetching blocks for module ${moduleId}:`, error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching lesson blocks:', err);
      return [];
    }
  },

  /**
   * Fetch user progress records.
   */
  async getUserProgress(userId: string): Promise<UserProgressRecord[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user progress:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching user progress:', err);
      return [];
    }
  },

  /**
   * Save user progress (upsert completion, xp, saved QASM).
   */
  async saveUserProgress(progress: UserProgressRecord): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('user_progress').upsert(
        {
          user_id: progress.user_id,
          course_id: progress.course_id,
          module_id: progress.module_id,
          completed: progress.completed,
          xp_earned: progress.xp_earned,
          saved_qasm: progress.saved_qasm,
          circuit_state: progress.circuit_state,
          completed_at: progress.completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_id' }
      );

      if (error) {
        console.error('Error saving user progress to Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error saving user progress:', err);
      return false;
    }
  },

  /**
   * Fetch user note for a module.
   */
  async getUserNote(userId: string, moduleId: string): Promise<string> {
    const supabase = getSupabaseClient();
    if (!supabase) return '';

    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('note_text')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (error) return '';
      return data?.note_text || '';
    } catch {
      return '';
    }
  },

  /**
   * Save user note for a module.
   */
  async saveUserNote(userId: string, moduleId: string, noteText: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('user_notes').upsert(
        {
          user_id: userId,
          module_id: moduleId,
          note_text: noteText,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_id' }
      );

      return !error;
    } catch {
      return false;
    }
  },
};
