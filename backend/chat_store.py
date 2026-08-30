"""
SQLite persistence layer for AI Tutor chat sessions.
Uses Python's built-in sqlite3 — zero external dependencies.
DB file: backend/data/tutor_chat.db (auto-created).
"""

import sqlite3
import uuid
import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DB_DIR, "tutor_chat.db")

def _get_conn() -> sqlite3.Connection:
    """Get a connection with row_factory for dict-style access."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db() -> None:
    """Create tables if they don't exist."""
    conn = _get_conn()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT 'New Chat',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'tutor')),
                content TEXT NOT NULL,
                concept_tag TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_messages_session
                ON messages(session_id, created_at);
        """)
        conn.commit()
    finally:
        conn.close()

def create_session(title: str = "New Chat") -> Dict[str, Any]:
    """Create a new chat session. Returns {id, title, created_at, updated_at}."""
    conn = _get_conn()
    try:
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (session_id, title, now, now),
        )
        conn.commit()
        return {"id": session_id, "title": title, "created_at": now, "updated_at": now}
    finally:
        conn.close()

def list_sessions() -> List[Dict[str, Any]]:
    """List all sessions (newest first) with message counts."""
    conn = _get_conn()
    try:
        rows = conn.execute("""
            SELECT
                s.id, s.title, s.created_at, s.updated_at,
                COUNT(m.id) as message_count
            FROM sessions s
            LEFT JOIN messages m ON m.session_id = s.id
            GROUP BY s.id
            ORDER BY s.updated_at DESC
        """).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_session_messages(session_id: str) -> List[Dict[str, Any]]:
    """Get all messages for a session, ordered chronologically."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT id, session_id, role, content, concept_tag, created_at "
            "FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Get session metadata by ID."""
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id, title, created_at, updated_at FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def save_message(
    session_id: str,
    role: str,
    content: str,
    concept_tag: str = "",
) -> Dict[str, Any]:
    """Save a message to a session. Returns the saved message record."""
    conn = _get_conn()
    try:
        msg_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "INSERT INTO messages (id, session_id, role, content, concept_tag, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (msg_id, session_id, role, content, concept_tag, now),
        )
        # Update session's updated_at timestamp
        conn.execute(
            "UPDATE sessions SET updated_at = ? WHERE id = ?",
            (now, session_id),
        )
        conn.commit()
        return {
            "id": msg_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "concept_tag": concept_tag,
            "created_at": now,
        }
    finally:
        conn.close()

def update_session_title(session_id: str, title: str) -> bool:
    """Update a session's title. Returns True if session existed."""
    conn = _get_conn()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = conn.execute(
            "UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?",
            (title, now, session_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def delete_session(session_id: str) -> bool:
    """Delete a session and all its messages (CASCADE). Returns True if session existed."""
    conn = _get_conn()
    try:
        cursor = conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
