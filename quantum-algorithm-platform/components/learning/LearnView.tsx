'use client'

import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { QUANTUM_COURSES } from './coursesData';
import { Course } from './types';
import { CourseDetailView } from './CourseDetailView';
import { ProblemsListView } from '@/components/problems/ProblemsListView';
import { ProblemDetailView } from '@/components/problems/ProblemDetailView';
import { ChallengeSolverView } from '@/components/problems/ChallengeSolverView';
import type { QuantumProblem, ProblemProgressState } from '@/types/quantum';

interface LearnViewProps {
  setActive: (tab: string) => void;
  learnSubTab: 'courses' | 'problems';
  setLearnSubTab: (tab: 'courses' | 'problems') => void;
  allProblems: QuantumProblem[];
  progress: ProblemProgressState;
  onProblemSolved: (problemId: string) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  setActive,
  learnSubTab,
  setLearnSubTab,
  allProblems,
  progress,
  onProblemSolved,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeProblem, setActiveProblem] = useState<QuantumProblem | null>(null);
  const [selectedProblemDetail, setSelectedProblemDetail] = useState<QuantumProblem | null>(null);

  const handleOpenInSimulator = (problem: QuantumProblem) => {
    setActiveProblem(problem);
    setSelectedProblemDetail(null);
  };

  // If a course is clicked, show its detailed lesson view
  if (selectedCourse) {
    return (
      <CourseDetailView
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
        onLaunchChallenge={(cId) => {
          const found = allProblems.find((p) => p.id === cId);
          if (found) {
            setActiveProblem(found);
            setLearnSubTab('problems');
          } else {
            setLearnSubTab('problems');
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
    <div className="w-full min-h-screen bg-[#faf8f5] text-[#211f1b] font-sans p-4 sm:p-6 flex flex-col gap-6 selection:bg-[#c96b2c] selection:text-white animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. SUB-TAB CONTENT: PROBLEMS VIEW                                         */}
      {/* ========================================================================= */}
      {learnSubTab === 'problems' ? (
        activeProblem ? (
          <ChallengeSolverView
            problem={activeProblem}
            allProblems={allProblems}
            onSelectProblem={(p) => setActiveProblem(p)}
            onBackToCatalog={() => setActiveProblem(null)}
            onProblemSolved={onProblemSolved}
            isSolved={progress.solvedProblemIds.includes(activeProblem.id)}
          />
        ) : selectedProblemDetail ? (
          <ProblemDetailView
            problem={selectedProblemDetail}
            isSolved={progress.solvedProblemIds.includes(selectedProblemDetail.id)}
            onBack={() => setSelectedProblemDetail(null)}
            onOpenInSimulator={handleOpenInSimulator}
          />
        ) : (
          <ProblemsListView
            onSelectProblem={(p) => setSelectedProblemDetail(p)}
            onOpenInSimulator={handleOpenInSimulator}
            progress={progress}
          />
        )
      ) : (
        /* ========================================================================= */
        /* 2. SUB-TAB CONTENT: COURSES VIEW (SUBJECT CARDS & SKILL TREE)             */
        /* ========================================================================= */
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#211f1b] tracking-tight">
                Foundational Subjects
              </h2>
              <span className="text-xs text-[#746e64] font-medium">
                Core Quantum Computing Curriculum
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
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer ${
                      isActive
                        ? 'bg-[#fffaf0] border-[#fed7aa] hover:border-[#c96b2c] hover:shadow-xs'
                        : isComplete
                        ? 'bg-[#f4f9f6] border-[#bad8cb] hover:border-[#287854] hover:shadow-xs'
                        : 'bg-[#fcfaf7] border-[#e4ded4] hover:border-[#c96b2c]/60 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Status + Code */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isComplete
                            ? 'bg-[#eef8f2] text-[#287854] border-[#bad8cb]'
                            : isActive
                            ? 'bg-[#fff4e6] text-[#c96b2c] border-[#fed7aa]'
                            : 'bg-white text-[#746e64] border-[#e4ded4]'
                        }`}
                      >
                        {isComplete
                          ? '✓ Completed'
                          : isActive
                          ? '● 42% In Progress'
                          : isLocked
                          ? '🔒 Locked'
                          : 'Ready to Start'}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-[#746e64]">
                        {course.code}
                      </span>
                    </div>

                    {/* Icon + Title */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                          isComplete
                            ? 'bg-[#eef8f2] border-[#bad8cb] text-[#287854]'
                            : isActive
                            ? 'bg-[#fff4e6] border-[#fed7aa] text-[#c96b2c]'
                            : 'bg-white border-[#e4ded4] text-[#746e64]'
                        }`}
                      >
                        <FlaskConical className="w-5 h-5 stroke-[1.8]" />
                      </div>
                      <div className="flex flex-col truncate">
                        <h3 className="font-extrabold text-sm text-[#211f1b] truncate">
                          {course.title}
                        </h3>
                        <span className="text-[11px] text-[#746e64]">
                          {course.lessonsCount} lessons
                        </span>
                      </div>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-[#5c5850] line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Action Button */}
                    <button
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                        isActive
                          ? 'bg-[#c96b2c] text-white border-[#c96b2c] hover:bg-[#b55e24]'
                          : isComplete
                          ? 'bg-white text-[#287854] border-[#bad8cb] hover:bg-[#eef8f2]'
                          : 'bg-white text-[#5c5850] border-[#e4ded4] hover:bg-[#f3f0e8]'
                      }`}
                    >
                      <span>{isActive ? 'Continue Learning' : isComplete ? 'Review Course' : 'Start Course'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
