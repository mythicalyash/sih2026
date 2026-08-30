'use client'

import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  Zap,
  BookOpen,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { Course } from './types';
import { CourseDetailView } from './CourseDetailView';
import { ProblemsListView } from '@/components/problems/ProblemsListView';
import { ProblemDetailView } from '@/components/problems/ProblemDetailView';
import { ChallengeSolverView } from '@/components/problems/ChallengeSolverView';
import { CourseZeroInteractive } from '@/components/course/CourseZeroInteractive';
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
  const { courses, isLiveSupabase, isLoading, markLessonComplete } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeProblem, setActiveProblem] = useState<QuantumProblem | null>(null);
  const [selectedProblemDetail, setSelectedProblemDetail] = useState<QuantumProblem | null>(null);

  const handleOpenInSimulator = (problem: QuantumProblem) => {
    setActiveProblem(problem);
    setSelectedProblemDetail(null);
  };

  // If Course 0 Interactive Studio is selected
  if (selectedCourse && selectedCourse.id === 'course-zero-interactive') {
    return <CourseZeroInteractive onClose={() => setSelectedCourse(null)} />;
  }

  // Show course detailed lesson view
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
        onLessonCompleted={(courseId, lessonId, xp) => {
          markLessonComplete(courseId, lessonId, xp);
        }}
      />
    );
  }

  // Calculate overall foundation progress
  const totalLessons = courses.reduce((sum, c) => sum + c.lessonsCount, 0);
  const completedLessons = courses.reduce((sum, c) => sum + c.completedLessonsCount, 0);
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const completedCoursesCount = courses.filter((c) => c.status === 'complete').length;

  return (
    <div className="w-full min-h-screen bg-[#faf8f5] text-[#1c1917] font-sans p-6 sm:p-10 flex flex-col gap-10 selection:bg-[#d97706] selection:text-white animate-fadeIn">
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
        /* 2. SUB-TAB CONTENT: COURSES VIEW (MINIMALIST & CLEAN)                     */
        /* ========================================================================= */
        <>
          {/* Minimalist Top Progress Header */}
          <div className="flex flex-col gap-6 pb-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-medium tracking-wider text-[#78716c] uppercase">
                    Curriculum Progress
                  </span>
                  {isLiveSupabase && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Supabase Connected
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1917]">
                  Quantum Foundations & Algorithms
                </h1>
                <p className="text-sm text-[#78716c] max-w-2xl">
                  {completedLessons} of {totalLessons} interactive modules completed across {courses.length} structured courses.
                </p>
              </div>

              {/* Minimal Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-xs text-[#a8a29e] block font-mono">Streak</span>
                  <span className="font-semibold text-[#1c1917]">🔥 4 Days</span>
                </div>
                <div className="h-8 w-px bg-[#e7e5e4]" />
                <div>
                  <span className="text-xs text-[#a8a29e] block font-mono">Accuracy</span>
                  <span className="font-semibold text-[#1c1917]">100%</span>
                </div>
                <div className="h-8 w-px bg-[#e7e5e4]" />
                <div>
                  <span className="text-xs text-[#a8a29e] block font-mono">Mastery</span>
                  <span className="font-semibold text-[#d97706]">{overallPct}%</span>
                </div>
              </div>
            </div>

            {/* Minimal Clean Progress Line */}
            <div className="w-full h-1.5 bg-[#e7e5e4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d97706] rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          {/* Minimalist Course Grid */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wider text-[#78716c] uppercase font-mono">
                Foundational Tracks ({courses.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, idx) => {
                const isComplete = course.status === 'complete';
                const isActive = course.status === 'active';
                const courseProgress =
                  course.lessonsCount > 0
                    ? Math.round((course.completedLessonsCount / course.lessonsCount) * 100)
                    : 0;

                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className="group bg-white rounded-2xl p-6 border border-[#e7e5e4] hover:border-[#d97706] transition-all duration-200 cursor-pointer flex flex-col justify-between gap-6 hover:shadow-xs"
                  >
                    {/* Top Row: Track Code & Status Tag */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-[#78716c]">
                        {course.code}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                          isComplete
                            ? 'bg-[#f0fdf4] text-[#15803d]'
                            : isActive
                            ? 'bg-[#fffbeb] text-[#b45309]'
                            : 'bg-[#f5f5f4] text-[#78716c]'
                        }`}
                      >
                        {isComplete ? 'Completed' : isActive ? 'In Progress' : 'Ready'}
                      </span>
                    </div>

                    {/* Middle: Title & Description */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-mono text-[#a8a29e] uppercase tracking-wider">
                        Track {course.number} · {course.level}
                      </span>
                      <h3 className="text-lg font-bold text-[#1c1917] tracking-tight group-hover:text-[#d97706] transition-colors leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#78716c] leading-relaxed line-clamp-2">
                        {course.description}
                      </p>
                    </div>

                    {/* Bottom Row: Minimal Progress & Action */}
                    <div className="flex flex-col gap-3 pt-3 border-t border-[#f5f5f4]">
                      <div className="flex items-center justify-between text-xs text-[#78716c]">
                        <span className="font-mono">{course.completedLessonsCount} / {course.lessonsCount} lessons</span>
                        <span className="font-semibold text-[#1c1917]">{courseProgress}%</span>
                      </div>

                      {/* Minimal Hairline Progress */}
                      <div className="w-full h-1 bg-[#f5f5f4] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isComplete ? 'bg-[#16a34a]' : 'bg-[#d97706]'
                          }`}
                          style={{ width: `${courseProgress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-medium text-[#1c1917] pt-1 group-hover:text-[#d97706] transition-colors">
                        <span>{isActive ? 'Continue Learning' : isComplete ? 'Review Course' : 'Start Course'}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Minimalist Upcoming Electives Section */}
          <div className="flex flex-col gap-6 pt-6 border-t border-[#e7e5e4]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-wider text-[#78716c] uppercase font-mono">
                  Upcoming Electives (Roadmap)
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Elective 1 */}
              <div className="bg-white rounded-2xl p-5 border border-[#e7e5e4] flex items-center justify-between gap-4 hover:border-[#a8a29e] transition-colors">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#78716c]">QA-301</span>
                    <span className="text-[11px] text-[#a8a29e]">· 6 Modules</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#1c1917]">Shor's Factoring & QFT</h3>
                  <p className="text-xs text-[#78716c] line-clamp-1">Quantum Fourier Transform & period finding algorithms.</p>
                </div>
                <button
                  onClick={() => alert("Shor's Factoring & QFT Syllabus Preview:\n\n1. The Discrete Fourier Transform\n2. 3-Qubit QFT Circuit Decomposition\n3. Phase Kickback with Controlled-U\n4. Period Finding on f(x) = a^x mod N\n5. Continued Fraction Expansion\n6. End-to-End 15 = 3 × 5 Factorization Demo")}
                  className="px-3 py-1.5 rounded-xl bg-[#f5f5f4] hover:bg-[#e7e5e4] text-xs font-medium text-[#1c1917] transition-colors cursor-pointer shrink-0"
                >
                  Preview
                </button>
              </div>

              {/* Elective 2 */}
              <div className="bg-white rounded-2xl p-5 border border-[#e7e5e4] flex items-center justify-between gap-4 hover:border-[#a8a29e] transition-colors">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#78716c]">QA-302</span>
                    <span className="text-[11px] text-[#a8a29e]">· 7 Modules</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#1c1917]">VQE & Quantum Simulation</h3>
                  <p className="text-xs text-[#78716c] line-clamp-1">Variational algorithms for quantum chemistry and optimization.</p>
                </div>
                <button
                  onClick={() => alert("VQE & Quantum Simulation Syllabus Preview:\n\n1. Molecular Hamiltonians & Jordan-Wigner Mapping\n2. Parameterized Quantum Circuits (PQC)\n3. Expectation Value Measurement ⟨ψ(θ)|H|ψ(θ)⟩\n4. Classical Optimizer Feedback Loop\n5. Ground State Energy of Hydrogen Molecule (H₂)\n6. Quantum Approximate Optimization (QAOA)\n7. Max-Cut Graph Solving on Qiskit Aer")}
                  className="px-3 py-1.5 rounded-xl bg-[#f5f5f4] hover:bg-[#e7e5e4] text-xs font-medium text-[#1c1917] transition-colors cursor-pointer shrink-0"
                >
                  Preview
                </button>
              </div>

              {/* Elective 3 */}
              <div className="bg-white rounded-2xl p-5 border border-[#e7e5e4] flex items-center justify-between gap-4 hover:border-[#a8a29e] transition-colors">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#78716c]">QE-401</span>
                    <span className="text-[11px] text-[#a8a29e]">· 6 Modules</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#1c1917]">Quantum Error Correction</h3>
                  <p className="text-xs text-[#78716c] line-clamp-1">Stabilizer codes, surface codes, and fault tolerance.</p>
                </div>
                <button
                  onClick={() => alert("Quantum Error Correction Syllabus Preview:\n\n1. The Quantum Noise Problem (T₁ & T₂)\n2. 3-Qubit Bit Flip Code\n3. 3-Qubit Phase Flip Code\n4. Shor 9-Qubit Code\n5. Stabilizer Formalism & Syndrome Extraction\n6. 2D Surface Codes & Minimum Weight Matching")}
                  className="px-3 py-1.5 rounded-xl bg-[#f5f5f4] hover:bg-[#e7e5e4] text-xs font-medium text-[#1c1917] transition-colors cursor-pointer shrink-0"
                >
                  Preview
                </button>
              </div>

              {/* Elective 4 */}
              <div className="bg-white rounded-2xl p-5 border border-[#e7e5e4] flex items-center justify-between gap-4 hover:border-[#a8a29e] transition-colors">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#78716c]">QC-301</span>
                    <span className="text-[11px] text-[#a8a29e]">· 5 Modules</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#1c1917]">Quantum Cryptography</h3>
                  <p className="text-xs text-[#78716c] line-clamp-1">QKD protocols (BB84, E91) and teleportation.</p>
                </div>
                <button
                  onClick={() => alert("Quantum Cryptography & Teleportation Syllabus Preview:\n\n1. No-Cloning Theorem Proof\n2. BB84 Quantum Key Distribution\n3. Quantum Bit Error Rate (QBER) Calculation\n4. E91 Entanglement-Based QKD\n5. Quantum Teleportation Protocol with EPR Pairs")}
                  className="px-3 py-1.5 rounded-xl bg-[#f5f5f4] hover:bg-[#e7e5e4] text-xs font-medium text-[#1c1917] transition-colors cursor-pointer shrink-0"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
