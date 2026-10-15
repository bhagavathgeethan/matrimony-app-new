import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LogOut } from 'lucide-react';
import { t } from '@shared/i18n';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Button, Body } from '../ui/kit';
import { Sheet } from '../details/DetailsUI';

const { colors, fonts } = theme;

// Sign out with an in-app confirmation (browser confirm() popups are unreliable inside the Android app)
export const SignOutButton = ({ style }) => {
  const { logout } = useApp();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setAsking(true)} style={[styles.button, style]} accessibilityRole="button" accessibilityLabel="Sign out">
        <LogOut size={17} color={colors.accent} />
        <Text style={styles.text}>{t('Sign out')}</Text>
      </TouchableOpacity>
      {asking && (
        <Sheet
          title={`${t('Sign out')}?`}
          onClose={() => setAsking(false)}
          footer={(
            <Button
              label={busy ? 'Signing out…' : t('Sign out')}
              icon={LogOut}
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                await logout();
              }}
            />
          )}
        >
          <Body size={14}>You’ll need your phone number and a one-time code to sign in again. Your profile and chats stay as they are.</Body>
        </Sheet>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 30, 60, 0.25)',
    backgroundColor: colors.card,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: colors.accent,
  },
});
