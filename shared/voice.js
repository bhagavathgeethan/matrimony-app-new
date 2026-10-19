// Voice-note recording for both apps (MediaRecorder in the browser / WebView). Framework-free.
export const MAX_VOICE_MS = 60000;

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return '';
}

export const canRecordVoice = () => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && pickMime() !== null;

// start() asks for the microphone and records; stop() resolves { blob, durationMs }; cancel() discards.
// Recording stops by itself at MAX_VOICE_MS (onAutoStop is called with the result).
export function createVoiceRecorder({ onAutoStop } = {}) {
  let recorder = null;
  let stream = null;
  let chunks = [];
  let startedAt = 0;
  let timer = null;
  let finish = null;

  const cleanup = () => {
    clearTimeout(timer);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    recorder = null;
  };

  async function start() {
    const mime = pickMime();
    if (mime === null) throw new Error('Voice notes aren’t supported on this device');
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorder.ondataavailable = (e) => e.data?.size && chunks.push(e.data);
    const done = new Promise((resolve) => {
      finish = resolve;
      recorder.onstop = () => {
        const type = (recorder?.mimeType || mime || 'audio/webm').split(';')[0];
        const result = { blob: new Blob(chunks, { type }), durationMs: Math.min(MAX_VOICE_MS, Date.now() - startedAt) };
        cleanup();
        resolve(result);
      };
    });
    startedAt = Date.now();
    recorder.start(250);
    timer = setTimeout(async () => {
      if (recorder?.state === 'recording') {
        recorder.stop();
        onAutoStop?.(await done);
      }
    }, MAX_VOICE_MS);
    return done;
  }

  function stop() {
    if (recorder?.state === 'recording') recorder.stop();
  }

  function cancel() {
    if (recorder?.state === 'recording') {
      recorder.onstop = () => {
        cleanup();
        finish?.(null);
      };
      recorder.stop();
    } else {
      cleanup();
    }
  }

  const elapsed = () => (startedAt ? Date.now() - startedAt : 0);
  return { start, stop, cancel, elapsed };
}
