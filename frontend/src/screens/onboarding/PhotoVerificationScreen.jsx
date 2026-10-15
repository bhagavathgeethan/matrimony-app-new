import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Plus, EyeOff, SearchX, BadgeCheck, Star, X } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import {
  OnboardingScreen, TopBar, FadeIn, Eyebrow, Heading, Accent, Button, Card, Toggle, IconBadge, Badge, Divider,
} from '../../components/ui/kit';

const { colors, fonts, radii } = theme;
const MAX_PHOTOS = 6;

export const PhotoVerificationScreen = () => {
  const { setCurrentScreen, user, updatePrivacy, uploadPhoto, deletePhoto, makePhotoPrimary } = useApp();
  const [blurMutual, setBlurMutual] = useState(user?.photoBlurredUntilMutual ?? true);
  const [hideSearch, setHideSearch] = useState(user?.hideFromSearchEngines ?? true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const fileInput = useRef(null);
  const photos = user?.photos || [];

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    const res = await uploadPhoto(file);
    setUploading(false);
    if (!res.ok) setError(res.error);
  };

  const runPhotoAction = async (id, action) => {
    setBusyId(id);
    setError(null);
    const res = await action(id);
    setBusyId(null);
    if (!res.ok) setError(res.error);
  };

  const handleContinue = async () => {
    const res = await updatePrivacy({ photoBlurredUntilMutual: blurMutual, hideFromSearchEngines: hideSearch });
    if (!res.ok) return setError(res.error);
    setCurrentScreen('blueprint-summary');
  };

  const settings = [
    { icon: EyeOff, title: 'Blur until mutual interest', sub: 'Seen only after you both say yes', value: blurMutual, set: setBlurMutual },
    { icon: SearchX, title: 'Hide from search engines', sub: 'Recommended', value: hideSearch, set: setHideSearch },
  ];

  return (
    <OnboardingScreen
      top={<TopBar onBack={() => setCurrentScreen(user?.onboarding?.completed ? 'blueprint-summary' : 'vibes')} />}
      footer={
        <>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            photos.length === 0 && <Text style={styles.hint}>Add at least one photo to continue</Text>
          )}
          <Button label="Continue" disabled={photos.length === 0 || uploading} onPress={handleContinue} />
        </>
      }
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>Photos & verification</Eyebrow>
          <Heading size={32}>
            Photos, on <Accent>your terms</Accent>
          </Heading>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.grid}>
          {photos.map((photo, i) => (
            <View key={photo.id} style={styles.tile}>
              <Image source={{ uri: photo.url }} style={styles.img} />
              {i === 0 ? (
                <Badge label="Main" tone="glass" style={styles.tileBadge} />
              ) : (
                <TouchableOpacity
                  onPress={() => runPhotoAction(photo.id, makePhotoPrimary)}
                  style={[styles.tileBtn, { left: 6 }]}
                  accessibilityLabel="Make main photo"
                >
                  <Star size={13} color={colors.white} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => runPhotoAction(photo.id, deletePhoto)}
                style={[styles.tileBtn, { right: 6 }]}
                accessibilityLabel="Remove photo"
              >
                <X size={13} color={colors.white} />
              </TouchableOpacity>
              {busyId === photo.id && (
                <View style={styles.tileBusy}>
                  <ActivityIndicator color={colors.white} />
                </View>
              )}
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={uploading}
              onPress={() => fileInput.current?.click()}
              style={[styles.tile, styles.addSlot]}
            >
              {uploading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <>
                  <Plus size={22} color={colors.accent} />
                  <Text style={styles.addText}>{photos.length ? 'Add' : 'Add photo'}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </FadeIn>

      <FadeIn delay={120}>
        <Card padding={4}>
          {settings.map((s, idx) => (
            <View key={s.title}>
              {idx > 0 && <Divider style={{ marginHorizontal: 12 }} />}
              <View style={styles.row}>
                <IconBadge icon={s.icon} size={34} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={styles.rowTitle}>{s.title}</Text>
                  <Text style={styles.rowSub}>{s.sub}</Text>
                </View>
                <Toggle value={s.value} onChange={s.set} />
              </View>
            </View>
          ))}
        </Card>
      </FadeIn>

      <FadeIn delay={180}>
        <Card variant="dark" style={styles.idCard} padding={14}>
          <BadgeCheck size={20} color={colors.gold} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.idTitle}>{user?.verified ? 'ID verified' : 'ID verification — coming soon'}</Text>
            <Text style={styles.idText}>One-time ID check. We store a hash, never the document.</Text>
          </View>
        </Card>
      </FadeIn>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: 'calc(33.333% - 6px)',
    aspectRatio: 0.8,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.accentSoft,
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  tileBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
  },
  tileBtn: {
    position: 'absolute',
    top: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(20,8,6,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,8,6,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlot: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(168, 30, 60, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  rowTitle: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  idTitle: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.onDark,
  },
  idText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,246,238,0.72)',
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
});
