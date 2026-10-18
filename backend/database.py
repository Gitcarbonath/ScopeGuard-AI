
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "scopeguard.db"


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with connect() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                agreed_scope TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                client_request TEXT NOT NULL,
                result_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id)
                    REFERENCES projects(id) ON DELETE CASCADE
            );
        """)


def create_project(name, agreed_scope):
    with connect() as conn:
        cursor = conn.execute(
            "INSERT INTO projects (name, agreed_scope) VALUES (?, ?)",
            (name, agreed_scope),
        )
        row = conn.execute(
            "SELECT * FROM projects WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return dict(row)


def list_projects():
    with connect() as conn:
        rows = conn.execute("""
            SELECT p.*,
                   (SELECT COUNT(*) FROM analyses a
                    WHERE a.project_id = p.id) AS analysis_count
            FROM projects p
            ORDER BY p.id DESC
        """).fetchall()
        return [dict(row) for row in rows]


def get_project(project_id):
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM projects WHERE id = ?",
            (project_id,),
        ).fetchone()
        return dict(row) if row else None


def save_analysis(project_id, client_request, result):
    with connect() as conn:
        cursor = conn.execute(
            """INSERT INTO analyses
               (project_id, client_request, result_json)
               VALUES (?, ?, ?)""",
            (project_id, client_request, json.dumps(result)),
        )
        return cursor.lastrowid


def list_analyses(project_id):
    with connect() as conn:
        rows = conn.execute(
            """SELECT * FROM analyses
               WHERE project_id = ?
               ORDER BY id DESC""",
            (project_id,),
        ).fetchall()

        result = []
        for row in rows:
            item = dict(row)
            item["result"] = json.loads(item.pop("result_json"))
            result.append(item)

        return result

def update_project(project_id, name, agreed_scope):
    with connect() as conn:
        cursor = conn.execute(
            """UPDATE projects
               SET name = ?, agreed_scope = ?
               WHERE id = ?""",
            (name, agreed_scope, project_id),
        )

        if cursor.rowcount == 0:
            return None

        row = conn.execute(
            "SELECT * FROM projects WHERE id = ?",
            (project_id,),
        ).fetchone()

        return dict(row)


def delete_project(project_id):
    with connect() as conn:
        cursor = conn.execute(
            "DELETE FROM projects WHERE id = ?",
            (project_id,),
        )
        return cursor.rowcount > 0