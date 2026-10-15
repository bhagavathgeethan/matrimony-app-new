// Interface language (English / Tamil) for both apps. Keys are the English text, so anything not yet
// translated simply shows in English. t('Your profile is {n}% complete', { n: 40 }) fills {placeholders}.
// The choice is stored on this device.

const KEY = 'sangam.lang';
export const UI_LANGUAGES = [['en', 'English'], ['ta', 'தமிழ்']];

const TA = {
  // navigation
  Matches: 'பொருத்தங்கள்',
  Today: 'இன்று',
  Search: 'தேடல்',
  Shortlist: 'விருப்பப் பட்டியல்',
  Messages: 'செய்திகள்',
  Family: 'குடும்பம்',
  Profile: 'சுயவிவரம்',
  Notifications: 'அறிவிப்புகள்',
  Premium: 'பிரீமியம்',
  'Go Premium': 'பிரீமியம் பெறுங்கள்',
  Safety: 'பாதுகாப்பு',
  'Privacy & settings': 'தனியுரிமை & அமைப்புகள்',
  Admin: 'நிர்வாகம்',
  Aligned: 'பொருந்தியவை',
  Chats: 'உரையாடல்கள்',
  Me: 'நான்',
  Requests: 'கோரிக்கைகள்',
  Conversations: 'உரையாடல்கள்',
  Language: 'மொழி',

  // actions
  'Express interest': 'விருப்பம் தெரிவி',
  Chat: 'அரட்டை',
  'Respond to interest': 'விருப்பத்திற்குப் பதிலளி',
  'Interest sent': 'விருப்பம் அனுப்பப்பட்டது',
  'Not available': 'கிடைக்கவில்லை',
  'Send interest': 'விருப்பம் அனுப்பு',
  Cancel: 'ரத்து',
  Save: 'சேமி',
  Pass: 'தவிர்',
  Accept: 'ஏற்றுக்கொள்',
  Decline: 'நிராகரி',
  Block: 'தடு',
  Report: 'புகார்',
  'Report and block': 'புகார் செய்து தடு',
  Unblock: 'தடை நீக்கு',
  Shortlisted: 'பட்டியலில் உள்ளது',
  'Why we matched': 'ஏன் பொருந்தினோம்',
  'Why we matched · full profile': 'ஏன் பொருந்தினோம் · முழு சுயவிவரம்',
  'Full profile': 'முழு சுயவிவரம்',
  About: 'பற்றி',
  'Looking for': 'தேடுவது',
  'Share with family': 'குடும்பத்துடன் பகிர்',
  'Share with parents': 'பெற்றோருடன் பகிர்',
  Filters: 'வடிகட்டிகள்',
  'Save search': 'தேடலைச் சேமி',
  'Clear all': 'அனைத்தையும் அழி',
  'Complete profile': 'சுயவிவரத்தை நிறைவு செய்',
  Complete: 'நிறைவு செய்',
  'Complete my profile': 'என் சுயவிவரத்தை நிறைவு செய்',
  'Add details': 'விவரங்களைச் சேர்',
  'Add Details': 'விவரங்களைச் சேர்',
  'Video call': 'வீடியோ அழைப்பு',
  'Voice call': 'குரல் அழைப்பு',
  'Get Premium': 'பிரீமியம் பெறுங்கள்',
  'Submit for review': 'சரிபார்ப்புக்கு அனுப்பு',
  'Take a selfie': 'செல்ஃபி எடு',
  'Save preferences': 'விருப்பங்களைச் சேமி',
  'Save prompts': 'கேள்விகளைச் சேமி',
  'Show results': 'முடிவுகளைக் காட்டு',
  'Sign out': 'வெளியேறு',

  // headings
  'Your picks for today': 'இன்றைய உங்கள் தேர்வுகள்',
  'People you’re considering': 'நீங்கள் பரிசீலிக்கும் நபர்கள்',
  'Personal details': 'தனிப்பட்ட விவரங்கள்',
  'Partner preferences': 'துணை விருப்பங்கள்',
  'Partner preferences & prompts': 'துணை விருப்பங்கள் & கேள்விகள்',
  'Profile prompts': 'சுயவிவரக் கேள்விகள்',
  'Get the verified badge': 'சரிபார்ப்பு அடையாளம் பெறுங்கள்',
  'ID verification': 'அடையாள சரிபார்ப்பு',
  'Stay safe while you meet': 'சந்திக்கும்போது பாதுகாப்பாக இருங்கள்',
  'Safety centre': 'பாதுகாப்பு மையம்',
  'Success stories': 'வெற்றிக் கதைகள்',
  'Found each other on Sangam?': 'சங்கமத்தில் ஒருவரையொருவர் கண்டீர்களா?',
  'Search & browse': 'தேடி உலாவுக',
  'Today’s picks': 'இன்றைய தேர்வுகள்',
  'Shortlist & who viewed you': 'விருப்பப் பட்டியல் & உங்களைப் பார்த்தவர்கள்',
  'Reach out without limits': 'வரம்பின்றி அணுகுங்கள்',
  'Your profile is {n}% complete': 'உங்கள் சுயவிவரம் {n}% நிறைவு',
  'Profile {n}% complete': 'சுயவிவரம் {n}% நிறைவு',
  '{name} is interested in you': '{name} உங்களிடம் விருப்பம் தெரிவித்துள்ளார்',
  'Horoscope match': 'ஜாதகப் பொருத்தம்',
  'Horoscope matching': 'ஜாதகப் பொருத்தம்',
  'Pause my profile': 'என் சுயவிவரத்தை இடைநிறுத்து',
  'Tips & reminders': 'குறிப்புகள் & நினைவூட்டல்கள்',

  // personal details: sections
  'In My Own Words': 'என் சொந்த வார்த்தைகளில்',
  'Basic Details': 'அடிப்படை விவரங்கள்',
  'Religious Information': 'மதத் தகவல்',
  'Professional Information': 'தொழில் தகவல்',
  Location: 'இருப்பிடம்',
  'Family Details': 'குடும்ப விவரங்கள்',
  'About My Family': 'என் குடும்பத்தைப் பற்றி',
  'Hobbies & Interests': 'பொழுதுபோக்குகள் & ஆர்வங்கள்',
  // personal details: fields
  'About me': 'என்னைப் பற்றி',
  'About my family': 'என் குடும்பத்தைப் பற்றி',
  Name: 'பெயர்',
  Age: 'வயது',
  Height: 'உயரம்',
  Weight: 'எடை',
  'Marital Status': 'திருமண நிலை',
  'Mother Tongue': 'தாய்மொழி',
  'Physical Status': 'உடல் நிலை',
  'Body Type': 'உடல் வகை',
  'Profile Created By': 'சுயவிவரத்தை உருவாக்கியவர்',
  'Eating Habits': 'உணவுப் பழக்கம்',
  'Drinking Habits': 'மது அருந்தும் பழக்கம்',
  'Smoking Habits': 'புகைப் பழக்கம்',
  Religion: 'மதம்',
  Caste: 'சாதி',
  'Caste no bar': 'சாதி தடை இல்லை',
  'Gothra(m)': 'கோத்திரம்',
  Zodiac: 'ராசிச் சின்னம்',
  Star: 'நட்சத்திரம்',
  Raasi: 'ராசி',
  Dosham: 'தோஷம்',
  'Education Category': 'கல்வி வகை',
  'College / Institution': 'கல்லூரி / நிறுவனம்',
  'Education in Detail': 'கல்வி விவரம்',
  Occupation: 'தொழில்',
  'Occupation in Detail': 'தொழில் விவரம்',
  Organization: 'நிறுவனம்',
  'Employed In': 'பணிபுரியும் துறை',
  'Annual Income': 'ஆண்டு வருமானம்',
  Country: 'நாடு',
  State: 'மாநிலம்',
  City: 'நகரம்',
  Citizenship: 'குடியுரிமை',
  'Ancestral Origin': 'பூர்வீகம்',
  'Family Values': 'குடும்ப மதிப்புகள்',
  'Family Type': 'குடும்ப வகை',
  'Family Status': 'குடும்ப நிலை',
  'Father’s Occupation': 'தந்தையின் தொழில்',
  'Mother’s Occupation': 'தாயின் தொழில்',
  'Brother(s)': 'சகோதரர்(கள்)',
  'Brother(s) Married': 'திருமணமான சகோதரர்(கள்)',
  'Sister(s)': 'சகோதரி(கள்)',
  'Sister(s) Married': 'திருமணமான சகோதரி(கள்)',
  'Hobbies and Interests': 'பொழுதுபோக்குகள் மற்றும் ஆர்வங்கள்',
  Music: 'இசை',
  Reading: 'வாசிப்பு',
  'Movies and TV Shows': 'திரைப்படங்கள் மற்றும் தொலைக்காட்சி',
  'Sports and Fitness': 'விளையாட்டு மற்றும் உடற்பயிற்சி',
  Food: 'உணவு',
  'Spoken Languages': 'பேசும் மொழிகள்',
  Select: 'தேர்ந்தெடு',
  // common option values
  'Never married': 'திருமணமாகாதவர்',
  Divorced: 'விவாகரத்தானவர்',
  Widowed: 'துணையை இழந்தவர்',
  'Awaiting divorce': 'விவாகரத்துக்குக் காத்திருப்பவர்',
  Hindu: 'இந்து',
  Muslim: 'முஸ்லிம்',
  Christian: 'கிறிஸ்தவர்',
  Sikh: 'சீக்கியர்',
  Jain: 'சமணர்',
  Buddhist: 'பௌத்தர்',
  'No religious belief': 'மத நம்பிக்கை இல்லை',
  'Prefer not to say': 'சொல்ல விரும்பவில்லை',
  Vegetarian: 'சைவம்',
  'Non vegetarian': 'அசைவம்',
  Eggetarian: 'முட்டை உண்பவர்',
  'Never drinks': 'மது அருந்துவதில்லை',
  'Never smokes': 'புகைப்பதில்லை',
  Nuclear: 'தனிக் குடும்பம்',
  Joint: 'கூட்டுக் குடும்பம்',
  'Middle class': 'நடுத்தர வர்க்கம்',
  'Upper middle class': 'உயர் நடுத்தர வர்க்கம்',
  Affluent: 'வசதியானவர்',
  Traditional: 'பாரம்பரியம்',
  Moderate: 'மிதமானது',
  Liberal: 'முற்போக்கு',
  Tamil: 'தமிழ்',
  English: 'ஆங்கிலம்',
  Self: 'நானே',
  Parent: 'பெற்றோர்',
  Sibling: 'உடன்பிறந்தவர்',
  Normal: 'இயல்பு',
  Average: 'சராசரி',
  Slim: 'மெலிந்தவர்',
  Athletic: 'உடற்கட்டானவர்',
  Homemaker: 'இல்லத்தரசி',
  Retired: 'ஓய்வு பெற்றவர்',
  Employed: 'பணியில் உள்ளவர்',
  'Not employed': 'பணியில் இல்லை',
  'Passed away': 'காலமானவர்',
  Private: 'தனியார்',
  Business: 'வணிகம்',
  Yes: 'ஆம்',
  No: 'இல்லை',
};

const DICTS = { ta: TA };

function initial() {
  try {
    const saved = globalThis.localStorage?.getItem(KEY);
    return saved && (saved === 'en' || DICTS[saved]) ? saved : 'en';
  } catch {
    return 'en';
  }
}

let lang = initial();
const listeners = new Set();

export const getLanguage = () => lang;

export function setLanguage(next) {
  if (next !== 'en' && !DICTS[next]) return;
  lang = next;
  try {
    globalThis.localStorage?.setItem(KEY, next);
  } catch {
    // device storage unavailable: the choice lasts until the app closes
  }
  listeners.forEach((l) => l());
}

export function subscribeLanguage(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function t(text, vars) {
  if (typeof text !== 'string') return text;
  let out = (lang !== 'en' && DICTS[lang]?.[text]) || text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  return out;
}
