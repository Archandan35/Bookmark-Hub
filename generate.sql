-- ============================================
-- BookmarkHub — Complete SQL Schema
-- Compatible with PostgreSQL / Supabase
-- Schema version: 3
-- Idempotent: safe to re-run on an existing database.
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    name TEXT,
    mobile TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_premium BOOLEAN DEFAULT false,
    full_access BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. COLLECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'Folder',
    color TEXT DEFAULT '#5B3FD6',
    sort_order INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. BOOKMARKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    url TEXT DEFAULT '',
    type TEXT DEFAULT 'website' CHECK (type IN ('website', 'folder', 'pdf', 'video', 'audio', 'markdown', 'image', 'code', 'zip', 'note', 'text', 'custom')),
    thumbnail TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    view_count INTEGER DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    last_opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- ============================================
-- 5. BOOKMARK_TAGS (JUNCTION)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookmark_tags (
    bookmark_id UUID NOT NULL REFERENCES public.bookmarks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (bookmark_id, tag_id)
);

-- ============================================
-- 6. STUDY_SESSIONS TABLE
-- Backs the Study Timer / Video Player session system.
-- ============================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bookmark_id UUID REFERENCES public.bookmarks(id) ON DELETE SET NULL,
    bookmark_title TEXT DEFAULT 'Study Session',
    status TEXT DEFAULT 'running',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_duration INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- v2 columns for the synchronized study-session system -------------------
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS folder_name        TEXT    DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS video_name         TEXT    DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS video_id           TEXT    DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS elapsed_seconds    INTEGER DEFAULT 0;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS completion_percent INTEGER DEFAULT 0;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS session_number     INTEGER DEFAULT 1;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS video_duration     INTEGER DEFAULT 0;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS client_session_id  TEXT;

-- --- Constraints (dropped first so re-running widens them safely) -----------
ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_status_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_status_check
    CHECK (status IN ('running', 'active', 'paused', 'stopped', 'completed'));

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_completion_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_completion_check
    CHECK (completion_percent >= 0 AND completion_percent <= 100);

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_elapsed_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_elapsed_check
    CHECK (elapsed_seconds >= 0);

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_duration_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_duration_check
    CHECK (total_duration >= 0);

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_session_number_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_session_number_check
    CHECK (session_number >= 1);

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_time_order_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_time_order_check
    CHECK (ended_at IS NULL OR ended_at >= started_at);

-- Idempotent saves: a client session may only ever be stored once per user.
CREATE UNIQUE INDEX IF NOT EXISTS uq_study_sessions_client_id
    ON public.study_sessions(user_id, client_session_id)
    WHERE client_session_id IS NOT NULL;

-- Keep legacy rows consistent with the new columns.
UPDATE public.study_sessions
SET elapsed_seconds = total_duration
WHERE COALESCE(elapsed_seconds, 0) = 0 AND COALESCE(total_duration, 0) > 0;

-- --- v3: study-session dimensional metadata (source / course / educator / topic / lesson) ------
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS source_id         TEXT;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS source_name       TEXT DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS source_url        TEXT DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS domain            TEXT DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS course_id         TEXT;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS course_name       TEXT DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS educator_id       TEXT;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS educator_name     TEXT DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS lesson_id         TEXT;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS lesson_number     INTEGER;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS lesson_title      TEXT DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS topic_id          TEXT;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS topic_name        TEXT DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS subtopic_id       TEXT;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS subtopic_name     TEXT DEFAULT '';
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS content_type      TEXT DEFAULT 'video'
    CHECK (content_type IN ('video', 'audio', 'pdf', 'website', 'ebook', 'notes', 'practice', 'other'));
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS progress_start    INTEGER DEFAULT 0;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS progress_end      INTEGER DEFAULT 0;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS continuation_of   UUID;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS base_duration     INTEGER DEFAULT 0;

-- A session can never legitimately skip straight from completed back to active.
ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_status_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_status_check
    CHECK (status IN ('running', 'active', 'paused', 'stopped', 'completed', 'discarded'));

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_lesson_number_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_lesson_number_check
    CHECK (lesson_number IS NULL OR lesson_number >= 1);

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_progress_start_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_progress_start_check
    CHECK (progress_start >= 0 AND progress_start <= 100);

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_progress_end_check;
ALTER TABLE public.study_sessions ADD  CONSTRAINT study_sessions_progress_end_check
    CHECK (progress_end >= 0 AND progress_end <= 100);

-- ============================================
-- 6.5. STUDY_SOURCES TABLE (application / website)
-- ============================================
CREATE TABLE IF NOT EXISTS public.study_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT DEFAULT 'website' CHECK (source_type IN ('website', 'app', 'local', 'other')),
    domain TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    url TEXT DEFAULT '',
    is_custom BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- ============================================
-- 6.6. STUDY_EDUCATORS TABLE (instructor)
-- ============================================
CREATE TABLE IF NOT EXISTS public.study_educators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_id UUID REFERENCES public.study_sources(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- ============================================
-- 6.7. STUDY_COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.study_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    source_id UUID REFERENCES public.study_sources(id) ON DELETE CASCADE,
    educator_id UUID REFERENCES public.study_educators(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, source_id, name)
);

-- ============================================
-- 6.8. STUDY_TOPICS TABLE (topic → subtopic drill-down)
-- ============================================
CREATE TABLE IF NOT EXISTS public.study_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.study_courses(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.study_topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id, parent_id, name)
);

-- ============================================
-- 6.9. STUDY_LESSONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.study_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.study_courses(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.study_topics(id) ON DELETE SET NULL,
    source_id UUID REFERENCES public.study_sources(id) ON DELETE SET NULL,
    educator_id UUID REFERENCES public.study_educators(id) ON DELETE SET NULL,
    lesson_number INTEGER,
    title TEXT NOT NULL,
    content_type TEXT DEFAULT 'video',
    source_url TEXT DEFAULT '',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    completed_at TIMESTAMPTZ,
    last_studied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id, lesson_number)
);

-- ============================================
-- 7. NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bookmark_id UUID REFERENCES public.bookmarks(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    content TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
    email_notifications BOOLEAN DEFAULT true,
    study_reminders BOOLEAN DEFAULT true,
    weekly_report BOOLEAN DEFAULT false,
    new_features BOOLEAN DEFAULT true,
    study_goal_minutes INTEGER DEFAULT 240,
    daily_reminder_time TEXT DEFAULT '09:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- v2: study-session behaviour preferences
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS min_session_seconds INTEGER DEFAULT 5;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS pause_preference    TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS remember_pause_choice BOOLEAN DEFAULT false;

ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_pause_preference_check;
ALTER TABLE public.settings ADD  CONSTRAINT settings_pause_preference_check
    CHECK (pause_preference IS NULL OR pause_preference IN ('continue', 'pause'));

ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_min_session_check;
ALTER TABLE public.settings ADD  CONSTRAINT settings_min_session_check
    CHECK (min_session_seconds >= 0);

-- ============================================
-- 9. ACTIVITY_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT DEFAULT '',
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. MEDIA_PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.media_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bookmark_id UUID NOT NULL REFERENCES public.bookmarks(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    position INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, bookmark_id)
);

-- ============================================
-- 11. KEEPALIVE LOG TABLE
-- (defined before its policies are declared)
-- ============================================
CREATE TABLE IF NOT EXISTS public.keepalive_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT DEFAULT 'app',
    strategy TEXT DEFAULT 'unknown',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. GOAL_CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.goal_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Target',
    color TEXT DEFAULT '#3B82F6',
    icon_bg TEXT DEFAULT '#E6F1FE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- ============================================
-- 13. GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.goal_categories(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'Target',
    icon_bg TEXT DEFAULT '#E6F1FE',
    icon_color TEXT DEFAULT '#3B82F6',
    progress_color TEXT DEFAULT '#3B82F6',
    tags TEXT[] DEFAULT '{}',
    goal_type TEXT DEFAULT 'study_time' CHECK (goal_type IN ('study_time', 'sessions', 'count', 'habit')),
    target_value INTEGER DEFAULT 0,
    current_value INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'seconds',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    completed BOOLEAN DEFAULT false,
    target_date DATE,
    completed_at TIMESTAMPTZ,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_target_value_check;
ALTER TABLE public.goals ADD  CONSTRAINT goals_target_value_check CHECK (target_value >= 0);

ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_current_value_check;
ALTER TABLE public.goals ADD  CONSTRAINT goals_current_value_check CHECK (current_value >= 0);

-- v3: dimensional goals (target a specific application/course/educator/topic/lesson)
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS dimension      TEXT DEFAULT 'total'
    CHECK (dimension IN ('total', 'application', 'course', 'educator', 'topic', 'lesson'));
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS dimension_id   TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS dimension_name TEXT DEFAULT '';
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS period         TEXT DEFAULT 'lifetime'
    CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly', 'lifetime'));

-- ============================================
-- 14. GOAL_MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    color TEXT DEFAULT '#10B981',
    target_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. DAILY_GOALS TABLE (per-day study target)
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    goal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_seconds INTEGER DEFAULT 18000 CHECK (target_seconds >= 0),
    achieved_seconds INTEGER DEFAULT 0 CHECK (achieved_seconds >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, goal_date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON public.collections(parent_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection_id ON public.bookmarks(collection_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON public.bookmarks(type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_deleted_at ON public.bookmarks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_favorite ON public.bookmarks(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_pinned ON public.bookmarks(user_id, is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_bookmark_id ON public.bookmark_tags(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag_id ON public.bookmark_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON public.study_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON public.study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_video ON public.study_sessions(user_id, video_id);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_bookmark_id ON public.notes(bookmark_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_progress_user_id ON public.media_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_media_progress_bookmark_id ON public.media_progress(bookmark_id);

CREATE INDEX IF NOT EXISTS idx_keepalive_log_created_at ON public.keepalive_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_keepalive_log_source ON public.keepalive_log(source);

CREATE INDEX IF NOT EXISTS idx_goal_categories_user_id ON public.goal_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_category_id ON public.goals(category_id);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON public.goals(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_user_id ON public.goal_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON public.goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_target_date ON public.goal_milestones(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON public.daily_goals(user_id, goal_date DESC);

-- Study entity indexes
CREATE INDEX IF NOT EXISTS idx_study_sources_user_id ON public.study_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_study_educators_user_id ON public.study_educators(user_id);
CREATE INDEX IF NOT EXISTS idx_study_educators_source_id ON public.study_educators(source_id);
CREATE INDEX IF NOT EXISTS idx_study_courses_user_id ON public.study_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_study_courses_source_id ON public.study_courses(source_id);
CREATE INDEX IF NOT EXISTS idx_study_courses_educator_id ON public.study_courses(educator_id);
CREATE INDEX IF NOT EXISTS idx_study_topics_user_id ON public.study_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_study_topics_course_id ON public.study_topics(course_id);
CREATE INDEX IF NOT EXISTS idx_study_topics_parent_id ON public.study_topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_study_lessons_user_id ON public.study_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_study_lessons_course_id ON public.study_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_study_lessons_topic_id ON public.study_lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_lessons_source_id ON public.study_lessons(source_id);
CREATE INDEX IF NOT EXISTS idx_study_lessons_educator_id ON public.study_lessons(educator_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_source ON public.study_sessions(user_id, source_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_course ON public.study_sessions(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_educator ON public.study_sessions(user_id, educator_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_lesson ON public.study_sessions(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_topic ON public.study_sessions(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_goals_dimension ON public.goals(user_id, dimension, dimension_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user (called by auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, name, mobile)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = COALESCE(EXCLUDED.username, public.users.username),
        name = COALESCE(EXCLUDED.name, public.users.name);

    INSERT INTO public.settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- A session counts toward statistics only when finalized.
CREATE OR REPLACE FUNCTION public.is_completed_session(p_status TEXT)
RETURNS BOOLEAN AS $$
    SELECT p_status IN ('stopped', 'completed');
$$ LANGUAGE sql IMMUTABLE;

-- Calculate study streak
CREATE OR REPLACE FUNCTION public.get_study_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    streak INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    session_date DATE;
BEGIN
    FOR session_date IN
        SELECT DISTINCT DATE(started_at)
        FROM public.study_sessions
        WHERE user_id = p_user_id
          AND public.is_completed_session(status)
        ORDER BY DATE(started_at) DESC
    LOOP
        IF session_date = check_date OR session_date = check_date - 1 THEN
            streak := streak + 1;
            check_date := session_date - 1;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    RETURN streak;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get daily study stats
CREATE OR REPLACE FUNCTION public.get_daily_study_stats(p_user_id UUID, p_date DATE)
RETURNS TABLE(total_duration BIGINT, session_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(GREATEST(COALESCE(elapsed_seconds, 0), COALESCE(total_duration, 0))), 0)::BIGINT,
        COUNT(*)::BIGINT
    FROM public.study_sessions
    WHERE user_id = p_user_id
      AND DATE(started_at) = p_date
      AND public.is_completed_session(status);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Aggregate study totals used by Statistics / Goals / Learn pages.
CREATE OR REPLACE FUNCTION public.get_study_totals(p_user_id UUID)
RETURNS TABLE(
    today_seconds BIGINT,
    weekly_seconds BIGINT,
    monthly_seconds BIGINT,
    lifetime_seconds BIGINT,
    sessions_completed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH finished AS (
        SELECT
            started_at,
            GREATEST(COALESCE(elapsed_seconds, 0), COALESCE(total_duration, 0)) AS secs
        FROM public.study_sessions
        WHERE user_id = p_user_id
          AND public.is_completed_session(status)
    )
    SELECT
        COALESCE(SUM(secs) FILTER (WHERE DATE(started_at) = CURRENT_DATE), 0)::BIGINT,
        COALESCE(SUM(secs) FILTER (WHERE started_at >= date_trunc('week', NOW())), 0)::BIGINT,
        COALESCE(SUM(secs) FILTER (WHERE started_at >= date_trunc('month', NOW())), 0)::BIGINT,
        COALESCE(SUM(secs), 0)::BIGINT,
        COUNT(*)::BIGINT
    FROM finished;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Next sequential session number for a given video.
CREATE OR REPLACE FUNCTION public.next_session_number(p_user_id UUID, p_video_id TEXT)
RETURNS INTEGER AS $$
    SELECT COALESCE(MAX(session_number), 0) + 1
    FROM public.study_sessions
    WHERE user_id = p_user_id
      AND COALESCE(video_id, '') = COALESCE(p_video_id, '');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Keep daily_goals.achieved_seconds in sync with completed sessions.
CREATE OR REPLACE FUNCTION public.sync_daily_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_date DATE;
    v_total BIGINT;
BEGIN
    v_date := DATE(COALESCE(NEW.started_at, OLD.started_at));

    SELECT COALESCE(SUM(GREATEST(COALESCE(elapsed_seconds, 0), COALESCE(total_duration, 0))), 0)
    INTO v_total
    FROM public.study_sessions
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND DATE(started_at) = v_date
      AND public.is_completed_session(status);

    INSERT INTO public.daily_goals (user_id, goal_date, achieved_seconds)
    VALUES (COALESCE(NEW.user_id, OLD.user_id), v_date, v_total)
    ON CONFLICT (user_id, goal_date)
    DO UPDATE SET achieved_seconds = EXCLUDED.achieved_seconds, updated_at = NOW();

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recompute a study_time goal's progress from completed sessions.
CREATE OR REPLACE FUNCTION public.recalculate_goal_progress(p_goal_id UUID)
RETURNS VOID AS $$
DECLARE
    g RECORD;
    v_value BIGINT := 0;
    v_dim_col TEXT;
    v_total  BIGINT;
BEGIN
    SELECT * INTO g FROM public.goals WHERE id = p_goal_id;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Determine the column that matches the goal's dimension.
    v_dim_col := CASE g.dimension
        WHEN 'application' THEN 'source_id'
        WHEN 'course'      THEN 'course_id'
        WHEN 'educator'    THEN 'educator_id'
        WHEN 'topic'       THEN 'topic_id'
        WHEN 'lesson'      THEN 'lesson_id'
        ELSE NULL
    END;

    IF g.goal_type = 'study_time' THEN
        IF v_dim_col IS NULL THEN
            SELECT COALESCE(SUM(GREATEST(COALESCE(elapsed_seconds, 0), COALESCE(total_duration, 0))), 0)
            INTO v_value
            FROM public.study_sessions
            WHERE user_id = g.user_id
              AND public.is_completed_session(status)
              AND (g.created_at IS NULL OR started_at >= g.created_at);
        ELSE
            EXECUTE format(
                'SELECT COALESCE(SUM(GREATEST(COALESCE(elapsed_seconds, 0), COALESCE(total_duration, 0))), 0)
                   FROM public.study_sessions
                  WHERE user_id = $1
                    AND public.is_completed_session(status)
                    AND COALESCE(%I::text, '''') = COALESCE($2::text, '''')
                    AND ($3::timestamptz IS NULL OR started_at >= $3::timestamptz)',
                v_dim_col
            ) INTO v_total USING g.user_id, g.dimension_id, g.created_at;
            v_value := COALESCE(v_total, 0);
        END IF;
    ELSIF g.goal_type = 'sessions' THEN
        SELECT COUNT(*) INTO v_value
        FROM public.study_sessions
        WHERE user_id = g.user_id
          AND public.is_completed_session(status)
          AND (g.created_at IS NULL OR started_at >= g.created_at);
    ELSE
        v_value := g.current_value;
    END IF;

    UPDATE public.goals
    SET current_value = v_value,
        progress = CASE WHEN g.target_value > 0
                        THEN LEAST(100, GREATEST(0, ROUND((v_value::NUMERIC / g.target_value) * 100)))::INTEGER
                        ELSE 0 END,
        completed = (g.target_value > 0 AND v_value >= g.target_value),
        completed_at = CASE WHEN (g.target_value > 0 AND v_value >= g.target_value)
                            THEN COALESCE(g.completed_at, NOW()) ELSE NULL END,
        status = CASE WHEN g.status = 'archived' THEN 'archived'
                      WHEN (g.target_value > 0 AND v_value >= g.target_value) THEN 'completed'
                      ELSE 'active' END,
        updated_at = NOW()
    WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh every auto-tracked goal for a user.
CREATE OR REPLACE FUNCTION public.refresh_user_goals(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT id FROM public.goals
        WHERE user_id = p_user_id
          AND status <> 'archived'
          AND goal_type IN ('study_time', 'sessions')
    LOOP
        PERFORM public.recalculate_goal_progress(r.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_refresh_goals()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.refresh_user_goals(COALESCE(NEW.user_id, OLD.user_id));
    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Keepalive RPC function
CREATE OR REPLACE FUNCTION public.keepalive()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'status', 'ok',
        'timestamp', NOW(),
        'service', 'bookmarkhub'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Keep study_lessons.progress in sync with the latest completed session for that lesson.
CREATE OR REPLACE FUNCTION public.sync_lesson_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_lesson_id UUID;
    v_progress INTEGER;
BEGIN
    IF NEW.status = 'discarded' THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(l.id, (SELECT lesson_id::uuid FROM public.study_sessions WHERE id = COALESCE(NEW.continuation_of, NEW.id) LIMIT 1)::uuid)
    INTO v_lesson_id
    FROM public.study_lessons l
    WHERE l.id = COALESCE(NEW.lesson_id, NULL)::uuid
    LIMIT 1;

    IF v_lesson_id IS NULL AND NEW.lesson_id IS NOT NULL THEN
        v_lesson_id := NEW.lesson_id::uuid;
    END IF;

    IF v_lesson_id IS NOT NULL THEN
        SELECT COALESCE(MAX(progress_end), 0)
        INTO v_progress
        FROM public.study_sessions
        WHERE lesson_id = v_lesson_id::text
          AND public.is_completed_session(status);

        UPDATE public.study_lessons
        SET progress = LEAST(100, GREATEST(0, v_progress)),
            status = CASE WHEN v_progress >= 100 THEN 'completed'
                          WHEN v_progress > 0 THEN 'in_progress'
                          ELSE 'pending' END,
            completed_at = CASE WHEN v_progress >= 100 THEN COALESCE(completed_at, NOW()) ELSE NULL END,
            last_studied_at = COALESCE(NEW.ended_at, NEW.started_at),
            updated_at = NOW()
        WHERE id = v_lesson_id;
    END IF;

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on every table that has the column
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT c.table_name
        FROM information_schema.tables c
        JOIN information_schema.columns col
          ON col.table_schema = c.table_schema
         AND col.table_name = c.table_name
         AND col.column_name = 'updated_at'
        WHERE c.table_schema = 'public' AND c.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at ON public.%I', t);
        EXECUTE format('CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t);
    END LOOP;
END;
$$;

-- Handle new user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Study session -> daily goal + goal progress sync
DROP TRIGGER IF EXISTS trigger_sync_daily_goal ON public.study_sessions;
CREATE TRIGGER trigger_sync_daily_goal
    AFTER INSERT OR UPDATE OR DELETE ON public.study_sessions
    FOR EACH ROW EXECUTE FUNCTION public.sync_daily_goal_progress();

DROP TRIGGER IF EXISTS trigger_sync_goal_progress ON public.study_sessions;
CREATE TRIGGER trigger_sync_goal_progress
    AFTER INSERT OR UPDATE OR DELETE ON public.study_sessions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_goals();

DROP TRIGGER IF EXISTS trigger_sync_lesson_progress ON public.study_sessions;
CREATE TRIGGER trigger_sync_lesson_progress
    AFTER INSERT OR UPDATE OF lesson_id, progress_end, status ON public.study_sessions
    FOR EACH ROW EXECUTE FUNCTION public.sync_lesson_progress();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keepalive_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_educators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_lessons ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users FOR INSERT WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (id = auth.uid());

-- Collections policies
DROP POLICY IF EXISTS collections_owner ON public.collections;
CREATE POLICY collections_owner ON public.collections FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Bookmarks policies
DROP POLICY IF EXISTS bookmarks_owner ON public.bookmarks;
CREATE POLICY bookmarks_owner ON public.bookmarks FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Tags policies
DROP POLICY IF EXISTS tags_owner ON public.tags;
CREATE POLICY tags_owner ON public.tags FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Bookmark tags policies
DROP POLICY IF EXISTS bookmark_tags_owner ON public.bookmark_tags;
CREATE POLICY bookmark_tags_owner ON public.bookmark_tags FOR ALL USING (
    bookmark_id IN (SELECT id FROM public.bookmarks WHERE user_id = auth.uid())
) WITH CHECK (
    bookmark_id IN (SELECT id FROM public.bookmarks WHERE user_id = auth.uid())
);

-- Study sessions policies
DROP POLICY IF EXISTS study_sessions_owner ON public.study_sessions;
CREATE POLICY study_sessions_owner ON public.study_sessions FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notes policies
DROP POLICY IF EXISTS notes_owner ON public.notes;
CREATE POLICY notes_owner ON public.notes FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Settings policies
DROP POLICY IF EXISTS settings_owner ON public.settings;
CREATE POLICY settings_owner ON public.settings FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Activity logs policies
DROP POLICY IF EXISTS activity_logs_owner ON public.activity_logs;
CREATE POLICY activity_logs_owner ON public.activity_logs FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Media progress policies
DROP POLICY IF EXISTS media_progress_owner ON public.media_progress;
CREATE POLICY media_progress_owner ON public.media_progress FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Goal categories policies
DROP POLICY IF EXISTS goal_categories_owner ON public.goal_categories;
CREATE POLICY goal_categories_owner ON public.goal_categories FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Goals policies
DROP POLICY IF EXISTS goals_owner ON public.goals;
CREATE POLICY goals_owner ON public.goals FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Goal milestones policies
DROP POLICY IF EXISTS goal_milestones_owner ON public.goal_milestones;
CREATE POLICY goal_milestones_owner ON public.goal_milestones FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Daily goals policies
DROP POLICY IF EXISTS daily_goals_owner ON public.daily_goals;
CREATE POLICY daily_goals_owner ON public.daily_goals FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Study entity policies
DROP POLICY IF EXISTS study_sources_owner ON public.study_sources;
CREATE POLICY study_sources_owner ON public.study_sources FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS study_educators_owner ON public.study_educators;
CREATE POLICY study_educators_owner ON public.study_educators FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS study_courses_owner ON public.study_courses;
CREATE POLICY study_courses_owner ON public.study_courses FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS study_topics_owner ON public.study_topics;
CREATE POLICY study_topics_owner ON public.study_topics FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS study_lessons_owner ON public.study_lessons;
CREATE POLICY study_lessons_owner ON public.study_lessons FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Keepalive log policies
DROP POLICY IF EXISTS keepalive_log_insert ON public.keepalive_log;
CREATE POLICY keepalive_log_insert ON public.keepalive_log FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS keepalive_log_select ON public.keepalive_log;
CREATE POLICY keepalive_log_select ON public.keepalive_log FOR SELECT USING (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT INSERT, SELECT ON public.keepalive_log TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.keepalive() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_study_totals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_study_stats(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_study_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_session_number(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_user_goals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_goal_progress(UUID) TO authenticated;

-- ============================================
-- SCHEMA VERSION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public._schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

INSERT INTO public._schema_version (version, description)
VALUES (1, 'Initial schema: users, collections, bookmarks, tags, study_sessions, notes, settings, activity_logs, media_progress')
ON CONFLICT DO NOTHING;

INSERT INTO public._schema_version (version, description)
VALUES (2, 'Study session sync fields + goals, goal_categories, goal_milestones, daily_goals, study totals RPCs and triggers')
ON CONFLICT DO NOTHING;

INSERT INTO public._schema_version (version, description)
VALUES (3, 'Study session dimensional metadata (source/course/educator/topic/lesson) + study_sources, study_educators, study_courses, study_topics, study_lessons tables + dimension-based goals')
ON CONFLICT DO NOTHING;

-- ============================================
-- 16. EXAMS TABLE (Exam Counter page)
-- Schema version: 4
-- ============================================
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    exam_name TEXT NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TEXT DEFAULT '''',
    category TEXT DEFAULT '''',
    subject TEXT DEFAULT '''',
    description TEXT DEFAULT '''',
    exam_link TEXT DEFAULT '''',
    notes TEXT DEFAULT '''',
    reminder_settings TEXT[] DEFAULT ''{}'',
    reminders_enabled BOOLEAN DEFAULT true,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_user_date ON public.exams(user_id, exam_date);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exams_owner ON public.exams;
CREATE POLICY exams_owner ON public.exams FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
INSERT INTO public._schema_version (version, description)
VALUES (4, ''Exam Counter: exams table with countdown source-of-truth exam_date'')
ON CONFLICT DO NOTHING;
