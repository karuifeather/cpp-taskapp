// Message box shown after an action (quest added, quest complete, errors).
// Has a small x on the right so the user can hide it.
export default function Notice({ type = 'info', onClose, children }) {
  const isError = type === 'error';
  return (
    <div
      role={isError ? 'alert' : undefined}
      className={`relative mb-3 rounded border px-10 py-1 ${
        isError ? 'border-hard font-semibold' : 'border-line bg-brand-soft'
      }`}
    >
      {children}
      <button
        type="button"
        className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-line hover:text-ink"
        onClick={onClose}
        aria-label="Close message"
        title="Close"
      >
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
    </div>
  );
}
