import { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { LoadingScreen } from './components/LoadingScreen';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { ExamDetail } from './components/ExamDetail';
import { FaqSheet } from './components/FaqSheet';
import { UpdateBanner } from './components/UpdateBanner';
import { useVersionCheck } from './hooks/useVersionCheck';
import { Discover } from './tabs/Discover';
import { Exams } from './tabs/Exams';
import { Community } from './tabs/Community';
import { History } from './tabs/History';
import { Profile } from './tabs/Profile';

export default function App() {
  const { activeTab, showingExamDetail, showingFaq, setShowingFaq } = useStore();
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
          <div className={`h-full ${activeTab === 'exams' ? 'block' : 'hidden'}`}>
            <Exams />
          </div>
          <div className={`h-full ${activeTab === 'community' ? 'block' : 'hidden'}`}>
            <Community />
          </div>
          <div className={`h-full ${activeTab === 'history' ? 'block' : 'hidden'}`}>
            <History />
          </div>
          <div className={`h-full ${activeTab === 'profile' ? 'block' : 'hidden'}`}>
            <Profile />
          </div>
        </div>

        <BottomNav />
      </div>

      {showingExamDetail && <ExamDetail />}
      {showingFaq && <FaqSheet onClose={() => setShowingFaq(false)} />}
      {updateAvailable && <UpdateBanner />}
    </div>
  );
}
