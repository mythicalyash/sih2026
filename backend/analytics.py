"""
Quantum Learning Dashboard & Analytics Engine
Tracks persistent user metrics, simulation counts, course progression,
problem solutions, quiz accuracy, daily practice heatmap, and concept mastery radar.
"""

import json
import math
import os
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

STORE_DIR = Path(__file__).parent / "data"
STORE_FILE = STORE_DIR / "analytics_store.json"

_lock = threading.Lock()

def _get_default_baseline() -> Dict[str, Any]:
    """Clean zero baseline state for fresh user tracking starting from 0."""
    now = datetime.now(timezone.utc)
    
    # 6 concept radar baseline scores starting at 0
    concepts = {
        "Phase Kickback": {"score": 0, "category": "Gates & Oracles", "attempts": 0, "correct": 0},
        "Quantum Superposition": {"score": 0, "category": "Foundations", "attempts": 0, "correct": 0},
        "Entanglement & Bell States": {"score": 0, "category": "Foundations", "attempts": 0, "correct": 0},
        "Quantum Gates & Circuits": {"score": 0, "category": "Circuits", "attempts": 0, "correct": 0},
        "Quantum Algorithms": {"score": 0, "category": "Algorithms", "attempts": 0, "correct": 0},
        "Measurement & Protocols": {"score": 0, "category": "Protocols", "attempts": 0, "correct": 0},
    }

    return {
        "user_profile": {
            "name": "Quantum Learner",
            "email": "learner@qubitlab.io",
            "role": "Quantum Research Track",
            "level": 1,
            "level_title": "Quantum Initiate",
            "xp": 0,
            "max_xp": 1000,
            "weekly_xp": 0,
            "streak_days": 0,
            "last_active_date": now.strftime("%Y-%m-%d"),
        },
        "stats": {
            "simulations_count": 0,
            "simulations_weekly_delta_pct": 0,
            "quizzes_taken": 0,
            "quizzes_correct": 0,
            "quiz_accuracy_pct": 0.0,
            "percentile": "New Learner",
            "total_problems_in_bank": 32,
        },
        "completed_courses": [],
        "completed_lessons": [],
        "total_lessons_count": 44,
        "solved_problems": [],
        "attempted_problems": [],
        "concept_mastery": concepts,
        "events": [],
    }

COURSE_LESSONS_MAP: Dict[str, List[str]] = {
    "course-zero-interactive": [f"c0_m{i}" for i in range(1, 14)],
    "qubits-states": [f"q{i}" for i in range(1, 14)],
    "superposition-gates": [f"s{i}" for i in range(1, 7)],
    "entanglement-bell": [f"e{i}" for i in range(1, 6)],
    "grover-search": [f"g{i}" for i in range(1, 8)],
}

class AnalyticsStore:
    def __init__(self):
        STORE_DIR.mkdir(parents=True, exist_ok=True)
        self._data: Dict[str, Any] = {}
        self._load()

    def _load(self):
        with _lock:
            if STORE_FILE.exists():
                try:
                    with open(STORE_FILE, "r", encoding="utf-8") as f:
                        self._data = json.load(f)
                        return
                except Exception as e:
                    pass
            self._data = _get_default_baseline()
            self._save_unsafe()

    def _save_unsafe(self):
        try:
            with open(STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2)
        except Exception:
            pass

    def _update_streak(self):
        """Update daily streak based on current UTC date."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        last_active = self._data["user_profile"].get("last_active_date")
        
        if last_active == today:
            return
        
        if last_active:
            try:
                last_dt = datetime.strptime(last_active, "%Y-%m-%d")
                curr_dt = datetime.strptime(today, "%Y-%m-%d")
                diff = (curr_dt - last_dt).days
                if diff == 1:
                    self._data["user_profile"]["streak_days"] += 1
                elif diff > 1:
                    self._data["user_profile"]["streak_days"] = 1
            except Exception:
                self._data["user_profile"]["streak_days"] = 1
        else:
            self._data["user_profile"]["streak_days"] = 1
            
        self._data["user_profile"]["last_active_date"] = today

    def _award_xp(self, amount: int):
        """Add XP and compute level progression."""
        profile = self._data["user_profile"]
        profile["xp"] += amount
        profile["weekly_xp"] += amount
        
        # Level thresholds (each level takes level * 800 XP)
        current_level = profile["level"]
        max_xp_for_level = current_level * 700 + 100
        profile["max_xp"] = max_xp_for_level
        
        if profile["xp"] >= max_xp_for_level:
            profile["level"] += 1
            profile["xp"] -= max_xp_for_level
            profile["max_xp"] = profile["level"] * 700 + 100

    def log_event(self, event_type: str, metadata: Optional[Dict[str, Any]] = None, xp: int = 0) -> Dict[str, Any]:
        """Universal event logging with thread safety."""
        with _lock:
            now = datetime.now(timezone.utc)
            event_id = f"ev_{int(now.timestamp() * 1000)}"
            iso_date = now.strftime("%Y-%m-%d")
            
            event_entry = {
                "id": event_id,
                "timestamp": now.isoformat(),
                "date": iso_date,
                "type": event_type,
                "xp": xp,
                "metadata": metadata or {},
            }
            
            self._data["events"].append(event_entry)
            self._update_streak()
            if xp > 0:
                self._award_xp(xp)
            self._save_unsafe()
            return event_entry

    def record_simulation(self, qubits_count: int = 2, backend_name: str = "qiskit_aer", **kwargs):
        """Record circuit simulation run."""
        backend = kwargs.get("backend", backend_name)
        qubits = kwargs.get("qubits", qubits_count)
        with _lock:
            stats = self._data["stats"]
            stats["simulations_count"] = stats.get("simulations_count", 0) + 1

            now = datetime.now(timezone.utc)
            self._data["events"].append({
                "id": f"sim_{int(now.timestamp() * 1000)}",
                "timestamp": now.isoformat(),
                "date": now.strftime("%Y-%m-%d"),
                "type": "simulation_run",
                "xp": 20,
                "metadata": {"qubits": qubits, "backend": backend},
            })
            self._update_streak()
            self._award_xp(20)
            self._save_unsafe()

    def record_problem_result(self, problem_id: str, is_solved: bool, xp_reward: int = 150):
        """Record problem solver completion."""
        with _lock:
            solved = self._data["solved_problems"]
            attempted = self._data["attempted_problems"]

            if problem_id not in attempted:
                attempted.append(problem_id)

            if is_solved and problem_id not in solved:
                solved.append(problem_id)
                self._award_xp(xp_reward)

            now = datetime.now(timezone.utc)
            self._data["events"].append({
                "id": f"prob_{int(now.timestamp() * 1000)}",
                "timestamp": now.isoformat(),
                "date": now.strftime("%Y-%m-%d"),
                "type": "problem_solved" if is_solved else "problem_attempted",
                "xp": xp_reward if is_solved else 15,
                "metadata": {"problem_id": problem_id, "is_solved": is_solved},
            })
            self._update_streak()
            if not is_solved:
                self._award_xp(15)
            self._save_unsafe()

    def record_quiz_submission(self, lesson_id: str, is_correct: bool, topic: str = "General"):
        """Record quiz assessment question attempt."""
        with _lock:
            stats = self._data["stats"]
            stats["quizzes_taken"] = stats.get("quizzes_taken", 0) + 1
            if is_correct:
                stats["quizzes_correct"] = stats.get("quizzes_correct", 0) + 1

            if stats["quizzes_taken"] > 0:
                stats["quiz_accuracy_pct"] = round(
                    (stats["quizzes_correct"] / stats["quizzes_taken"]) * 100, 1
                )

            # Update topic mastery score
            mastery = self._data.get("concept_mastery", {})
            matched_key = None
            for key in mastery:
                if key.lower() in topic.lower() or topic.lower() in key.lower():
                    matched_key = key
                    break
            if not matched_key and mastery:
                matched_key = list(mastery.keys())[0]

            if matched_key:
                m_entry = mastery[matched_key]
                m_entry["attempts"] = m_entry.get("attempts", 0) + 1
                if is_correct:
                    m_entry["correct"] = m_entry.get("correct", 0) + 1
                calc_score = round((m_entry["correct"] / m_entry["attempts"]) * 100)
                m_entry["score"] = max(0, min(100, calc_score))

            now = datetime.now(timezone.utc)
            self._data["events"].append({
                "id": f"quiz_{int(now.timestamp() * 1000)}",
                "timestamp": now.isoformat(),
                "date": now.strftime("%Y-%m-%d"),
                "type": "quiz_submitted",
                "xp": 30 if is_correct else 5,
                "metadata": {"lesson_id": lesson_id, "is_correct": is_correct, "topic": topic},
            })
            self._update_streak()
            self._award_xp(30 if is_correct else 5)
            self._save_unsafe()

    def record_lesson_completion(self, course_id: str, lesson_id: str, xp: int = 120):
        """Record lesson module completion and check course completion."""
        with _lock:
            completed = self._data.setdefault("completed_lessons", [])
            if lesson_id not in completed:
                completed.append(lesson_id)
                self._award_xp(xp)

            # Check if entire course is completed
            completed_courses = self._data.setdefault("completed_courses", [])
            expected_lessons = COURSE_LESSONS_MAP.get(course_id, [])
            if expected_lessons and all(l in completed for l in expected_lessons):
                if course_id not in completed_courses:
                    completed_courses.append(course_id)
                    self._award_xp(250)  # 250 XP bonus for completing entire course

            now = datetime.now(timezone.utc)
            self._data["events"].append({
                "id": f"less_{int(now.timestamp() * 1000)}",
                "timestamp": now.isoformat(),
                "date": now.strftime("%Y-%m-%d"),
                "type": "lesson_completed",
                "xp": xp,
                "metadata": {"course_id": course_id, "lesson_id": lesson_id},
            })
            self._update_streak()
            self._save_unsafe()

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Aggregate and compile full live dashboard data payload."""
        with _lock:
            profile = self._data["user_profile"]
            stats = self._data["stats"]
            solved = self._data["solved_problems"]
            total_prob = stats.get("total_problems_in_bank", 32)
            completed_lessons = self._data.get("completed_lessons", [])
            completed_courses = self._data.get("completed_courses", [])
            total_lessons = self._data.get("total_lessons_count", 44)

            # Compute per-course progress
            courses_progress = {}
            for c_id, l_ids in COURSE_LESSONS_MAP.items():
                done_count = sum(1 for l in l_ids if l in completed_lessons)
                courses_progress[c_id] = {
                    "completed_count": done_count,
                    "total_count": len(l_ids),
                    "percentage": round((done_count / len(l_ids)) * 100) if l_ids else 0,
                    "is_completed": c_id in completed_courses or (done_count == len(l_ids) and len(l_ids) > 0),
                }

            # 1. KPI Cards
            kpis = [
                {
                    "id": "roadmap_progress",
                    "title": "ROADMAP PROGRESS",
                    "value": f"{len(completed_lessons)}/{total_lessons}",
                    "subtitle": f"{round((len(completed_lessons) / max(1, total_lessons)) * 100)}% Completed",
                    "footer": f"{len(completed_lessons)} of {total_lessons} core modules completed",
                    "tone": "orange",
                    "icon": "book-open",
                },
                {
                    "id": "courses_completed",
                    "title": "COURSES COMPLETED",
                    "value": f"{len(completed_courses)}/5",
                    "subtitle": f"{len(completed_courses)} Finished",
                    "footer": "Foundational Quantum Tracks",
                    "tone": "blue",
                    "icon": "award",
                },
                {
                    "id": "simulations_run",
                    "title": "SIMULATIONS RUN",
                    "value": str(stats["simulations_count"]),
                    "subtitle": f"+{stats.get('simulations_weekly_delta_pct', 0)}% this week",
                    "footer": "Aer / PennyLane local statevectors",
                    "tone": "neutral",
                    "icon": "cpu",
                },
                {
                    "id": "quiz_accuracy",
                    "title": "QUIZ ACCURACY",
                    "value": f"{stats['quiz_accuracy_pct']}%",
                    "subtitle": stats.get("percentile", "New Learner"),
                    "footer": "Across foundational assessments",
                    "tone": "green",
                    "icon": "target",
                },
                {
                    "id": "problems_solved",
                    "title": "PROBLEMS SOLVED",
                    "value": f"{len(solved)}/{total_prob}",
                    "subtitle": f"{len(solved)} Verified",
                    "footer": "Qiskit & PennyLane challenge bank",
                    "tone": "orange",
                    "icon": "award",
                },
            ]
            
            # 2. 6-Month Heatmap matrix (24 weeks x 7 days)
            now = datetime.now(timezone.utc)
            event_counts_by_date: Dict[str, int] = {}
            for ev in self._data["events"]:
                d = ev.get("date")
                if d:
                    event_counts_by_date[d] = event_counts_by_date.get(d, 0) + 1
                    
            weeks_count = 24
            days_per_week = 7
            heatmap: List[List[Dict[str, Any]]] = []
            
            total_logged_events = sum(event_counts_by_date.values())
            
            for w in range(weeks_count):
                week_arr = []
                for d in range(days_per_week):
                    days_ago = (weeks_count - 1 - w) * 7 + (6 - d)
                    dt = now - timedelta(days=days_ago)
                    iso_d = dt.strftime("%Y-%m-%d")
                    display_d = dt.strftime("%b %d")
                    count = event_counts_by_date.get(iso_d, 0)
                    
                    level = 0
                    if count >= 1 and count <= 2:
                        level = 1
                    elif count >= 3 and count <= 5:
                        level = 2
                    elif count >= 6 and count <= 8:
                        level = 3
                    elif count >= 9:
                        level = 4
                        
                    week_arr.append({
                        "date": display_d,
                        "iso_date": iso_d,
                        "count": count,
                        "level": level,
                    })
                heatmap.append(week_arr)

            # 3. Concept Mastery Radar points
            radar_points = []
            min_score = 101
            weakest_concept = None
            
            for name, meta in self._data.get("concept_mastery", {}).items():
                sc = meta.get("score", 70)
                radar_points.append({
                    "concept": name,
                    "score": sc,
                    "category": meta.get("category", "General"),
                })
                if sc < min_score:
                    min_score = sc
                    weakest_concept = name
                    
            focus_area = {
                "concept": weakest_concept or "Phase Kickback",
                "accuracy": f"{min_score if min_score <= 100 else 42}%",
                "recommended_problem_id": "phase_kickback_intro",
                "recommended_problem_title": "Phase Kickback Drill",
            }

            # 4. Recent Activity list (last 5)
            recent_events = []
            for ev in reversed(self._data["events"][-8:]):
                ev_type = ev.get("type", "activity")
                label = "Completed action"
                detail = "Quantum simulation"
                tone = "blue"
                
                if ev_type == "simulation_run":
                    label = "Ran simulation"
                    detail = f"Circuit ({ev.get('metadata', {}).get('qubits', 2)} qubits)"
                    tone = "orange"
                elif ev_type == "problem_solved":
                    label = "Solved problem"
                    detail = ev.get("metadata", {}).get("problem_id", "Quantum Challenge").replace("_", " ").title()
                    tone = "green"
                elif ev_type == "lesson_completed":
                    label = "Completed lesson"
                    detail = ev.get("metadata", {}).get("lesson_id", "Lesson module").replace("-", " ").title()
                    tone = "blue"
                elif ev_type == "quiz_submitted":
                    label = "Submitted quiz"
                    detail = "Quiz assessment"
                    tone = "green" if ev.get("metadata", {}).get("is_correct") else "muted"
                    
                recent_events.append({
                    "id": ev.get("id"),
                    "label": label,
                    "detail": detail,
                    "time": ev.get("date", "Today"),
                    "xp": f"+{ev.get('xp', 10)} XP" if ev.get("xp", 0) > 0 else "+0 XP",
                    "tone": tone,
                })

            return {
                "user_profile": profile,
                "kpis": kpis,
                "heatmap": heatmap,
                "total_events_6m": total_logged_events,
                "current_streak_days": profile.get("streak_days", 0),
                "radar_data": radar_points,
                "focus_area": focus_area,
                "recent_activity": recent_events,
                "completed_courses_count": len(completed_courses),
                "completed_lessons_count": len(completed_lessons),
                "total_courses_count": 5,
                "total_lessons_count": 44,
                "courses_progress": courses_progress,
            }

    def reset_to_baseline(self):
        """Reset data back to seed baseline."""
        with _lock:
            self._data = _get_default_baseline()
            self._save_unsafe()

# Global singleton instance
analytics_store = AnalyticsStore()
