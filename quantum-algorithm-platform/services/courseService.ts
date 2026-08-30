import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabaseClient';
import { QUANTUM_COURSES } from '@/components/learning/coursesData';
import { Course, Lesson, LessonChallenge } from '@/components/learning/types';
import { BACKEND_URL } from '@/config';

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
        return { courses: QUANTUM_COURSES, isLive: false };
      }

      const courses = transformSupabaseDataToCourses(
        coursesRes.data,
        modulesRes.data || [],
        blocksRes.data || []
      );

      return { courses, isLive: true };
    } catch {
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
   * Fetch user progress records across Supabase, LocalStorage, and Backend Analytics.
   */
  async getUserProgress(userId: string = 'guest-learner'): Promise<UserProgressRecord[]> {
    const recordsMap = new Map<string, UserProgressRecord>();

    // 1. Try local storage first for offline / immediate sync
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('quantum_course_progress');
        if (stored) {
          const parsed: UserProgressRecord[] = JSON.parse(stored);
          parsed.forEach((r) => recordsMap.set(r.module_id, r));
        }
      } catch (e) {
        console.warn('Could not read local course progress:', e);
      }
    }

    // 2. Fetch from Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          data.forEach((r: any) => {
            recordsMap.set(r.module_id, {
              id: r.id,
              user_id: r.user_id,
              course_id: r.course_id,
              module_id: r.module_id,
              completed: Boolean(r.completed),
              xp_earned: r.xp_earned || 0,
              saved_qasm: r.saved_qasm,
              circuit_state: r.circuit_state,
              completed_at: r.completed_at,
            });
          });
        }
      } catch (err) {
        console.warn('Error fetching user progress from Supabase:', err);
      }
    }

    // 3. Sync from backend metrics if available
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/metrics`);
      if (res.ok) {
        const metrics = await res.json();
        const completedLessons: string[] = metrics.completed_lessons || [];
        completedLessons.forEach((mId) => {
          if (!recordsMap.has(mId)) {
            recordsMap.set(mId, {
              user_id: userId,
              course_id: '',
              module_id: mId,
              completed: true,
              xp_earned: 120,
            });
          }
        });
      }
    } catch {}

    return Array.from(recordsMap.values());
  },

  /**
   * Save user progress (upsert completion, xp, saved QASM) to Supabase, LocalStorage, and Backend Analytics.
   */
  async saveUserProgress(progress: UserProgressRecord): Promise<boolean> {
    // 1. Save to LocalStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('quantum_course_progress');
        const list: UserProgressRecord[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((p) => p.module_id !== progress.module_id);
        filtered.push({
          ...progress,
          completed_at: progress.completed ? new Date().toISOString() : undefined,
        });
        localStorage.setItem('quantum_course_progress', JSON.stringify(filtered));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
    }

    // 2. Notify Backend Analytics Engine
    try {
      await fetch(`${BACKEND_URL}/api/analytics/lesson-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: progress.course_id,
          lesson_id: progress.module_id,
          xp: progress.xp_earned || 120,
        }),
      });
    } catch (e) {
      console.warn('Could not sync lesson completion to backend analytics:', e);
    }

    // 3. Save to Supabase if connected
    const supabase = getSupabaseClient();
    if (!supabase) return true;

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
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Reset all user course tracking data to 0.
   */
  async resetAllProgress(userId: string = 'guest-learner'): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('quantum_course_progress');
      } catch {}
    }

    // Reset Backend Analytics
    try {
      await fetch(`${BACKEND_URL}/api/analytics/reset`, { method: 'POST' });
    } catch {}

    // Reset Supabase user_progress
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('user_progress').delete().eq('user_id', userId);
      } catch {}
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
