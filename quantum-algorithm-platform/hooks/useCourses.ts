'use client'

import { useState, useEffect, useCallback } from 'react';
import { Course, Lesson } from '@/components/learning/types';
import { CourseService, LessonBlockRecord, UserProgressRecord } from '@/services/courseService';
import { QUANTUM_COURSES } from '@/components/learning/coursesData';

interface UseCoursesReturn {
  courses: Course[];
  isLoading: boolean;
  isLiveSupabase: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markLessonComplete: (courseId: string, lessonId: string, xp: number) => Promise<void>;
  resetAllProgress: () => Promise<void>;
  getLessonBlocks: (lessonId: string) => Promise<LessonBlockRecord[]>;
}

export function useCourses(userId: string = 'guest-learner'): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>(QUANTUM_COURSES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { courses: loadedCourses, isLive } = await CourseService.getAllCourses();
      setIsLiveSupabase(isLive);

      // If user progress exists, merge completion states
      const progressRecords = await CourseService.getUserProgress(userId);
      const completedSet = new Set(
        progressRecords.filter((p) => p.completed).map((p) => p.module_id)
      );

      const mergedCourses: Course[] = loadedCourses.map((course) => {
        let completedCount = 0;
        const updatedLessons = course.lessons.map((lesson) => {
          const isDone = completedSet.has(lesson.id);
          if (isDone) completedCount++;
          return { ...lesson, completed: isDone };
        });

        const status: Course['status'] =
          completedCount === course.lessonsCount && course.lessonsCount > 0
            ? 'complete'
            : completedCount > 0
            ? 'active'
            : 'open';

        return {
          ...course,
          lessons: updatedLessons,
          completedLessonsCount: completedCount,
          status,
        };
      });

      setCourses(mergedCourses);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err?.message || 'Failed to load courses');
      setCourses(QUANTUM_COURSES);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const markLessonComplete = async (courseId: string, lessonId: string, xp: number) => {
    // 1. Optimistic local update
    setCourses((prevCourses) =>
      prevCourses.map((course) => {
        if (course.id !== courseId) return course;
        let completedCount = 0;
        const updatedLessons = course.lessons.map((l) => {
          const isDone = l.id === lessonId ? true : l.completed;
          if (isDone) completedCount++;
          return { ...l, completed: isDone };
        });

        const status: Course['status'] =
          completedCount === course.lessonsCount && course.lessonsCount > 0
            ? 'complete'
            : completedCount > 0
            ? 'active'
            : 'open';

        return {
          ...course,
          lessons: updatedLessons,
          completedLessonsCount: completedCount,
          status,
        };
      })
    );

    // 2. Persist to Supabase, LocalStorage, and Backend Analytics
    await CourseService.saveUserProgress({
      user_id: userId,
      course_id: courseId,
      module_id: lessonId,
      completed: true,
      xp_earned: xp,
    });
  };

  const resetAllProgress = async () => {
    await CourseService.resetAllProgress(userId);
    await loadCourses();
  };

  const getLessonBlocks = async (lessonId: string): Promise<LessonBlockRecord[]> => {
    return await CourseService.getLessonBlocks(lessonId);
  };

  return {
    courses,
    isLoading,
    isLiveSupabase,
    error,
    refetch: loadCourses,
    markLessonComplete,
    resetAllProgress,
    getLessonBlocks,
  };
}
