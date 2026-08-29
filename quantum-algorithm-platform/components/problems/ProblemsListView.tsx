'use client'

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  CheckCircle2,
  Circle,
  Play,
  Sparkles,
  Flame,
  BrainCircuit,
  Zap,
  ChevronRight,
  Clock,
  BookOpen,
  Filter,
} from 'lucide-react';
import type { QuantumProblem, ProblemProgressState } from '@/types/quantum';
import { BACKEND_URL } from '@/config';

interface ProblemsListViewProps {
  onSelectProblem: (problem: QuantumProblem) => void;
  onOpenInSimulator: (problem: QuantumProblem) => void;
  progress: ProblemProgressState;
}

export function ProblemsListView({
  onSelectProblem,
  onOpenInSimulator,
  progress,
}: ProblemsListViewProps) {
  const [problems, setProblems] = useState<QuantumProblem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

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
        console.error('Failed to load problems:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const topics = ['All', 'Superposition', 'Quantum Gates', 'Entanglement', 'Measurement', 'Quantum Reasoning'];
  const difficulties = ['All', 'Beginner', 'Intermediate'];

  const filteredProblems = problems.filter((p) => {
    const matchTopic = selectedTopic === 'All' || p.topic === selectedTopic;
    const matchDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    return matchTopic && matchDiff;
  });

  const solvedCount = progress.solvedProblemIds.length;
  const totalCount = problems.length || 6;
  const masteryPercentage = Math.round((solvedCount / totalCount) * 100);

  // Topic mastery stats
  const topicStats = [
    { name: 'Superposition', total: 1, solved: progress.solvedProblemIds.includes('superposition') ? 1 : 0 },
    { name: 'Quantum Gates', total: 1, solved: progress.solvedProblemIds.includes('flip_qubit') ? 1 : 0 },
    {
      name: 'Entanglement',
      total: 2,
      solved:
        (progress.solvedProblemIds.includes('bell_state') ? 1 : 0) +
        (progress.solvedProblemIds.includes('ghz_state') ? 1 : 0),
    },
    { name: 'Measurement', total: 1, solved: progress.solvedProblemIds.includes('quantum_coin') ? 1 : 0 },
    { name: 'Quantum Reasoning', total: 1, solved: progress.solvedProblemIds.includes('break_entanglement') ? 1 : 0 },
  ];

  return (
    <div className="page-content flex flex-col gap-6">
      {/* Page Header */}
      <div className="welcome-row">
        <div>
          <div className="eyebrow accent-text">PRACTICE &amp; CHALLENGES</div>
          <h1>Quantum Challenges<span className="accent-dot">.</span></h1>
          <p className="subhead">
            Hands-on quantum circuit problems. Build intuition through guided simulation &amp; AI tutoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#eee9df] border border-[#ded7cb] text-xs font-semibold text-[#211f1b]">
            <Trophy className="w-4 h-4 text-[#c96b2c]" />
            <span>{solvedCount} / {totalCount} Solved</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eee9df] border border-[#ded7cb] text-xs font-semibold text-[#c96b2c]">
            <Flame className="w-4 h-4" />
            <span>{progress.streakDays} Day Streak</span>
          </div>
        </div>
      </div>

      {/* Hero Overview: Mastery Stats & Topic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Mastery Progress Banner */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#fffdf9] border border-[#ded7cb] shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">YOUR MASTERY OVERVIEW</div>
              <h2 className="text-lg font-bold text-[#211f1b] mt-1">
                {masteryPercentage === 100
                  ? '🏆 Quantum Grandmaster!'
                  : masteryPercentage >= 50
                  ? '⚡ Deepening Quantum Fluency'
                  : '🚀 Foundations Underway'}
              </h2>
              <p className="text-xs text-[#746e64] mt-1">
                Solve circuit challenges in the workbench with intelligent Socratic AI guidance.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono font-extrabold text-[#c96b2c]">{masteryPercentage}%</span>
              <div className="text-[10px] text-[#746e64]">Overall Mastery</div>
            </div>
          </div>

          <div className="w-full bg-[#eee9df] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#c96b2c] to-[#e08342] h-full rounded-full transition-all duration-500"
              style={{ width: `${masteryPercentage}%` }}
            />
          </div>

          {/* Topic Mini Bars */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[#ded7cb]">
            {topicStats.map((ts) => {
              const pct = Math.round((ts.solved / ts.total) * 100);
              return (
                <div key={ts.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-[#746e64]">
                    <span className="truncate font-medium">{ts.name}</span>
                    <span className="font-mono">{pct}%</span>
                  </div>
                  <div className="w-full bg-[#eee9df] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct === 100 ? 'bg-[#4f806d]' : 'bg-[#c96b2c]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Hero Problem Spotlight */}
        <div className="p-5 rounded-xl bg-[#fffaf3] border border-[#f0d1b3] shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full bg-[#c96b2c]/10 text-[#c96b2c] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> HERO CHALLENGE
            </span>
            <span className="text-xs font-mono font-bold text-[#c96b2c]">+150 XP</span>
          </div>

          <div>
            <h3 className="font-bold text-sm text-[#211f1b]">Build a Bell State</h3>
            <p className="text-xs text-[#746e64] mt-1 leading-relaxed">
              Create an entangled 2-qubit state (|00⟩ + |11⟩)/√2 using Hadamard and CNOT gates.
            </p>
          </div>

          <button
            onClick={() => {
              const heroProb = problems.find((p) => p.id === 'bell_state');
              if (heroProb) onOpenInSimulator(heroProb);
            }}
            className="w-full py-2 rounded-lg bg-[#c96b2c] hover:bg-[#b55e24] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch in Simulator</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Topic Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#746e64] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Topic:
          </span>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                selectedTopic === t
                  ? 'bg-[#211f1b] text-white shadow-sm'
                  : 'bg-[#fffdf9] border border-[#ded7cb] text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Difficulty Select */}
        <div className="flex items-center gap-1.5 text-xs text-[#746e64]">
          <span>Difficulty:</span>
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDifficulty(d)}
              className={`px-2.5 py-0.5 rounded text-xs font-medium cursor-pointer ${
                selectedDifficulty === d
                  ? 'bg-[#c96b2c] text-white'
                  : 'bg-[#fffdf9] border border-[#ded7cb] text-[#746e64]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Grid (6 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProblems.map((problem) => {
          const isSolved = progress.solvedProblemIds.includes(problem.id);
          const isAttempted = progress.attemptedProblemIds.includes(problem.id);

          return (
            <div
              key={problem.id}
              onClick={() => onSelectProblem(problem)}
              className={`p-5 rounded-xl border transition-all hover:shadow-md cursor-pointer flex flex-col justify-between gap-4 relative group ${
                isSolved
                  ? 'bg-[#f4f8f6] border-[#bad8cb]'
                  : 'bg-[#fffdf9] border-[#ded7cb] hover:border-[#c96b2c]/60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isSolved ? (
                    <div className="p-1 rounded-full bg-[#4f806d]/10 text-[#4f806d]" title="Solved!">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-full bg-[#eee9df] text-[#746e64]">
                      <Circle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-[#211f1b] group-hover:text-[#c96b2c] transition-colors">
                      {problem.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium text-[#746e64]">{problem.topic}</span>
                      <span className="text-[10px] text-[#746e64]">•</span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                          problem.difficulty === 'Beginner'
                            ? 'bg-[#4f806d]/10 text-[#4f806d]'
                            : 'bg-[#c96b2c]/10 text-[#c96b2c]'
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xs font-mono font-bold text-[#c96b2c]">+{problem.xp} XP</span>
                  <span className="text-[10px] text-[#746e64] flex items-center gap-0.5 mt-0.5">
                    <Clock className="w-3 h-3" /> {problem.estimated_minutes}m
                  </span>
                </div>
              </div>

              {/* Short Description */}
              <p className="text-xs text-[#746e64] leading-relaxed line-clamp-2">
                {problem.short_description}
              </p>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#ded7cb]/60 mt-auto">
                <span className="text-[11px] text-[#746e64] font-medium flex items-center gap-1">
                  <BrainCircuit className="w-3.5 h-3.5 text-[#c96b2c]" /> AI Guided
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenInSimulator(problem);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#211f1b] hover:bg-[#38342e] text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Solve</span>
                  </button>
                  <ChevronRight className="w-4 h-4 text-[#746e64] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
