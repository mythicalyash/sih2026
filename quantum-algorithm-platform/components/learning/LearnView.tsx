'use client'

import React, { useState } from 'react';
import {
  Trophy,
  ChevronRight,
  Sparkles,
  BookOpen,
  Atom,
  CheckCircle2,
  Lock,
  ArrowRight,
  Flame,
  Zap,
  Play,
  Layers,
  FlaskConical,
} from 'lucide-react';
import { QUANTUM_COURSES } from './coursesData';
import { Course } from './types';
import { CourseDetailView } from './CourseDetailView';

interface LearnViewProps {
  setActive: (tab: string) => void;
  onSelectChallenge?: (challengeId: string) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({ setActive, onSelectChallenge }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // If a course is clicked, show its detailed lesson view
  if (selectedCourse) {
    return (
      <CourseDetailView
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
        onLaunchChallenge={(cId) => {
          if (onSelectChallenge) {
            onSelectChallenge(cId);
          } else {
            setActive('Challenges');
          }
        }}
        onOpenSimulator={() => setActive('Quantum Simulation')}
      />
    );
  }

  // Calculate overall foundation progress
  const totalLessons = QUANTUM_COURSES.reduce((sum, c) => sum + c.lessonsCount, 0);
  const completedLessons = QUANTUM_COURSES.reduce((sum, c) => sum + c.completedLessonsCount, 0);
  const overallPct = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="w-full min-h-screen bg-[#faf8f5] text-[#211f1b] font-sans p-6 sm:p-8 flex flex-col gap-8 selection:bg-[#c96b2c] selection:text-white animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMB                                                */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumb */}
        <div className="text-xs font-semibold text-[#746e64] flex items-center gap-1.5">
          <span>Workspace</span>
          <ChevronRight className="w-3 h-3" />
          <strong className="text-[#211f1b]">Learn Quantum</strong>
        </div>

        {/* Welcome Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#c96b2c] mb-1">
              LEARNING PATH
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#211f1b] tracking-tight">
              Learn quantum<span className="text-[#c96b2c]">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5c5850] mt-1">
              Build intuition, then make it executable.
            </p>
          </div>

          <button
            onClick={() => setActive('Challenges')}
            className="px-5 py-2.5 rounded-xl bg-[#c96b2c] hover:bg-[#b55e24] text-white font-extrabold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>Open Challenges</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e4ded4] pt-2">
          <button className="px-4 py-2 text-xs font-bold text-[#c96b2c] border-b-2 border-[#c96b2c] cursor-pointer">
            Courses
          </button>
          <button
            onClick={() => setActive('Challenges')}
            className="px-4 py-2 text-xs font-semibold text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer"
          >
            Challenges
          </button>
          <button
            onClick={() => setActive('Quantum Simulation')}
            className="px-4 py-2 text-xs font-semibold text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer"
          >
            Simulation
          </button>
          <button
            onClick={() => setActive('AI Tutor')}
            className="px-4 py-2 text-xs font-semibold text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer"
          >
            AI Tutor
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUBJECTS / COURSE CARDS GRID (Inspired by Reference UI)                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#211f1b] tracking-tight">
            Your Subjects
          </h2>
          <span className="text-xs text-[#746e64] font-medium">
            Foundations & Core Algorithms
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUANTUM_COURSES.slice(0, 4).map((course) => {
            const isComplete = course.status === 'complete';
            const isActive = course.status === 'active';
            const isLocked = course.status === 'locked';

            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer shadow-2xs ${
                  isActive
                    ? 'bg-[#fffaf0] border-[#fed7aa] hover:border-[#c96b2c] hover:shadow-xs'
                    : isComplete
                    ? 'bg-[#f4f9f6] border-[#bad8cb] hover:border-[#287854] hover:shadow-xs'
                    : 'bg-[#fcfaf7] border-[#e4ded4] hover:border-[#c96b2c]/60 hover:shadow-xs'
                }`}
              >
                {/* Top Badge + Beaker Icon */}
                <div className="flex items-start justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                      isComplete
                        ? 'bg-[#eef8f2] text-[#287854] border-[#bad8cb]'
                        : isActive
                        ? 'bg-[#fff4e6] text-[#c96b2c] border-[#fed7aa]'
                        : 'bg-white text-[#746e64] border-[#e4ded4]'
                    }`}
                  >
                    {isComplete
                      ? 'Progress : 100%'
                      : isActive
                      ? 'In Progress : 42%'
                      : isLocked
                      ? 'Locked'
                      : 'Ready to Start'}
                  </span>
                </div>

                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                      isComplete
                        ? 'bg-[#eef8f2] border-[#bad8cb] text-[#287854]'
                        : isActive
                        ? 'bg-[#fff4e6] border-[#fed7aa] text-[#c96b2c]'
                        : 'bg-white border-[#e4ded4] text-[#746e64]'
                    }`}
                  >
                    <FlaskConical className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div className="flex flex-col truncate">
                    <h3 className="font-extrabold text-sm text-[#211f1b] truncate">
                      {course.title}
                    </h3>
                    <span className="text-[11px] font-mono text-[#746e64]">
                      {course.code}
                    </span>
                  </div>
                </div>

                {/* Meta Credits & Code */}
                <div className="text-[11px] font-mono text-[#746e64] border-t border-black/5 pt-2 flex items-center justify-between">
                  <span>Course Code: {course.code}</span>
                  <span>{course.lessonsCount} lessons</span>
                </div>

                {/* Description Snippet */}
                <p className="text-xs text-[#5c5850] line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                {/* Bottom Go to Class Button */}
                <button
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    isActive
                      ? 'bg-white text-[#c96b2c] border-[#fed7aa] hover:bg-[#fff4e6]'
                      : isComplete
                      ? 'bg-white text-[#287854] border-[#bad8cb] hover:bg-[#eef8f2]'
                      : 'bg-white text-[#5c5850] border-[#e4ded4] hover:bg-[#f3f0e8]'
                  }`}
                >
                  <span>{isActive ? 'Continue Learning' : isComplete ? 'Review Course' : 'Go to Class'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN LEARNING PATH CARD: QUANTUM FOUNDATIONS                           */}
      {/* ========================================================================= */}
      <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-6 shadow-2xs flex flex-col gap-5">
        {/* Card Head */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e4ded4] pb-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#c96b2c] mb-0.5">
              QUANTUM FOUNDATIONS
            </div>
            <h2 className="text-xl font-extrabold text-[#211f1b] tracking-tight">
              Your skill tree
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-mono font-bold text-[#211f1b]">
                {completedLessons} / {totalLessons} lessons
              </span>
              <span className="text-[10px] text-[#746e64]">
                {overallPct}% foundations complete
              </span>
            </div>
            <div className="w-24 bg-[#e4ded4] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#c96b2c] h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Vertical List of All Courses */}
        <div className="flex flex-col gap-2.5">
          {QUANTUM_COURSES.map((course, idx) => {
            const isComplete = course.status === 'complete';
            const isActive = course.status === 'active';
            const isLocked = course.status === 'locked';

            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between gap-4 cursor-pointer ${
                  isActive
                    ? 'bg-[#fffaf0] border-[#fed7aa] shadow-xs'
                    : isComplete
                    ? 'bg-[#f4f9f6] border-[#bad8cb]'
                    : 'bg-[#fcfaf7] border-[#e4ded4] hover:bg-[#fffdfa] hover:border-[#c96b2c]/40'
                } ${isLocked ? 'opacity-60' : ''}`}
              >
                {/* Left: Number / Checkmark + Title & Lessons */}
                <div className="flex items-center gap-3.5 truncate">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isComplete
                        ? 'bg-[#287854] text-white shadow-xs'
                        : isActive
                        ? 'bg-[#c96b2c] text-white shadow-xs'
                        : isLocked
                        ? 'bg-[#e4ded4] text-[#746e64]'
                        : 'bg-[#f0ece4] text-[#211f1b]'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    ) : isLocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      course.number
                    )}
                  </div>

                  <div className="flex flex-col truncate">
                    <span className="font-extrabold text-sm text-[#211f1b] truncate">
                      {course.title}
                    </span>
                    <span className="text-[11px] text-[#746e64] truncate">
                      {course.lessonsCount} lessons · {course.level}
                    </span>
                  </div>
                </div>

                {/* Right: Progress / Status + Chevron */}
                <div className="flex items-center gap-4 shrink-0">
                  {isComplete ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#eef8f2] text-[#287854] border border-[#bad8cb]">
                      Completed
                    </span>
                  ) : isActive ? (
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#e4ded4] h-2 rounded-full overflow-hidden hidden sm:block">
                        <div className="bg-[#c96b2c] h-full rounded-full w-[42%]" />
                      </div>
                      <span className="text-xs font-bold font-mono text-[#c96b2c]">
                        42%
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-[#746e64]">
                      {isLocked ? 'Locked' : 'Start'}
                    </span>
                  )}

                  <ChevronRight
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#c96b2c]' : isComplete ? 'text-[#287854]' : 'text-gray-400'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
