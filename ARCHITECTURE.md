# ARCHITECTURE.md — Matrimony Application

## 1. System Overview & Core Philosophy
The Matrimony Mobile Application is a values-first, DPDP-compliant relationship platform. Unlike conventional matrimony apps that filter by caste, religion-first hierarchies, complexion, or rigid income slabs, this platform matches candidates on life compatibility across four core pillars:
1. **Money philosophy** (Saving vs. Spending, Joint vs. Separate, Family obligations)
2. **Roots & geography** (Proximity to family vs. Geographic flexibility)
3. **Kids & parenting** (Timeline, Hands-on approach, Career concessions)
4. **Career ambition** (Work-life balance vs. High-growth focus)

In addition, the system incorporates a **Dual-Dashboard Parent Co-Pilot Model**, providing parents with a scoped, read-only interface to review candidate cards forwarded by their child, leave advisory feedback ("Approved" or "Concern Raised"), while strictly locking out direct candidate search, unapproved contact info, and private chats.

---

## 2. Technology Stack
- **Frontend**: React Native with React Native Web support for universal mobile & web fidelity, React Navigation, Vector/Lucide Icons, and Google Fonts (`Instrument Serif`, `Manrope`, `IBM Plex Mono`).
- **Backend**: Node.js & Express with RESTful JSON API and WebSocket for instant message delivery and real-time family feedback notifications.
- **Database / Persistence**: **PostgreSQL 18.4** (`ab_matrimony` on `187.127.178.200:5444`) managed via `pg` connection pool with relational tables:
  - `users`: Core profile biodata, verified status, photo blur preferences, tags, and lifestyle vibes.
  - `blueprints`: 4-pillar scores (Money, Roots, Kids, Ambition), flexibility ranges (Open/Firm), and archetype summary.
  - `user_consents`: DPDP-compliant itemised consent flags with timestamps.
  - `family_links`: Parent linkage records (Amma, Appa) and phone masking.
  - `shared_to_family`: Forwarded candidate cards, time-bounded access rules (7d, 30d, Never), and parent review feedback notes ("Approved" / "Concern Raised").
  - `conversations` & `messages`: Private match chat histories with Suggested Openers and Parent Shield privacy protection.
  - `privacy_logs`: DPDP 72-hour irreversible deletion audit logs.
- **Styling System**: Design token architecture based on CSS/StyleSheet constants ensuring pixel-perfect alignment with the editorial design spec.

---

## 3. Visual Design System & Theme Tokens

### 3.1 Color Palette
| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `primary` / `accent` | `#A81E3C` | Key actions, active states, brand identity, match score highlights |
| `background` / `bg` | `#FBF6EE` | Application canvas, warm editorial background |
| `card` | `#FFFDF9` | Primary card surfaces, elevated panels, modal backgrounds |
| `cardSecondary` | `#F8F2E9` | Nested containers, quote cards, preview strips |
| `border` | `#E7DACA` | Standard card and input borders |
| `borderLight` | `#F0E7DA` | Subtle separators, dashed boundaries |
| `textPrimary` | `#2A1B18` | Main headings, body titles, active text |
| `textSecondary` | `#7A675C` | Subheadings, descriptions, explanatory copy |
| `textMuted` | `#96806F` / `#8A756A` | Meta tags, timestamps, secondary labels |
| `textLight` | `#A8927F` / `#C0B0A0` | Monospace tags, placeholder text |
| `surfaceDark` | `#3A2420` | Dark pill toggles, high-contrast badges |
| `white` | `#FFF8F2` | Text on primary crimson buttons, icon foregrounds |

### 3.2 Typography Tokens
- **Editorial Serif**: `Instrument Serif`, `Georgia`, serif — used for hero headlines, major title headers, and candidate name displays (`400` weight).
- **Modern Sans**: `Manrope`, system sans-serif — used for primary UI navigation, interactive buttons, body paragraphs, and filter chips (`400`, `500`, `600`, `700`, `800` weights).
- **Technical Monospace**: `IBM Plex Mono`, monospace — used for step counters (`STEP 01 / 04`), score tags (`87% ALIGNED`), badge labels, and timestamp metadata.

---

## 4. Application Architecture & Navigation Graph

```
RootNavigator
 ├── AuthStack
 │    ├── WelcomeScreen (2a)
 │    ├── PhoneSignInScreen (2b)
 │    ├── OTPVerifyScreen (2c)
 │    └── DPDPConsentScreen (2d)
 ├── OnboardingStack
 │    ├── BasicsIntentScreen (2e)
 │    ├── BlueprintIntroScreen (2f)
 │    ├── BlueprintQuestionScreen (2g)
 │    ├── BlueprintTunerScreen (1a)
 │    ├── ValuesVibesPickerScreen (2h)
 │    ├── PhotoVerificationScreen (2i)
 │    └── MyBlueprintSummaryScreen (2j)
 ├── MainTabNavigator
 │    ├── AlignedFeedScreen (1b)
 │    ├── ProfileListScreen (3a)
 │    ├── ConversationsListScreen (2k)
 │    │    └── ChatThreadScreen (2l)
 │    ├── FamilyTrackerScreen (3c)
 │    │    ├── ShareWithParentModal (1c, 3b)
 │    │    └── LinkParentScreen (2m)
 │    └── ProfileSettingsScreen
 │         └── PrivacyErasureScreen (2n)
 └── ParentPortalStack (Independent Web/Mobile Read-Only Route)
      └── ParentPortalScreen (1d)
```

---

## 5. Security, DPDP & Privacy Protocols
1. **Granular Consent Engine**: Every processing category (Matching, Family Sharing, Research, Marketing) is tracked with timestamped boolean flags.
2. **Photo Protection Engine**: Photos remain blurred until both candidates establish mutual interest, preventing unauthorized browsing.
3. **Contact Masking**: Phone numbers and emails are never exposed directly to candidates or parents.
4. **Parent Sandboxing**: Parent sessions use cryptographically signed share tokens with configurable TTLs (7 days, 30 days, or manual revocation). Parents have zero capability to browse, search, or access chat logs.
5. **72-Hour Erasure Pipeline**: When a user requests account deletion, the system wipes:
   - Profile & photo binaries
   - Blueprint answers & weights
   - Active parent share links
   - Anonymizes chat histories to `"Former Member"`
   - Retains only a non-reversible cryptographic audit hash of the deletion receipt.

---

## 6. Code Integrity & Reference Safety Rules
1. **Verify Import Headers**: Always inspect top-level imports before adding any new component or utility.
2. **Preserve JSX Containers**: Retain outer container wrappers (`<View>`, `<ScrollView>`, `<SafeAreaView>`) when replacing code blocks.
3. **Safe React Hook Dependencies**: Destructure primitive properties (`id`, `status`, `length`) instead of placing raw complex objects into `useEffect` or `useMemo` dependency arrays.
4. **No Automated Testing on Auth**: Per user guidelines, automated tests for signup/auth flows are prohibited; all auth validation is verified interactively.
