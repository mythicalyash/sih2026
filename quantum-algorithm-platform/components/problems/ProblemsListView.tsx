'use client'

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  CheckCircle2,
  Circle,
  Play,
  Sparkles,
  Flame,
  Zap,
  ChevronRight,
  Clock,
  BookOpen,
  Filter,
  Search,
  Shuffle,
  Calendar as CalendarIcon,
  Layers,
  ArrowUpDown,
  Lock,
  Tag,
  Check,
} from 'lucide-react';
import type { QuantumProblem, ProblemProgressState } from '@/types/quantum';
import { BACKEND_URL } from '@/config';

interface ProblemsListViewProps {
  onSelectProblem: (problem: QuantumProblem) => void;
  onOpenInSimulator: (problem: QuantumProblem) => void;
  progress: ProblemProgressState;
}

const PROBLEM_ACCEPTANCE: Record<string, string> = {
  superposition: '84.2%',
  flip_qubit: '79.5%',
  bell_state: '63.7%',
  ghz_state: '48.1%',
  quantum_coin: '71.3%',
  break_entanglement: '52.0%',
};

const FALLBACK_PROBLEMS: QuantumProblem[] = [
  {
    id: 'superposition',
    title: 'Create Equal Superposition',
    short_description: 'Transform ground state |0⟩ into state ( |0⟩ + |1⟩ ) / √2',
    difficulty: 'Beginner',
    topic: 'Superposition',
    xp: 100,
    num_qubits: 1,
    estimated_minutes: 5,
    starter_circuit: { num_qubits: 1, gates: [] },
    goal: 'Apply an H gate to qubit 0',
    expected_behavior: 'P(0) = 0.5, P(1) = 0.5',
    suggested_concept: 'Hadamard Gate',
    hints: ['Apply H gate on q[0]'],
    concept_explanation: 'Hadamard gate maps basis state |0⟩ to equal superposition state |+⟩.',
    available_gates: ['h', 'x', 'z'],
    requirements: ['Use 1 qubit', 'Apply H gate'],
  },
  {
    id: 'flip_qubit',
    title: 'Flip a Qubit (Pauli-X)',
    short_description: 'Invert qubit state from |0⟩ to |1⟩ using a bit flip',
    difficulty: 'Beginner',
    topic: 'Quantum Gates',
    xp: 100,
    num_qubits: 1,
    estimated_minutes: 3,
    starter_circuit: { num_qubits: 1, gates: [] },
    goal: 'Apply an X gate to qubit 0',
    expected_behavior: 'P(1) = 1.0',
    suggested_concept: 'Pauli-X Gate',
    hints: ['Apply X gate on q[0]'],
    concept_explanation: 'Pauli-X acts as the quantum NOT gate.',
    available_gates: ['x', 'h', 'z'],
    requirements: ['Use 1 qubit', 'Apply X gate'],
  },
  {
    id: 'bell_state',
    title: 'Generate Bell State (|Φ⁺⟩)',
    short_description: 'Entangle 2 qubits to create the maximally entangled EPR pair',
    difficulty: 'Intermediate',
    topic: 'Entanglement',
    xp: 150,
    num_qubits: 2,
    estimated_minutes: 8,
    starter_circuit: { num_qubits: 2, gates: [] },
    goal: 'Apply H on q[0] and CNOT from q[0] to q[1]',
    expected_behavior: 'P(00) = 0.5, P(11) = 0.5',
    suggested_concept: 'Quantum Entanglement & CNOT',
    hints: ['Apply H on q[0]', 'Apply CX with control=q[0] and target=q[1]'],
    concept_explanation: 'Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 shows non-local correlation.',
    available_gates: ['h', 'cx', 'x'],
    requirements: ['Use 2 qubits', 'Apply H on q[0]', 'Apply CX(0, 1)'],
  },
];

export function ProblemsListView({
  onSelectProblem,
  onOpenInSimulator,
  progress,
}: ProblemsListViewProps) {
  const [problems, setProblems] = useState<QuantumProblem[]>(FALLBACK_PROBLEMS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Solved' | 'Todo'>('All');

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/problems`);
        if (res.ok) {
          const data = await res.json();
          setProblems(data);
        }
      } catch (err) {
        console.error('Failed to load problems from API, using fallback data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const topics = [
    { name: 'All Topics', count: 6 },
    { name: 'Superposition', count: 2 },
    { name: 'Quantum Gates', count: 1 },
    { name: 'Entanglement', count: 2 },
    { name: 'Measurement', count: 1 },
    { name: 'Quantum Reasoning', count: 1 },
  ];

  const filteredProblems = problems.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTopic =
      selectedTopic === 'All Topics' ||
      p.topic.toLowerCase() === selectedTopic.toLowerCase();

    const matchDiff =
      selectedDifficulty === 'All' ||
      p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

    const isSolved = progress.solvedProblemIds.includes(p.id);
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Solved' && isSolved) ||
      (statusFilter === 'Todo' && !isSolved);

    return matchSearch && matchTopic && matchDiff && matchStatus;
  });

  const solvedCount = progress.solvedProblemIds.length;
  const totalCount = problems.length || 6;
  const masteryPercentage = Math.round((solvedCount / totalCount) * 100);

  const handlePickRandom = () => {
    if (problems.length > 0) {
      const unsolved = problems.filter((p) => !progress.solvedProblemIds.includes(p.id));
      const pool = unsolved.length > 0 ? unsolved : problems;
      const random = pool[Math.floor(Math.random() * pool.length)];
      onOpenInSimulator(random);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#faf8f5] text-[#211f1b] font-sans p-4 sm:p-8 flex flex-col gap-6 selection:bg-[#c96b2c] selection:text-white animate-fadeIn pb-16">

      {/* 1. TOPIC FILTER BUTTONS ROW                                               */}

      <div className="flex flex-col gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {topics.map((t) => {
            const isActive = selectedTopic === t.name;
            return (
              <button
                key={t.name}
                onClick={() => setSelectedTopic(t.name)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-[#211f1b] border-[#211f1b] text-white shadow-xs'
                    : 'bg-[#fffdfa] border-[#ded7cb] text-[#211f1b] hover:bg-[#f5f1e8]'
                }`}
                style={{
                  backgroundColor: isActive ? '#211f1b' : '#fffdfa',
                  color: isActive ? '#ffffff' : '#211f1b',
                }}
              >
                <span
                  className="font-bold"
                  style={{ color: isActive ? '#ffffff' : '#211f1b' }}
                >
                  {t.name}
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : '#ede7dc',
                    color: isActive ? '#ffffff' : '#49443b',
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN CONTENT: PROBLEMS TABLE (Left 8 Cols) + WIDGETS (Right 4 Cols)    */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 8/9 COLS: LEETCODE PROBLEMS TABLE */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Filter / Search Bar */}
          <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-[#faf7f2] border border-[#d8d2c6] rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#746e64]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions by topic, algorithm, or name..."
                className="bg-transparent text-xs text-[#211f1b] focus:outline-none w-full placeholder:text-[#746e64]"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              {/* Difficulty Dropdown */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-[#faf7f2] border border-[#d8d2c6] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#211f1b] focus:outline-none cursor-pointer"
              >
                <option value="All">Difficulty</option>
                <option value="Beginner">Easy (Beginner)</option>
                <option value="Intermediate">Med. (Intermediate)</option>
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#faf7f2] border border-[#d8d2c6] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#211f1b] focus:outline-none cursor-pointer"
              >
                <option value="All">Status</option>
                <option value="Solved">Solved</option>
                <option value="Todo">Todo</option>
              </select>

              {/* Pick Random */}
              <button
                onClick={handlePickRandom}
                className="px-3 py-1.5 rounded-lg bg-[#fffaf0] border border-[#fed7aa] text-[#c96b2c] hover:bg-[#fff0db] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                title="Pick a random challenge to solve"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pick One</span>
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl shadow-2xs overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-3 bg-[#f7f4ee] border-b border-[#e4ded4] text-[11px] font-bold font-mono text-[#746e64] uppercase tracking-wider items-center">
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-6">Title</div>
              <div className="col-span-2 text-center">Acceptance</div>
              <div className="col-span-2 text-center">Difficulty</div>
              <div className="col-span-1 text-right">XP</div>
            </div>

            {/* Problem Rows (LeetCode-style alternating rows) */}
            <div className="divide-y divide-[#e4ded4]">
              {loading ? (
                <div className="py-12 text-center text-xs text-[#746e64] animate-pulse">
                  Loading quantum problemset from engine...
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#746e64]">
                  No quantum challenges match your selected filters.
                </div>
              ) : (
                filteredProblems.map((problem, idx) => {
                  const isSolved = progress.solvedProblemIds.includes(problem.id);
                  const isAttempted = progress.attemptedProblemIds.includes(problem.id);
                  const isMed = problem.difficulty === 'Intermediate';
                  const acceptance = PROBLEM_ACCEPTANCE[problem.id] || '65.4%';

                  return (
                    <div
                      key={problem.id}
                      onClick={() => onOpenInSimulator(problem)}
                      className={`grid grid-cols-12 px-4 py-3.5 items-center text-xs cursor-pointer transition-colors group ${
                        idx % 2 === 0 ? 'bg-[#fffdfa]' : 'bg-[#faf7f2]'
                      } hover:bg-[#fff5eb]`}
                    >
                      {/* Status Icon */}
                      <div className="col-span-1 flex justify-center">
                        {isSolved ? (
                          <div className="w-5 h-5 rounded-full bg-[#287854] text-white flex items-center justify-center shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : isAttempted ? (
                          <div className="w-5 h-5 rounded-full border-2 border-[#c96b2c] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#c96b2c]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[#d8d2c6]" />
                        )}
                      </div>

                      {/* Title & Tags */}
                      <div className="col-span-6 flex items-center gap-2 truncate pr-2">
                        <span className="font-bold text-sm text-[#211f1b] group-hover:text-[#c96b2c] transition-colors truncate">
                          {idx + 1}. {problem.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-[#f0ece4] text-[#746e64] hidden sm:inline truncate">
                          {problem.topic}
                        </span>
                      </div>

                      {/* Acceptance Rate */}
                      <div className="col-span-2 text-center font-mono text-xs text-[#5c5850]">
                        {acceptance}
                      </div>

                      {/* Difficulty Badge */}
                      <div className="col-span-2 flex justify-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                            isMed
                              ? 'bg-[#fff4e6] text-[#c96b2c] border border-[#fed7aa]'
                              : 'bg-[#eef8f2] text-[#287854] border border-[#bad8cb]'
                          }`}
                        >
                          {isMed ? 'Med.' : 'Easy'}
                        </span>
                      </div>

                      {/* XP Reward & Solve Chevron */}
                      <div className="col-span-1 flex items-center justify-end gap-1 font-mono font-bold text-xs text-[#c96b2c]">
                        <span>+{problem.xp}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: LEETCODE CALENDAR & STATS WIDGETS */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-6">
          {/* Calendar & Daily Streak Card */}
          <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#e4ded4] pb-2">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[#c96b2c]" />
                <span className="text-xs font-bold text-[#211f1b]">Day 29</span>
                <span className="text-[10px] font-mono text-[#746e64]">· 00:36:29 left</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#287854] bg-[#eef8f2] px-2 py-0.5 rounded-full border border-[#bad8cb]">
                🔥 12d Streak
              </span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px]">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="text-[#746e64] font-bold text-[10px] py-1">
                  {d}
                </span>
              ))}
              {Array.from({ length: 31 }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === 29;
                const isDone = dayNum < 29 && dayNum > 16;

                return (
                  <div
                    key={i}
                    className={`h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                      isToday
                        ? 'bg-[#287854] text-white font-bold shadow-xs'
                        : isDone
                        ? 'bg-[#eef8f2] text-[#287854] font-bold'
                        : 'text-[#746e64] hover:bg-[#f0ece4]'
                    }`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>

            {/* Weekly Badges */}
            <div className="border-t border-[#e4ded4] pt-2.5 flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-[#746e64]">Weekly Challenges:</span>
              <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-[#287854] text-white">W1</span>
                <span className="px-1.5 py-0.5 rounded bg-[#287854] text-white">W2</span>
                <span className="px-1.5 py-0.5 rounded bg-[#287854] text-white">W3</span>
                <span className="px-1.5 py-0.5 rounded bg-[#287854] text-white">W4</span>
                <span className="px-1.5 py-0.5 rounded bg-[#c96b2c] text-white">W5</span>
              </div>
            </div>
          </div>

          {/* Solved Progress Metric Widget */}
          <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#e4ded4] pb-2">
              <span className="text-xs font-extrabold text-[#211f1b]">Session Progress</span>
              <span className="text-xs font-mono font-bold text-[#c96b2c]">
                {solvedCount} / {totalCount} Solved ({masteryPercentage}%)
              </span>
            </div>

            <div className="w-full bg-[#e4ded4] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#287854] h-full rounded-full transition-all duration-500"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-[#f7f4ee] p-2 rounded-lg flex items-center justify-between border border-[#e4ded4]">
                <span className="text-[#287854] font-bold">Easy</span>
                <span className="font-bold">
                  {progress.solvedProblemIds.filter((id) => ['superposition', 'flip_qubit', 'bell_state', 'quantum_coin'].includes(id)).length} / 4
                </span>
              </div>
              <div className="bg-[#f7f4ee] p-2 rounded-lg flex items-center justify-between border border-[#e4ded4]">
                <span className="text-[#c96b2c] font-bold">Medium</span>
                <span className="font-bold">
                  {progress.solvedProblemIds.filter((id) => ['ghz_state', 'break_entanglement'].includes(id)).length} / 2
                </span>
              </div>
            </div>
          </div>

          {/* Trending Quantum Concepts Widget */}
          <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-4 shadow-2xs flex flex-col gap-2.5">
            <span className="text-xs font-extrabold text-[#211f1b]">Trending Concepts</span>
            <div className="flex flex-wrap gap-1.5">
              {['Superposition', 'Bell States', 'Phase Kickback', 'Grover Search', 'QFT', 'QAOA', 'Teleportation'].map((concept) => (
                <button
                  key={concept}
                  onClick={() => setSearchQuery(concept)}
                  className="px-2.5 py-1 rounded-lg bg-[#faf7f2] hover:bg-[#eee9df] border border-[#e4ded4] text-xs font-semibold text-[#211f1b] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{concept}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
