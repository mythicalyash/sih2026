'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export default function CommunityPage() {
  const posts = [
    ['How do you visualize phase kickback?', 'Maya Rao', '12 replies', '48', 'Quantum gates'],
    ['A friendly introduction to Grover’s algorithm', 'Rohan Singh', '8 min read', '—', 'Algorithms'],
    ['New paper: Error mitigation with shadows', 'Dr. Kavya Iyer', 'Research paper', '26', 'Research'],
    ['Benchmarking VQE on NISQ Devices with Aer', 'Alex Chen', '5 min read', '31', 'Quantum Simulation'],
    ['Building Shor’s Algorithm step-by-step', 'Priya Sharma', '14 replies', '92', 'Algorithms'],
  ]

  return (
    <AppShell>
      <div className="page-content">
        <div className="welcome-row">
          <div>
            <div className="eyebrow">THE QUANTUM COMMONS</div>
            <h1>
              Learn out loud<span className="accent-dot">.</span>
            </h1>
            <p className="subhead">Ideas are better when they have somewhere to go.</p>
          </div>
          <button className="button primary">
            <Plus className="h-4 w-4" /> New post
          </button>
        </div>

        <div className="tabs">
          <button className="tab active">Discussions</button>
          <button className="tab">Blogs</button>
          <button className="tab">Research papers</button>
        </div>

        <div className="community-grid">
          {posts.map(([title, author, meta, votes, tag]) => (
            <Card className="post-card" key={title}>
              <div className="post-tag">{tag}</div>
              <h2>{title}</h2>
              <p>Exploring the mental models and practical techniques that make quantum concepts click.</p>
              <div className="post-footer">
                <div className="avatar tiny">{author.split(' ').map((n) => n[0]).join('')}</div>
                <span>{author}</span>
                <span>·</span>
                <span>{meta}</span>
                <b>↑ {votes}</b>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
