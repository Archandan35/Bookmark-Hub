import {
  LayoutDashboard, Bookmark, Heart, Pin, Clock, Trash2, FolderOpen,
  Globe, FileText, Video, Music, FileCode, Image, Code, Archive,
  StickyNote, Star,
} from 'lucide-react'

export const BOOKMARK_TYPES = {
  WEBSITE: 'website',
  FOLDER: 'folder',
  PDF: 'pdf',
  VIDEO: 'video',
  AUDIO: 'audio',
  MARKDOWN: 'markdown',
  IMAGE: 'image',
  CODE: 'code',
  ZIP: 'zip',
  NOTE: 'note',
  TEXT: 'text',
  CUSTOM: 'custom',
}

export const BOOKMARK_TYPE_CONFIG = {
  [BOOKMARK_TYPES.WEBSITE]: { label: 'Website', color: '#3B82F6', icon: Globe },
  [BOOKMARK_TYPES.FOLDER]: { label: 'Folder', color: '#F59E0B', icon: FolderOpen },
  [BOOKMARK_TYPES.PDF]: { label: 'PDF', color: '#EF4444', icon: FileText },
  [BOOKMARK_TYPES.VIDEO]: { label: 'Video', color: '#8B5CF6', icon: Video },
  [BOOKMARK_TYPES.AUDIO]: { label: 'Audio', color: '#EC4899', icon: Music },
  [BOOKMARK_TYPES.MARKDOWN]: { label: 'Markdown', color: '#6366F1', icon: FileCode },
  [BOOKMARK_TYPES.IMAGE]: { label: 'Image', color: '#10B981', icon: Image },
  [BOOKMARK_TYPES.CODE]: { label: 'Code', color: '#14B8A6', icon: Code },
  [BOOKMARK_TYPES.ZIP]: { label: 'ZIP', color: '#78716C', icon: Archive },
  [BOOKMARK_TYPES.NOTE]: { label: 'Note', color: '#F59E0B', icon: StickyNote },
  [BOOKMARK_TYPES.TEXT]: { label: 'Text', color: '#6B7280', icon: FileText },
  [BOOKMARK_TYPES.CUSTOM]: { label: 'Custom', color: '#8B5CF6', icon: Star },
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'recently_opened', label: 'Recently Opened' },
  { value: 'recently_studied', label: 'Recently Studied' },
]

export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
}

export const STUDY_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
}

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
}

export const SIDEBAR_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'bookmarks', label: 'All Bookmarks', icon: Bookmark, path: '/bookmarks' },
  { id: 'favorites', label: 'Favorites', icon: Heart, path: '/favorites' },
  { id: 'pinned', label: 'Pinned', icon: Pin, path: '/pinned' },
  { id: 'recent', label: 'Recent', icon: Clock, path: '/recent' },
  { id: 'trash', label: 'Trash', icon: Trash2, path: '/trash' },
]

export const STORAGE_KEY = {
  THEME: 'bookmarkhub_theme',
  SIDEBAR_COLLAPSED: 'bookmarkhub_sidebar_collapsed',
}
