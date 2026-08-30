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
} from 'lucide-react';
import { Course, Lesson } from './types';
import { InteractiveLessonWorkspace } from './InteractiveLessonWorkspace';

interface CourseDetailViewProps {
  course: Course;
  onBack: () => void;
  onLaunchChallenge?: (challengeId: string) => void;
  onOpenSimulator?: () => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  onBack,
  onLaunchChallenge,
  onOpenSimulator,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(course.lessons[0] || null);
  const [activeLessonWorkspace, setActiveLessonWorkspace] = useState<Lesson | null>(null);

  const completedCount = course.lessons.filter((l) => l.completed).length;
  const progressPct = Math.round((completedCount / course.lessons.length) * 100);

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
        }}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#faf8f5] text-[#211f1b] font-sans p-6 sm:p-8 flex flex-col gap-6 selection:bg-[#c96b2c] selection:text-white animate-fadeIn">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-[#e4ded4]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#746e64]">
          <button
            onClick={onBack}
            className="hover:text-[#211f1b] transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Courses</span>
          </button>
          <span>/</span>
          <span className="text-[#211f1b] font-bold">{course.title}</span>
        </div>

        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#f3f0e8] text-xs font-semibold text-[#211f1b] border border-[#d8d2c6] transition-colors cursor-pointer"
        >
          ← Back to Catalog
        </button>
      </div>

      {/* Course Header Banner */}
      <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${course.badgeBg} ${course.badgeText} border ${course.badgeBorder}`}>
              {course.code} · {course.level}
            </span>
            <span className="text-xs font-mono text-[#746e64]">
              {course.lessonsCount} lessons
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211f1b] tracking-tight">
            {course.title}
          </h1>

          <p className="text-xs sm:text-sm text-[#5c5850] leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-[#f6faf8] border border-[#bad8cb] rounded-xl p-4 flex flex-col gap-2 min-w-[220px] shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-[#287854]">
            <span>Course Progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full bg-[#bad8cb] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#287854] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[11px] text-[#746e64] font-mono text-right">
            {completedCount} / {course.lessons.length} completed
          </span>
        </div>
      </div>

      {/* Main Content Grid: Lesson List (Left) + Active Lesson Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Left Column: Lesson Sequence (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <h2 className="text-xs font-extrabold text-[#211f1b] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#c96b2c]" />
            <span>Curriculum Lessons</span>
          </h2>

          <div className="flex flex-col gap-2.5">
            {course.lessons.map((lesson, idx) => {
              const isSelected = selectedLesson?.id === lesson.id;
              const isLocked = course.status === 'locked';

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    if (!isLocked) {
                      setSelectedLesson(lesson);
                      setActiveLessonWorkspace(lesson);
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-white border-[#c96b2c] shadow-xs ring-1 ring-[#c96b2c]/30'
                      : 'bg-[#fffdfa] border-[#e4ded4] hover:border-[#c96b2c]/50 hover:bg-[#fffcf7]'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3.5 truncate">
                    {/* Index or Checkmark */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        lesson.completed
                          ? 'bg-[#287854] text-white'
                          : isSelected
                          ? 'bg-[#c96b2c] text-white'
                          : 'bg-[#f0ece4] text-[#746e64]'
                      }`}
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        `0${idx + 1}`
                      )}
                    </div>

                    <div className="flex flex-col truncate">
                      <span className="font-bold text-sm text-[#211f1b] truncate flex items-center gap-1.5">
                        {lesson.title}
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#c96b2c]/15 text-[#c96b2c]">
                          INTERACTIVE
                        </span>
                      </span>
                      <span className="text-[11px] text-[#746e64] truncate">
                        {lesson.conceptHeading}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-[#746e64] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {lesson.duration}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#c96b2c]' : 'text-gray-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Lesson Detail Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-5 shadow-2xs flex flex-col gap-4 sticky top-6">
          <div className="flex items-center justify-between border-b border-[#e4ded4] pb-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#c96b2c] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Lesson Overview
            </span>
            <span className="text-xs font-mono text-[#746e64]">
              {selectedLesson?.duration}
            </span>
          </div>

          {selectedLesson ? (
            <div className="flex flex-col gap-3">
              <h3 className="font-extrabold text-lg text-[#211f1b] leading-snug">
                {selectedLesson.title}
              </h3>

              <p className="text-xs text-[#5c5850] leading-relaxed">
                {selectedLesson.conceptHeading}
              </p>

              {selectedLesson.challenge && (
                <div className="bg-[#faf7f2] border border-[#e4ded4] rounded-xl p-3.5 text-xs text-[#211f1b] leading-relaxed">
                  <strong className="block text-[10px] uppercase font-bold text-[#c96b2c] mb-1">
                    Lesson Challenge
                  </strong>
                  {selectedLesson.challenge.targetDescription}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-3 flex flex-col gap-2">
                <button
                  onClick={() => setActiveLessonWorkspace(selectedLesson)}
                  className="w-full py-2.5 rounded-xl bg-[#c96b2c] hover:bg-[#b55e24] text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Start Interactive Lesson</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#746e64]">
              Select a lesson from the left to start interactive learning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
