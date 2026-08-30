import pytest
from backend.analytics import analytics_store

def test_dashboard_metrics_aggregation():
    metrics = analytics_store.get_dashboard_metrics()
    assert "user_profile" in metrics
    assert "kpis" in metrics
    assert "heatmap" in metrics
    assert "radar_data" in metrics
    assert "focus_area" in metrics
    assert "recent_activity" in metrics
    assert "courses_progress" in metrics
    
    assert len(metrics["kpis"]) == 5
    assert len(metrics["heatmap"]) == 24  # 24 weeks
    assert len(metrics["radar_data"]) >= 6  # 6 radar concepts
    assert metrics["current_streak_days"] >= 0

def test_simulation_recording_increments_count():
    initial_metrics = analytics_store.get_dashboard_metrics()
    sim_kpi = next(k for k in initial_metrics["kpis"] if k["id"] == "simulations_run")
    initial_sims = int(sim_kpi["value"])
    
    analytics_store.record_simulation(backend_name="qiskit_aer", qubits_count=2)
    
    new_metrics = analytics_store.get_dashboard_metrics()
    new_sim_kpi = next(k for k in new_metrics["kpis"] if k["id"] == "simulations_run")
    new_sims = int(new_sim_kpi["value"])
    assert new_sims == initial_sims + 1

def test_quiz_and_lesson_recording():
    analytics_store.reset_to_baseline()
    initial_metrics = analytics_store.get_dashboard_metrics()
    initial_xp = initial_metrics["user_profile"]["xp"]
    
    unique_lesson_id = "test-lesson-new"
    analytics_store.record_quiz_submission(lesson_id=unique_lesson_id, is_correct=True, topic="Phase Kickback")
    analytics_store.record_lesson_completion(course_id="foundation", lesson_id=unique_lesson_id, xp=100)
    
    new_metrics = analytics_store.get_dashboard_metrics()
    assert new_metrics["user_profile"]["xp"] >= initial_xp + 100

    # Reset back to clean 0 baseline
    analytics_store.reset_to_baseline()

