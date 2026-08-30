-- =============================================================================
-- qbit.labs: Supabase Database Schema for Quantum Course Platform
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. COURSES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    level TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Quantum Foundations',
    description TEXT NOT NULL,
    lessons_count INTEGER NOT NULL DEFAULT 0,
    completed_lessons_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('complete', 'active', 'open', 'locked')),
    badge_bg TEXT NOT NULL DEFAULT 'bg-[#fff4e6]',
    badge_border TEXT NOT NULL DEFAULT 'border-[#fed7aa]',
    badge_text TEXT NOT NULL DEFAULT 'text-[#c96b2c]',
    card_bg TEXT NOT NULL DEFAULT 'bg-[#fffaf0]',
    card_border TEXT NOT NULL DEFAULT 'border-[#fed7aa]',
    accent_color TEXT NOT NULL DEFAULT '#c96b2c',
    linked_challenge_id TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. MODULES (LESSONS) TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    duration TEXT NOT NULL DEFAULT '8 min',
    level TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    concept_heading TEXT NOT NULL,
    starter_qasm TEXT NOT NULL,
    available_gates JSONB NOT NULL DEFAULT '["h", "x", "z"]'::jsonb,
    num_qubits INTEGER NOT NULL DEFAULT 1,
    key_insight TEXT,
    real_world_application TEXT,
    historical_note TEXT,
    illustration_url TEXT,
    illustration_caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. LESSON_BLOCKS TABLE
-- Granular interactive block hierarchy:
-- theory, prediction, interactive, simulation, ai_question, challenge
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL CHECK (
        block_type IN ('theory', 'prediction', 'interactive', 'simulation', 'ai_question', 'challenge')
    ),
    order_index INTEGER NOT NULL DEFAULT 0,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. USER PROGRESS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    saved_qasm TEXT,
    circuit_state JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_module_progress_unique UNIQUE (user_id, module_id)
);

-- -----------------------------------------------------------------------------
-- 5. USER NOTES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_module_note_unique UNIQUE (user_id, module_id)
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR FAST QUERYING
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order_index ON public.modules(order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_module_id ON public.lesson_blocks(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_type ON public.lesson_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON public.user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON public.user_notes(user_id);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Courses, Modules, Lesson Blocks: Public Read
CREATE POLICY "Allow public read on courses"
    ON public.courses FOR SELECT
    USING (true);

CREATE POLICY "Allow public read on modules"
    ON public.modules FOR SELECT
    USING (true);

CREATE POLICY "Allow public read on lesson_blocks"
    ON public.lesson_blocks FOR SELECT
    USING (true);

-- User Progress: Anyone can read/insert/update by user_id or auth session
CREATE POLICY "Allow users to read their own progress"
    ON public.user_progress FOR SELECT
    USING (true);

CREATE POLICY "Allow users to upsert their own progress"
    ON public.user_progress FOR ALL
    USING (true)
    WITH CHECK (true);

-- User Notes: Read and manage own notes
CREATE POLICY "Allow users to read and manage notes"
    ON public.user_notes FOR ALL
    USING (true)
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- AUTO-UPDATE UPDATED_AT TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_courses_timestamp
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_modules_timestamp
    BEFORE UPDATE ON public.modules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_user_progress_timestamp
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_user_notes_timestamp
    BEFORE UPDATE ON public.user_notes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
