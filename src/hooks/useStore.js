import { create } from 'zustand'
import { STORAGE_KEY, THEME_MODES, VIEW_MODES } from '../constants'

function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY.THEME) || THEME_MODES.LIGHT
}

function getStoredSidebar() {
  return localStorage.getItem(STORAGE_KEY.SIDEBAR_COLLAPSED) === 'true'
}

export const useAppStore = create((set, get) => ({
  theme: getStoredTheme(),
  sidebarCollapsed: getStoredSidebar(),
  viewMode: VIEW_MODES.GRID,
  sortBy: 'newest',
  filterType: 'all',
  searchQuery: '',
  rightPanelOpen: true,
  bottomDockOpen: false,

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY.THEME, theme)
    set({ theme })
  },

  toggleTheme: () => {
    const current = get().theme
    const next = current === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT
    localStorage.setItem(STORAGE_KEY.THEME, next)
    set({ theme: next })
  },

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed
    localStorage.setItem(STORAGE_KEY.SIDEBAR_COLLAPSED, next.toString())
    set({ sidebarCollapsed: next })
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setFilterType: (type) => set({ filterType: type }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleBottomDock: () => set((s) => ({ bottomDockOpen: !s.bottomDockOpen })),
  setBottomDockOpen: (open) => set({ bottomDockOpen: open }),
}))

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  logout: () => set({ user: null, session: null }),
}))

export const useBookmarkStore = create((set, get) => ({
  bookmarks: [],
  collections: [],
  tags: [],
  currentCollection: null,
  loading: false,

  setBookmarks: (bookmarks) => set({ bookmarks }),
  setCollections: (collections) => set({ collections }),
  setTags: (tags) => set({ tags }),
  setCurrentCollection: (collection) => set({ currentCollection: collection }),
  setLoading: (loading) => set({ loading }),

  addBookmark: (bookmark) => set((s) => ({ bookmarks: [bookmark, ...s.bookmarks] })),
  updateBookmark: (id, updates) =>
    set((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),
  removeBookmark: (id) =>
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),

  addCollection: (collection) => set((s) => ({ collections: [...s.collections, collection] })),
  updateCollection: (id, updates) =>
    set((s) => ({
      collections: s.collections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeCollection: (id) =>
    set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),
}))

export const useStudyStore = create((set, get) => ({
  activeSession: null,
  elapsed: 0,
  status: 'idle',
  sessions: [],

  setActiveSession: (session) => set({ activeSession: session, status: session?.status || 'idle' }),
  setElapsed: (elapsed) => set({ elapsed }),
  setStatus: (status) => set({ status }),
  setSessions: (sessions) => set({ sessions }),

  incrementElapsed: () => set((s) => ({ elapsed: s.elapsed + 1 })),

  reset: () => set({ activeSession: null, elapsed: 0, status: 'idle' }),
}))
