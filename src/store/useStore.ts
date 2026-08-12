import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exam, SavedExam, ViewedExam, Post, User, TabId } from '../types';
import { EXAMS } from '../data/exams';
import { INITIAL_POSTS } from '../data/community';
import { isOwnPhoto } from '../lib/avatar';

interface AppState {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Exams
  exams: Exam[];
  savedExams: SavedExam[];
  saveExam: (examId: string) => void;
  unsaveExam: (examId: string) => void;
  updateExamStatus: (examId: string, status: SavedExam['status']) => void;
  isExamSaved: (examId: string) => boolean;

  // View history
  viewedExams: ViewedExam[];
  clearHistory: () => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterSubject: string;
  setFilterSubject: (s: string) => void;
  filterRegion: string;
  setFilterRegion: (r: string) => void;
  filterSortBy: 'date' | 'name' | 'distance';
  setFilterSortBy: (s: 'date' | 'name' | 'distance') => void;
  /** Only listings whose link lands on the booking itself, not a page about it. */
  filterDirectOnly: boolean;
  setFilterDirectOnly: (v: boolean) => void;
  /** Only listings whose application window is open today. */
  filterOpenOnly: boolean;
  setFilterOpenOnly: (v: boolean) => void;

  // Location / GPS
  userLocation: { lat: number; lng: number } | null;
  locationStatus: 'idle' | 'pending' | 'granted' | 'denied' | 'error';
  requestLocation: () => void;

  // Community
  posts: Post[];
  addPost: (content: string, subject?: string, kind?: Post['kind'], tags?: string[]) => void;
  addReply: (postId: string, content: string) => void;
  /** Only ever called for the user's own posts — the UI hides it on everyone else's. */
  deletePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleLikeReply: (postId: string, replyId: string) => void;

  // User
  currentUser: User;
  updateUser: (updates: Partial<User>) => void;
  toggleFollow: (userId: string) => void;

  // UI
  showingExamDetail: string | null;
  setShowingExamDetail: (id: string | null) => void;
  showingFaq: boolean;
  setShowingFaq: (v: boolean) => void;
}

export const DEFAULT_USER: User = {
  id: 'me',
  name: 'Du',
  email: 'din@email.com',
  // Empty by design: a face here is one the user took themselves, or none.
  avatar: '',
  bio: 'Pluggar för att höja mina betyg och nå mitt drömprogram.',
  following: [],
  // Nobody follows a brand-new account. Seeding two was invented social proof.
  followers: [],
  completedExams: [],
  joinedAt: '2026-01-15',
  location: 'Stockholm',
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: 'discover',
      setActiveTab: (tab) => set({ activeTab: tab }),

      exams: EXAMS,
      savedExams: [],

      saveExam: (examId) => {
        const existing = get().savedExams.find((e) => e.examId === examId);
        if (!existing) {
          set((s) => ({
            savedExams: [
              ...s.savedExams,
              {
                examId,
                savedAt: new Date().toISOString(),
                status: 'interested',
              },
            ],
          }));
        }
      },

      unsaveExam: (examId) =>
        set((s) => ({ savedExams: s.savedExams.filter((e) => e.examId !== examId) })),

      updateExamStatus: (examId, status) =>
        set((s) => ({
          savedExams: s.savedExams.map((e) => (e.examId === examId ? { ...e, status } : e)),
        })),

      isExamSaved: (examId) => get().savedExams.some((e) => e.examId === examId),

      viewedExams: [],
      clearHistory: () => set({ viewedExams: [] }),

      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      filterSubject: '',
      setFilterSubject: (s) => set({ filterSubject: s }),
      filterRegion: '',
      setFilterRegion: (r) => set({ filterRegion: r }),
      filterSortBy: 'date',
      setFilterSortBy: (s) => set({ filterSortBy: s }),
      filterDirectOnly: false,
      setFilterDirectOnly: (v) => set({ filterDirectOnly: v }),
      filterOpenOnly: false,
      setFilterOpenOnly: (v) => set({ filterOpenOnly: v }),

      userLocation: null,
      locationStatus: 'idle',
      requestLocation: () => {
        if (!('geolocation' in navigator)) {
          set({ locationStatus: 'error' });
          return;
        }
        set({ locationStatus: 'pending' });
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            set({
              userLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
              locationStatus: 'granted',
              filterSortBy: 'distance',
            });
          },
          () => set({ locationStatus: 'denied' }),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
        );
      },

      posts: INITIAL_POSTS,

      addPost: (content, subject, kind, tags) =>
        set((s) => ({
          posts: [
            {
              id: `p${Date.now()}`,
              userId: 'me',
              userName: s.currentUser.name,
              userAvatar: s.currentUser.avatar,
              content,
              subject,
              kind,
              createdAt: new Date().toISOString(),
              likes: 0,
              likedBy: [],
              replies: [],
              tags: tags || [],
            },
            ...s.posts,
          ],
        })),

      addReply: (postId, content) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  replies: [
                    ...p.replies,
                    {
                      id: `r${Date.now()}`,
                      userId: 'me',
                      userName: s.currentUser.name,
                      userAvatar: s.currentUser.avatar,
                      content,
                      createdAt: new Date().toISOString(),
                      likes: 0,
                      likedBy: [],
                    },
                  ],
                }
              : p,
          ),
        })),

      deletePost: (postId) =>
        set((s) => ({
          posts: s.posts.filter((p) => !(p.id === postId && p.userId === 'me')),
        })),

      toggleLikePost: (postId) =>
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            const liked = p.likedBy.includes('me');
            return {
              ...p,
              likes: liked ? p.likes - 1 : p.likes + 1,
              likedBy: liked ? p.likedBy.filter((id) => id !== 'me') : [...p.likedBy, 'me'],
            };
          }),
        })),

      toggleLikeReply: (postId, replyId) =>
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              replies: p.replies.map((r) => {
                if (r.id !== replyId) return r;
                const liked = r.likedBy.includes('me');
                return {
                  ...r,
                  likes: liked ? r.likes - 1 : r.likes + 1,
                  likedBy: liked ? r.likedBy.filter((id) => id !== 'me') : [...r.likedBy, 'me'],
                };
              }),
            };
          }),
        })),

      currentUser: DEFAULT_USER,
      updateUser: (updates) => set((s) => ({ currentUser: { ...s.currentUser, ...updates } })),

      toggleFollow: (userId) =>
        set((s) => {
          const following = s.currentUser.following.includes(userId)
            ? s.currentUser.following.filter((id) => id !== userId)
            : [...s.currentUser.following, userId];
          return { currentUser: { ...s.currentUser, following } };
        }),

      showingExamDetail: null,
      setShowingExamDetail: (id) => {
        if (id) {
          set((s) => ({
            showingExamDetail: id,
            viewedExams: [
              { examId: id, viewedAt: new Date().toISOString() },
              ...s.viewedExams.filter((v) => v.examId !== id),
            ].slice(0, 40),
          }));
        } else {
          set({ showingExamDetail: null });
        }
      },
      showingFaq: false,
      setShowingFaq: (v) => set({ showingFaq: v }),
    }),
    {
      name: 'provningar-storage',
      version: 1,
      partialize: (s) => ({
        savedExams: s.savedExams,
        viewedExams: s.viewedExams,
        currentUser: s.currentUser,
        posts: s.posts,
      }),
      migrate: (persisted, version) => (version < 1 ? stripStockAvatars(persisted) : persisted),
    },
  ),
);

/**
 * v0 → v1: drop the stock photographs.
 *
 * Posts and the user's own profile are persisted, so returning users still have
 * pravatar URLs of strangers sitting in localStorage. Removing them from the
 * source data alone would leave those faces on screen forever, so the stored
 * copy gets the same rule applied on load: keep the photo only if the user
 * supplied it themselves.
 */
export function stripStockAvatars(persisted: unknown): unknown {
  if (!persisted || typeof persisted !== 'object') return persisted;
  const state = persisted as {
    currentUser?: Partial<User>;
    posts?: Post[];
  };
  const clean = (src?: string) => (isOwnPhoto(src) ? src : undefined);

  return {
    ...state,
    currentUser: state.currentUser
      ? { ...state.currentUser, avatar: clean(state.currentUser.avatar) ?? '' }
      : state.currentUser,
    posts: state.posts?.map((p) => ({
      ...p,
      userAvatar: clean(p.userAvatar),
      replies: p.replies?.map((r) => ({ ...r, userAvatar: clean(r.userAvatar) })) ?? [],
    })),
  };
}
