-- ============================================
-- BookmarkHub — Complete SQL Schema
-- Compatible with PostgreSQL / Supabase
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
-- ============================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bookmark_id UUID REFERENCES public.bookmarks(id) ON DELETE SET NULL,
    bookmark_title TEXT DEFAULT 'Study Session',
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'paused', 'stopped')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_duration INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON public.collections(parent_id);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection_id ON public.bookmarks(collection_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON public.bookmarks(type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_deleted_at ON public.bookmarks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_favorite ON public.bookmarks(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_pinned ON public.bookmarks(user_id, is_pinned) WHERE is_pinned = true;

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_bookmark_id ON public.bookmark_tags(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag_id ON public.bookmark_tags(tag_id);

-- Study sessions indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON public.study_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON public.study_sessions(status);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_bookmark_id ON public.notes(bookmark_id);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Media progress indexes
CREATE INDEX IF NOT EXISTS idx_media_progress_user_id ON public.media_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_media_progress_bookmark_id ON public.media_progress(bookmark_id);

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
    INSERT INTO public.users (id, email, username, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_metadata->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_metadata->>'name', '')
    );

    INSERT INTO public.settings (user_id) VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
        AND status = 'stopped'
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
$$ LANGUAGE plpgsql;

-- Get daily study stats
CREATE OR REPLACE FUNCTION public.get_daily_study_stats(p_user_id UUID, p_date DATE)
RETURNS TABLE(total_duration BIGINT, session_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(total_duration), 0) AS total_duration,
        COUNT(*) AS session_count
    FROM public.study_sessions
    WHERE user_id = p_user_id
    AND DATE(started_at) = p_date
    AND status = 'stopped';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on all tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
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

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
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

-- Users policies
CREATE POLICY users_select_own ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY users_admin_all ON public.users FOR ALL USING (full_access = true);

-- Collections policies
CREATE POLICY collections_owner ON public.collections FOR ALL USING (user_id = auth.uid());

-- Bookmarks policies
CREATE POLICY bookmarks_owner ON public.bookmarks FOR ALL USING (user_id = auth.uid());

-- Tags policies
CREATE POLICY tags_owner ON public.tags FOR ALL USING (user_id = auth.uid());

-- Bookmark tags policies
CREATE POLICY bookmark_tags_owner ON public.bookmark_tags FOR ALL USING (
    bookmark_id IN (SELECT id FROM public.bookmarks WHERE user_id = auth.uid())
);

-- Study sessions policies
CREATE POLICY study_sessions_owner ON public.study_sessions FOR ALL USING (user_id = auth.uid());

-- Notes policies
CREATE POLICY notes_owner ON public.notes FOR ALL USING (user_id = auth.uid());

-- Settings policies
CREATE POLICY settings_owner ON public.settings FOR ALL USING (user_id = auth.uid());

-- Activity logs policies
CREATE POLICY activity_logs_owner ON public.activity_logs FOR ALL USING (user_id = auth.uid());

-- Media progress policies
CREATE POLICY media_progress_owner ON public.media_progress FOR ALL USING (user_id = auth.uid());

-- ============================================
-- SEED DATA (Optional - uncomment if needed)
-- ============================================
-- Note: Tags are user-specific. Replace with a real user ID or omit.
-- INSERT INTO public.tags (id, user_id, name, color) VALUES
--     ('e15c7e40-9b2a-4f6a-9d1e-000000000001', 'YOUR-USER-ID-HERE', 'Important', '#EF4444'),
--     ('e15c7e40-9b2a-4f6a-9d1e-000000000002', 'YOUR-USER-ID-HERE', 'Work', '#3B82F6'),
--     ('e15c7e40-9b2a-4f6a-9d1e-000000000003', 'YOUR-USER-ID-HERE', 'Personal', '#22C55E'),
--     ('e15c7e40-9b2a-4f6a-9d1e-000000000004', 'YOUR-USER-ID-HERE', 'Study', '#F59E0B'),
--     ('e15c7e40-9b2a-4f6a-9d1e-000000000005', 'YOUR-USER-ID-HERE', 'Later', '#8B5CF6')
-- ON CONFLICT DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.tags TO anon;

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
