import { useState, useEffect, lazy, Suspense, ReactNode } from 'react';
import { useStore } from './store/useStore';
import { LoadingScreen } from './components/LoadingScreen';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { ExamDetail } from './components/ExamDetail';
import { FaqSheet } from './components/FaqSheet';
import { UpdateBanner } from './components/UpdateBanner';
import { useVersionCheck } from './hooks/useVersionCheck';
import { Discover } from './tabs/Discover';

// Every tab used to be in the first chunk even though four of the five are
// hidden until the user navigates to them. Discover stays eager — it is what
// you land on — and the rest arrive when first opened. Once mounted they stay
// mounted, so tab state survives switching exactly as before.
const Exams = lazy(() => import('./tabs/Exams').then(m => ({ default: m.Exams })));
const Community = lazy(() => import('./tabs/Community').then(m => ({ default: m.Community })));
const History = lazy(() => import('./tabs/History').then(m => ({ default: m.History })));
const Profile = lazy(() => import('./tabs/Profile').then(m => ({ default: m.Profile })));

/** Renders a tab's chunk only once it has been opened, then keeps it mounted. */
function TabPanel({ active, visited, children }: { active: boolean; visited: boolean; children: ReactNode }) {
  return (
    <div className={`h-full ${active ? 'block' : 'hidden'}`}>
      {visited && <Suspense fallback={<TabFallback />}>{children}</Suspense>}
    </div>
  );
}

function TabFallback() {
  return (
    <div className="h-full flex items-center justify-center" role="status" aria-label="Laddar">
      <div className="w-8 h-8 rounded-full border-2 border-line border-t-brand-500 animate-spin" />
    </div>
  );
}

export default function App() {
  const { activeTab, showingExamDetail, showingFaq, setShowingFaq } = useStore();
  const [visited, setVisited] = useState<Set<string>>(() => new Set([activeTab]));
  useEffect(() => {
    setVisited(prev => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
  }, [activeTab]);
  const [loading, setLoading] = useState(true);
  const updateAvailable = useVersionCheck();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
  }, []);

  const handleLoadingDone = () => {
    setLoading(false);
    document.body.style.overflow = '';
  };

  return (
    <div className="lg:flex h-screen bg-cream overflow-hidden relative">
      {loading && <LoadingScreen onDone={handleLoadingDone} />}

      <Sidebar />

      {/* Tab content */}
      <div className="max-w-lg lg:max-w-none mx-auto lg:mx-0 h-full flex-1 overflow-hidden relative">
        <div className="h-full overflow-hidden">
          <div className={`h-full ${activeTab === 'discover' ? 'block' : 'hidden'}`}>
            <Discover />
          </div>
          <TabPanel active={activeTab === 'exams'} visited={visited.has('exams')}><Exams /></TabPanel>
          <TabPanel active={activeTab === 'community'} visited={visited.has('community')}><Community /></TabPanel>
          <TabPanel active={activeTab === 'history'} visited={visited.has('history')}><History /></TabPanel>
          <TabPanel active={activeTab === 'profile'} visited={visited.has('profile')}><Profile /></TabPanel>
        </div>

        <BottomNav />
      </div>

      {showingExamDetail && <ExamDetail />}
      {showingFaq && <FaqSheet onClose={() => setShowingFaq(false)} />}
      {updateAvailable && <UpdateBanner />}
    </div>
  );
}
