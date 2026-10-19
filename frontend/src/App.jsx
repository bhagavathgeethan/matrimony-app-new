import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppProvider, useApp } from './context/AppContext';
import { t } from '@shared/i18n';
import { IOSDeviceFrame } from './components/common/IOSDeviceFrame';
import { LoadingScreen } from './components/brand/LoadingScreen';
import { WelcomeScreen } from './screens/auth/WelcomeScreen';
import { PhoneSignInScreen } from './screens/auth/PhoneSignInScreen';
import { OTPVerifyScreen } from './screens/auth/OTPVerifyScreen';
import { DPDPConsentScreen } from './screens/auth/DPDPConsentScreen';
import { BasicsIntentScreen } from './screens/onboarding/BasicsIntentScreen';
import { BlueprintIntroScreen } from './screens/onboarding/BlueprintIntroScreen';
import { BlueprintQuestionScreen } from './screens/onboarding/BlueprintQuestionScreen';
import { BlueprintTunerScreen } from './screens/onboarding/BlueprintTunerScreen';
import { ValuesVibesPickerScreen } from './screens/onboarding/ValuesVibesPickerScreen';
import { PhotoVerificationScreen } from './screens/onboarding/PhotoVerificationScreen';
import { MyBlueprintSummaryScreen } from './screens/onboarding/MyBlueprintSummaryScreen';
import { AlignedFeedScreen } from './screens/main/AlignedFeedScreen';
import { ProfileListScreen } from './screens/main/ProfileListScreen';
import { SentFamilyResponsesScreen } from './screens/main/SentFamilyResponsesScreen';
import { ConversationsListScreen } from './screens/chat/ConversationsListScreen';
import { ChatThreadScreen } from './screens/chat/ChatThreadScreen';
import { LinkParentScreen } from './screens/family/LinkParentScreen';
import { PrivacyErasureScreen } from './screens/privacy/PrivacyErasureScreen';
import { ParentPortalScreen } from './screens/family/ParentPortalScreen';
import { FamilySignInScreen } from './screens/auth/FamilySignInScreen';
import { familySession, useFamilySession } from './services/familySession';
import { setRootBack } from './services/backButton';
import { NotificationsScreen } from './screens/main/NotificationsScreen';
import { PersonalOnboardingScreen } from './screens/onboarding/PersonalOnboardingScreen';
import { PersonalDetailsScreen } from './screens/main/PersonalDetailsScreen';
import { DailyPicksScreen } from './screens/engage/DailyPicksScreen';
import { ShortlistScreen } from './screens/engage/ShortlistScreen';
import { PremiumScreen } from './screens/engage/PremiumScreen';
import { VerificationScreen } from './screens/engage/VerificationScreen';
import { StoriesScreen } from './screens/engage/StoriesScreen';
import { SafetyScreen } from './screens/engage/SafetyScreen';
import { PreferencesScreen } from './screens/engage/PreferencesScreen';
import { AssistedScreen } from './screens/engage/AssistedScreen';

// Main tabs: Back on another tab returns to the feed; Back on the feed leaves the app in the background
const TAB_ROOTS = ['profile-list', 'conversations', 'family-tracker', 'blueprint-summary'];

const ScreenRouter = () => {
  const { currentScreen, setCurrentScreen, user } = useApp();
  useEffect(() => {
    setRootBack(() => {
      if (user?.onboarding?.completed && TAB_ROOTS.includes(currentScreen)) {
        setCurrentScreen('feed');
        return true;
      }
      return false;
    });
  }, [currentScreen, user, setCurrentScreen]);
  // A new screen starts at the top, not at the previous screen's scroll position
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'phone':
        return <PhoneSignInScreen />;
      case 'family-signin':
        return <FamilySignInScreen />;
      case 'otp':
        return <OTPVerifyScreen />;
      case 'consent':
        return <DPDPConsentScreen />;
      case 'basics':
        return <BasicsIntentScreen />;
      case 'personal':
        return <PersonalOnboardingScreen />;
      case 'personal-details':
        return <PersonalDetailsScreen />;
      case 'daily':
        return <DailyPicksScreen />;
      case 'shortlist':
        return <ShortlistScreen />;
      case 'premium':
        return <PremiumScreen />;
      case 'verification':
        return <VerificationScreen />;
      case 'stories':
        return <StoriesScreen />;
      case 'safety':
        return <SafetyScreen />;
      case 'preferences':
        return <PreferencesScreen />;
      case 'assisted':
        return <AssistedScreen />;
      case 'blueprint-intro':
        return <BlueprintIntroScreen />;
      case 'blueprint-q1':
        return <BlueprintQuestionScreen />;
      case 'blueprint-tuner':
        return <BlueprintTunerScreen />;
      case 'vibes':
        return <ValuesVibesPickerScreen />;
      case 'photos':
        return <PhotoVerificationScreen />;
      case 'blueprint-summary':
        return <MyBlueprintSummaryScreen />;
      case 'feed':
        return <AlignedFeedScreen />;
      case 'profile-list':
        return <ProfileListScreen />;
      case 'family-tracker':
        return <SentFamilyResponsesScreen />;
      case 'conversations':
        return <ConversationsListScreen />;
      case 'chat-thread':
        return <ChatThreadScreen />;
      case 'link-parent':
        return <LinkParentScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'privacy':
        return <PrivacyErasureScreen />;
      case 'parent-portal':
        return <ParentPortalScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return <IOSDeviceFrame>{renderActiveScreen()}</IOSDeviceFrame>;
};

// Shows the branded loading screen until data has loaded and the logo animation has played
const MIN_SPLASH_MS = 2600; // long enough to see the third knot tied
const SplashGate = ({ children }) => {
  const { isLoading } = useApp();
  const [minElapsed, setMinElapsed] = useState(false);
  const [phase, setPhase] = useState('showing'); // showing → leaving → done

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase === 'showing' && !isLoading && minElapsed) setPhase('leaving');
  }, [phase, isLoading, minElapsed]);

  // Separate effect so the phase change above can't cancel the unmount timer
  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const timer = setTimeout(() => setPhase('done'), 450);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <>
      {children}
      {phase !== 'done' && <LoadingScreen leaving={phase === 'leaving'} />}
    </>
  );
};

// A family member opening their SMS link lands on /portal/<token>: show only their read-only portal
const portalToken = (window.location.pathname.match(/^\/portal\/([0-9a-f]{48})\/?$/) || [])[1] || null;

// A family member's view: from their SMS link, or after family sign-in on this device
const PortalPage = ({ token, portals = [], onSignOut }) => (
  <View style={{ minHeight: '100vh', backgroundColor: '#F3EDE3', alignItems: 'center' }}>
    <View style={{ width: '100%', maxWidth: 760, minHeight: '100vh', backgroundColor: '#FBF7F1' }}>
      <ParentPortalScreen tokenFromUrl={token} portals={portals} onChoosePortal={familySession.choose} onSignOut={onSignOut} />
    </View>
  </View>
);

const FamilyApp = ({ session }) => {
  const { setCurrentScreen } = useApp();
  const signOut = () => {
    if (!window.confirm(t('Sign out of the family view on this device?'))) return;
    setCurrentScreen('welcome');
    familySession.signOut();
  };
  return <PortalPage token={session.active} portals={session.portals} onSignOut={signOut} />;
};

const Root = () => {
  const family = useFamilySession();
  if (family) return <FamilyApp session={family} />;
  return (
    <SplashGate>
      <ScreenRouter />
    </SplashGate>
  );
};

export default function App() {
  if (portalToken) {
    return (
      <AppProvider>
        <PortalPage token={portalToken} />
      </AppProvider>
    );
  }
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
