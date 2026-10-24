export default function PlannedPage({ title, description, children }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-6 shadow-sm">
      <p className="mb-2 text-xs font-semibold tracking-widest text-muted uppercase">
        Development placeholder
      </p>
      <h1 className="mb-3 text-2xl font-bold text-ink">{title}</h1>
      <p className="max-w-2xl text-muted">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
