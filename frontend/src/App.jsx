import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppProvider, useApp } from './context/AppContext';
import { IOSDeviceFrame } from './components/common/IOSDeviceFrame';
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

const ScreenRouter = () => {
  const { currentScreen } = useApp();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'phone':
        return <PhoneSignInScreen />;
      case 'otp':
        return <OTPVerifyScreen />;
      case 'consent':
        return <DPDPConsentScreen />;
      case 'basics':
        return <BasicsIntentScreen />;
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

export default function App() {
  return (
    <AppProvider>
      <ScreenRouter />
    </AppProvider>
  );
}
