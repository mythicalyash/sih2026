'use client'

import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Play,
  Zap,
  BookOpen,
  Sparkles,
  ChevronRight,
  Clock,
  Code2,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Course, Lesson } from './types';
import { InteractiveLessonWorkspace } from './InteractiveLessonWorkspace';

interface CourseDetailViewProps {
  course: Course;
  onBack: () => void;
  onLaunchChallenge?: (challengeId: string) => void;
  onOpenSimulator?: () => void;
  onLessonCompleted?: (courseId: string, lessonId: string, xp: number) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  onBack,
  onLaunchChallenge,
  onOpenSimulator,
  onLessonCompleted,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(course.lessons[0] || null);
  const [activeLessonWorkspace, setActiveLessonWorkspace] = useState<Lesson | null>(null);

  const completedCount = course.lessons.filter((l) => l.completed).length;
  const progressPct = course.lessons.length > 0 ? Math.round((completedCount / course.lessons.length) * 100) : 0;

  // If learner opened an interactive lesson workspace
  if (activeLessonWorkspace) {
    const currentIndex = course.lessons.findIndex((l) => l.id === activeLessonWorkspace.id);
    const nextLesson = currentIndex >= 0 && currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

    return (
      <InteractiveLessonWorkspace
        course={course}
        lesson={activeLessonWorkspace}
        onBackToCourse={() => setActiveLessonWorkspace(null)}
        onNextLesson={nextLesson ? () => setActiveLessonWorkspace(nextLesson) : undefined}
        onOpenSimulator={onOpenSimulator}
        onLessonCompleted={(lessonId, xp) => {
          activeLessonWorkspace.completed = true;
          if (onLessonCompleted) {
            onLessonCompleted(course.id, lessonId, xp);
          }
        }}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#faf8f5] text-[#1c1917] font-sans p-6 sm:p-10 flex flex-col gap-8 selection:bg-[#d97706] selection:text-white animate-fadeIn">
      {/* Top Minimal Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#78716c]">
          <button
            onClick={onBack}
            className="hover:text-[#1c1917] transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Courses</span>
          </button>
          <span className="text-[#d6d3d1]">/</span>
          <span className="text-[#1c1917] font-semibold">{course.title}</span>
        </div>

        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f5f5f4] text-xs font-medium text-[#1c1917] border border-[#e7e5e4] transition-colors cursor-pointer"
        >
          ← Back to Catalog
        </button>
      </div>

      {/* Minimal Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e7e5e4]">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#f5f5f4] text-[#78716c] border border-[#e7e5e4]">
              {course.code} · {course.level}
            </span>
            <span className="text-xs font-mono text-[#a8a29e]">
              {course.lessonsCount} lessons
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1917]">
            {course.title}
          </h1>

          <p className="text-sm text-[#78716c] leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Minimal Progress Indicator */}
        <div className="flex flex-col gap-2 min-w-[200px] shrink-0">
          <div className="flex items-center justify-between text-xs font-medium text-[#78716c]">
            <span>{completedCount} / {course.lessons.length} completed</span>
            <span className="font-mono text-[#1c1917] font-bold">{progressPct}%</span>
          </div>
          <div className="w-full bg-[#e7e5e4] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#d97706] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Lesson List (Left) + Active Lesson Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
        {/* Left Column: Lesson Sequence (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h2 className="text-xs font-mono font-semibold text-[#78716c] uppercase tracking-wider">
            Curriculum Sequence
          </h2>

          <div className="flex flex-col gap-2">
            {course.lessons.map((lesson, idx) => {
              const isSelected = selectedLesson?.id === lesson.id;
              const isLocked = course.status === 'locked';

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    if (!isLocked) {
                      setSelectedLesson(lesson);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-white border-[#d97706] shadow-xs ring-1 ring-[#d97706]'
                      : 'bg-white border-[#e7e5e4] hover:border-[#a8a29e]'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3.5 truncate">
                    {/* Index or Checkmark */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-medium shrink-0 ${
                        lesson.completed
                          ? 'bg-[#f0fdf4] text-[#15803d]'
                          : isSelected
                          ? 'bg-[#fffbeb] text-[#b45309]'
                          : 'bg-[#f5f5f4] text-[#78716c]'
                      }`}
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{lesson.number < 10 ? `0${lesson.number}` : lesson.number}</span>
                      )}
                    </div>

                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-sm text-[#1c1917] truncate">
                        {lesson.title}
                      </span>
                      <span className="text-xs text-[#a8a29e] truncate">
                        {lesson.conceptHeading}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-[#a8a29e]">
                      {lesson.duration}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLesson(lesson);
                        setActiveLessonWorkspace(lesson);
                      }}
                      className="p-1 rounded-md text-[#a8a29e] hover:text-[#d97706] transition-colors"
                      title="Launch lesson"
                    >
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#d97706]' : 'text-[#a8a29e]'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Minimalist Selected Lesson Detail Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#e7e5e4] rounded-2xl p-6 flex flex-col gap-5 sticky top-8">
          <div className="flex items-center justify-between border-b border-[#f5f5f4] pb-3">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#78716c]">
              Module Overview
            </span>
            <span className="text-xs font-mono text-[#a8a29e] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {selectedLesson?.duration || '8 min'}
            </span>
          </div>

          {selectedLesson ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono text-[#a8a29e] uppercase">
                  Lesson {selectedLesson.number} · {selectedLesson.level}
                </span>
                <h3 className="font-bold text-lg text-[#1c1917] leading-snug">
                  {selectedLesson.title}
                </h3>
                {selectedLesson.subtitle && (
                  <p className="text-xs text-[#78716c]">{selectedLesson.subtitle}</p>
                )}
              </div>

              {/* Minimal Theory Overview */}
              <div className="flex flex-col gap-1.5 text-xs text-[#44403c] leading-relaxed">
                <span className="font-medium text-[#1c1917] font-mono uppercase text-[11px] tracking-wider text-[#78716c]">
                  Key Concept
                </span>
                <p className="font-semibold text-[#1c1917]">{selectedLesson.conceptHeading}</p>
                {selectedLesson.conceptBody && selectedLesson.conceptBody.length > 0 && (
                  <p className="text-[#78716c] line-clamp-4 leading-relaxed">
                    {selectedLesson.conceptBody[0]}
                  </p>
                )}
              </div>

              {/* Minimal Gates Pill Row */}
              {selectedLesson.availableGates && selectedLesson.availableGates.length > 0 && (
                <div className="flex items-center justify-between py-2 border-y border-[#f5f5f4]">
                  <span className="text-xs text-[#78716c]">Quantum Gates:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedLesson.availableGates.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-[#f5f5f4] text-[#1c1917]"
                      >
                        {g.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Minimal Challenge Box */}
              {selectedLesson.challenge && (
                <div className="rounded-xl bg-[#faf8f5] p-4 flex flex-col gap-2 text-xs border border-[#f5f5f4]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#d97706] uppercase tracking-wider font-mono text-[10px]">
                      Challenge Mission
                    </span>
                    <span className="font-mono text-[#15803d] font-semibold">
                      +{selectedLesson.challenge.xpReward} XP
                    </span>
                  </div>

                  <strong className="text-[#1c1917] font-semibold">
                    {selectedLesson.challenge.title}
                  </strong>

                  <p className="text-[#78716c] leading-relaxed">
                    {selectedLesson.challenge.targetDescription}
                  </p>

                  {selectedLesson.challenge.mathTarget && (
                    <div className="mt-1 font-mono text-[#d97706] text-xs font-medium">
                      Target: {selectedLesson.challenge.mathTarget}
                    </div>
                  )}
                </div>
              )}

              {/* Launch Button */}
              <button
                onClick={() => setActiveLessonWorkspace(selectedLesson)}
                className="w-full py-3 rounded-xl bg-[#1c1917] hover:bg-[#292524] text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {selectedLesson.completed ? 'Review Lesson' : 'Start Lesson'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#a8a29e]">
              Select a lesson from the left to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
