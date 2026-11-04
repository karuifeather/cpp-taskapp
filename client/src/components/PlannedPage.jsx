export default function PlannedPage({ title, description, children }) {
  return (
    <section className="parchment px-4 py-3">
      <p className="mb-2 text-sm font-semibold tracking-widest text-muted uppercase">
        Development placeholder
      </p>
      <h1 className="title-shadow mb-3 font-display text-3xl font-bold break-words text-ink sm:text-5xl">
        {title}
      </h1>
      <p className="max-w-2xl text-muted">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
