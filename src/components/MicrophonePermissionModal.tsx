"use client";

interface MicrophonePermissionModalProps {
  open: boolean;
  onClose: () => void;
}

export function MicrophonePermissionModal({
  open,
  onClose,
}: MicrophonePermissionModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-permission-title"
    >
      <div className="w-full max-w-md rounded-xl bg-canvas p-6 shadow-lg">
        <h2 id="mic-permission-title" className="text-lg font-bold text-ink mb-2">
          Microphone access needed
        </h2>
        <p className="text-sm text-body mb-4">
          SvaraRx needs your microphone to capture prescriptions. Enable it in your
          device settings:
        </p>

        <div className="space-y-4 text-sm text-body">
          <div>
            <p className="font-semibold text-ink mb-1">iPhone / iPad (Safari)</p>
            <ol className="list-decimal list-inside space-y-1 text-body">
              <li>Open Settings → Safari → Microphone</li>
              <li>Set to Ask or Allow</li>
              <li>Or Settings → SvaraRx (if installed) → enable Microphone</li>
              <li>Reload this page and try again</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">Android (Chrome)</p>
            <ol className="list-decimal list-inside space-y-1 text-body">
              <li>Tap the lock icon in the address bar</li>
              <li>Open Site settings → Microphone → Allow</li>
              <li>Or Settings → Apps → Chrome → Permissions → Microphone</li>
              <li>Reload this page and try again</li>
            </ol>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-green py-3 font-semibold text-ink hover:bg-green-hover"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
