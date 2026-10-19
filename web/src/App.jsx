import React, { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider, useStore, pathFor, useLanguage } from './store';
import { LoadingScreen, Brand } from './components/ui';
import { LandingPage } from './pages/Landing';
import { SignInPage } from './pages/SignIn';
import { OnboardingLayout } from './pages/onboarding/OnboardingLayout';
import {
  ConsentStep, BasicsStep, PersonalStep, BlueprintIntroStep, BlueprintQuestionStep, TunerStep, VibesStep, PhotosStep, ReviewStep,
} from './pages/onboarding/steps';
import { AppLayout } from './pages/app/AppLayout';
import { MatchesPage } from './pages/app/Matches';
import { BrowsePage } from './pages/app/Browse';
import { PersonalDetailsPage } from './pages/app/PersonalDetails';
import { MessagesPage } from './pages/app/Messages';
import { FamilyPage } from './pages/app/Family';
import { ProfilePage } from './pages/app/Profile';
import { SettingsPage } from './pages/app/Settings';
import { NotificationsPage } from './pages/app/Notifications';
import { TodayPage } from './pages/app/Today';
import { ShortlistPage } from './pages/app/Shortlist';
import { PremiumPage } from './pages/app/Premium';
import { VerificationPage } from './pages/app/Verification';
import { StoriesPage } from './pages/app/Stories';
import { SafetyPage } from './pages/app/Safety';
import { PreferencesPage } from './pages/app/Preferences';
import { AdminPage } from './pages/app/Admin';
import { AssistedPage } from './pages/app/Assisted';
import { PortalPage } from './pages/Portal';
import { NotFoundPage } from './pages/NotFound';
import { t } from '@shared/i18n';

// Branded loading screen while a saved session is being restored (min ~1.6s so the logo animation plays)
function SplashGate({ children }) {
  const { authStatus } = useStore();
  const [minElapsed, setMinElapsed] = useState(false);
  const [phase, setPhase] = useState(authStatus === 'checking' ? 'showing' : 'done');

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), 2600);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (phase === 'showing' && authStatus !== 'checking' && minElapsed) setPhase('leaving');
  }, [phase, authStatus, minElapsed]);
  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const timer = setTimeout(() => setPhase('done'), 420);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <>
      {phase !== 'showing' && children}
      {phase !== 'done' && <LoadingScreen leaving={phase === 'leaving'} />}
    </>
  );
}

// Public pages: signed-in users are sent to where they belong
function PublicOnly() {
  const { authStatus, user } = useStore();
  if (authStatus === 'signedIn' && user) return <Navigate to={pathFor(user.onboarding.nextScreen)} replace />;
  return <Outlet />;
}

function RequireSignedIn() {
  const { authStatus, signedOutReason } = useStore();
  const location = useLocation();
  // A deliberate sign-out goes home; an expired session or a signed-out visitor goes to sign in
  if (authStatus !== 'signedIn') {
    return <Navigate to={signedOutReason === 'logout' ? '/' : '/signin'} replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

// Admin console: any signed-in admin, even one who never built a member profile
function RequireAdmin() {
  const { user } = useStore();
  if (user?.role !== 'admin') return <Navigate to={pathFor(user?.onboarding?.nextScreen || 'consent')} replace />;
  return (
    <div className="admin-shell">
      <header className="admin-top">
        <Link to="/" className="row" style={{ '--gap': '8px' }}><Brand tagline={false} size={28} /></Link>
        <span className="row small" style={{ '--gap': '14px' }}>
          {user.onboarding?.completed && <Link to="/matches">{t('Back to the app')}</Link>}
        </span>
      </header>
      <Outlet />
    </div>
  );
}

// The main app needs a finished profile
function RequireOnboarded() {
  const { user } = useStore();
  if (!user?.onboarding?.completed) return <Navigate to={pathFor(user?.onboarding?.nextScreen || 'consent')} replace />;
  return <Outlet />;
}

export default function App() {
  useLanguage(); // re-render in the chosen interface language
  return (
    <StoreProvider>
      <Routes>
        {/* Parent portal: public, token in the URL is the credential */}
        <Route path="/portal/:token" element={<PortalPage />} />

        <Route element={<SplashGate><Outlet /></SplashGate>}>
          <Route element={<PublicOnly />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
          </Route>

          <Route element={<RequireSignedIn />}>
            <Route path="/onboarding" element={<OnboardingLayout />}>
              <Route index element={<Navigate to="consent" replace />} />
              <Route path="consent" element={<ConsentStep />} />
              <Route path="basics" element={<BasicsStep />} />
              <Route path="personal" element={<PersonalStep />} />
              <Route path="blueprint" element={<BlueprintIntroStep />} />
              <Route path="blueprint/question" element={<BlueprintQuestionStep />} />
              <Route path="blueprint/tune" element={<TunerStep />} />
              <Route path="vibes" element={<VibesStep />} />
              <Route path="photos" element={<PhotosStep />} />
              <Route path="review" element={<ReviewStep />} />
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            <Route element={<RequireOnboarded />}>
              <Route element={<AppLayout />}>
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:conversationId" element={<MessagesPage />} />
                <Route path="/family" element={<FamilyPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/details" element={<PersonalDetailsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/today" element={<TodayPage />} />
                <Route path="/shortlist" element={<ShortlistPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/premium/assisted" element={<AssistedPage />} />
                <Route path="/profile/verification" element={<VerificationPage />} />
                <Route path="/profile/preferences" element={<PreferencesPage />} />
                <Route path="/stories" element={<StoriesPage />} />
                <Route path="/safety" element={<SafetyPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </StoreProvider>
  );
}
