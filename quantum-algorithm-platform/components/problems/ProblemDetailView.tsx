'use client'

import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  Sparkles,
  Lightbulb,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  BrainCircuit,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import type { QuantumProblem, ProblemCheckResponse } from '@/types/quantum';
import { BACKEND_URL } from '@/config';

interface ProblemDetailViewProps {
  problem: QuantumProblem;
  onBack: () => void;
  onOpenInSimulator: (problem: QuantumProblem) => void;
  isSolved: boolean;
}

export function ProblemDetailView({
  problem,
  onBack,
  onOpenInSimulator,
  isSolved,
}: ProblemDetailViewProps) {
  // AI Modal / Card states
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [conceptExplanation, setConceptExplanation] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'hints' | 'concept'>('overview');

  // Request a hint
  const handleRequestHint = async (level?: number) => {
    const targetLevel = level || hintLevel;
    setLoadingAI(true);
    try {
      const res = await fetch(`${BACKEND_URL}/problem/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problem.id,
          hint_level: targetLevel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentHint(data.hint);
        setActiveTab('hints');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  // Request concept explanation
  const handleRequestConcept = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch(`${BACKEND_URL}/problem/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problem.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConceptExplanation(data.concept_explanation);
        setActiveTab('concept');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="page-content max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top Breadcrumb & Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all challenges</span>
        </button>

        {isSolved && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4f806d]/15 text-[#4f806d] text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Problem Solved
          </span>
        )}
      </div>

      {/* Main Detail Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#fffdf9] border border-[#ded7cb] shadow-sm flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ded7cb] pb-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                  problem.difficulty === 'Beginner'
                    ? 'bg-[#4f806d]/10 text-[#4f806d]'
                    : 'bg-[#c96b2c]/10 text-[#c96b2c]'
                }`}
              >
                {problem.difficulty}
              </span>
              <span className="text-xs text-[#746e64] font-medium">•</span>
              <span className="text-xs text-[#746e64] font-semibold">{problem.topic}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211f1b] tracking-tight">
              {problem.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end px-3 py-1.5 rounded-lg bg-[#eee9df] border border-[#ded7cb]">
              <span className="text-xs font-mono font-bold text-[#c96b2c]">+{problem.xp} XP</span>
              <span className="text-[10px] text-[#746e64] flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{problem.estimated_minutes} min
              </span>
            </div>
          </div>
        </div>

        {/* Goal & Expected Behavior Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#f0ece4] border border-[#ded7cb] flex flex-col gap-1.5">
            <div className="eyebrow accent-text">CHALLENGE OBJECTIVE</div>
            <p className="text-xs text-[#211f1b] font-medium leading-relaxed">
              {problem.goal}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#f0ece4] border border-[#ded7cb] flex flex-col gap-1.5">
            <div className="eyebrow">EXPECTED BEHAVIOR</div>
            <p className="text-xs text-[#746e64] leading-relaxed">
              {problem.expected_behavior}
            </p>
          </div>
        </div>

        {/* Main CTA: Open in Simulator */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-[#211f1b] to-[#3a352c] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <Zap className="w-4 h-4 text-[#c96b2c]" /> Ready to build the circuit?
            </h3>
            <p className="text-xs text-gray-300">
              Open the interactive quantum workbench with this challenge pre-loaded.
            </p>
          </div>

          <button
            onClick={() => onOpenInSimulator(problem)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#c96b2c] hover:bg-[#b55e24] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Open in Simulator</span>
          </button>
        </div>

        {/* AI Tutor Guidance Toolbox */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="eyebrow flex items-center gap-1.5 text-[#211f1b]">
              <BrainCircuit className="w-4 h-4 text-[#c96b2c]" /> AI Tutor Assistant
            </span>
            <span className="text-[11px] text-[#746e64]">Need guidance before starting?</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: Give me a hint */}
            <button
              onClick={() => handleRequestHint(1)}
              className="p-3.5 rounded-xl bg-[#fffaf3] border border-[#f0d1b3] hover:border-[#c96b2c] text-left flex flex-col gap-1 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="p-1 rounded-md bg-[#c96b2c]/10 text-[#c96b2c]">
                  <Lightbulb className="w-4 h-4" />
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#c96b2c] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <strong className="text-xs text-[#211f1b] mt-1">💡 Give Me a Hint</strong>
              <span className="text-[11px] text-[#746e64]">Progressive Socratic clues without spoiling the answer.</span>
            </button>

            {/* Action 2: Explain concept */}
            <button
              onClick={handleRequestConcept}
              className="p-3.5 rounded-xl bg-[#fffdf9] border border-[#ded7cb] hover:border-[#211f1b] text-left flex flex-col gap-1 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="p-1 rounded-md bg-[#211f1b]/10 text-[#211f1b]">
                  <BookOpen className="w-4 h-4" />
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#746e64] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <strong className="text-xs text-[#211f1b] mt-1">🧠 Explain Concept</strong>
              <span className="text-[11px] text-[#746e64]">Understand the quantum physics &amp; mathematics.</span>
            </button>

            {/* Action 3: Simulator review */}
            <button
              onClick={() => onOpenInSimulator(problem)}
              className="p-3.5 rounded-xl bg-[#fffdf9] border border-[#ded7cb] hover:border-[#211f1b] text-left flex flex-col gap-1 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="p-1 rounded-md bg-[#4f806d]/10 text-[#4f806d]">
                  <Search className="w-4 h-4" />
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#746e64] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <strong className="text-xs text-[#211f1b] mt-1">🔍 Review in Lab</strong>
              <span className="text-[11px] text-[#746e64]">Jump directly to the simulator to check circuit gates.</span>
            </button>
          </div>

          {/* AI Response Display Area */}
          {activeTab === 'hints' && currentHint && (
            <div className="mt-3 p-4 rounded-xl bg-[#fffaf3] border border-[#f0d1b3] flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[#f0d1b3] pb-2">
                <span className="text-xs font-bold text-[#c96b2c] flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" /> AI Tutor Hint (Level {hintLevel} of {problem.hints.length})
                </span>
                {hintLevel < problem.hints.length && (
                  <button
                    onClick={() => {
                      const next = hintLevel + 1;
                      setHintLevel(next);
                      handleRequestHint(next);
                    }}
                    className="text-[11px] font-semibold text-[#c96b2c] hover:underline cursor-pointer"
                  >
                    Need a bigger hint? →
                  </button>
                )}
              </div>
              <p className="text-xs text-[#211f1b] leading-relaxed mt-1">{currentHint}</p>
            </div>
          )}

          {activeTab === 'concept' && conceptExplanation && (
            <div className="mt-3 p-4 rounded-xl bg-[#f0ece4] border border-[#ded7cb] flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#211f1b] border-b border-[#ded7cb] pb-2">
                <BookOpen className="w-4 h-4 text-[#c96b2c]" />
                <span>Concept: {problem.suggested_concept}</span>
              </div>
              <p className="text-xs text-[#211f1b] leading-relaxed mt-1 whitespace-pre-wrap">
                {conceptExplanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
