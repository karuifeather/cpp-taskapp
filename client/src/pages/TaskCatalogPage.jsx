import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getCategories, getTasks } from '../lib/catalog.js';

// Plaque colors come from the difficulty tokens in styles/theme.css.
const difficultyFill = {
  easy: 'bg-easy',
  medium: 'bg-medium',
  hard: 'bg-hard',
};

// Small framed plaque that shows a quest's difficulty.
function DifficultyPlaque({ difficulty }) {
  return (
    <span
      className={`w-24 shrink-0 rounded-sm border-2 border-ink py-0.5 text-center font-display text-sm font-bold tracking-wider text-panel uppercase shadow-[inset_0_0_0_2px_rgb(241_226_192/0.35),0_2px_0_var(--color-ink)] ${difficultyFill[difficulty] || 'bg-brand'}`}
    >
      {difficulty}
    </span>
  );
}

const categoryLinkClass =
  'block rounded px-3 py-1.5 text-2xl font-semibold tracking-widest decoration-2 underline-offset-4 hover:underline';

const pageButtonClass =
  'rounded bg-brand px-4 py-1 text-lg text-panel hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40';

const LEVELS = ['easy', 'medium', 'hard'];

const levelButtonClass =
  'min-w-20 rounded-sm border-2 border-ink px-3 py-0.5 font-display text-sm font-bold tracking-wider uppercase';

// How many quests fit on one page of the scroll. If you change this, also
// change the list's min-h-[30rem] (6 rows x 5rem) so the card stays the same size.
const QUESTS_PER_PAGE = 6;

// Shows /tasks (every task) and /tasks/:category (one category).
export default function TaskCatalogPage() {
  const { category } = useParams();
  // The page number lives in the URL (?page=2), so picking a category starts at page 1.
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getCategories(), getTasks()])
      .then(([categoryList, taskList]) => {
        setCategories(categoryList);
        setTasks(taskList);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // The level filter also lives in the URL (?level=easy) and works with the category.
  const level = LEVELS.includes(searchParams.get('level')) ? searchParams.get('level') : null;
  const shownTasks = tasks.filter(
    (task) => (!category || task.category === category) && (!level || task.difficulty === level),
  );
  const pageCount = Math.max(1, Math.ceil(shownTasks.length / QUESTS_PER_PAGE));
  const requestedPage = Number(searchParams.get('page')) || 1;
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const pageTasks = shownTasks.slice((page - 1) * QUESTS_PER_PAGE, page * QUESTS_PER_PAGE);

  function goToPage(nextPage) {
    const next = new URLSearchParams(searchParams);
    if (nextPage === 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
  }

  // Picking a level starts again at page 1.
  function chooseLevel(nextLevel) {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    if (nextLevel) next.set('level', nextLevel);
    else next.delete('level');
    setSearchParams(next);
  }

  // Category links keep the chosen level, but start at page 1.
  function categoryLink(path) {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    const query = next.toString();
    return query ? `${path}?${query}` : path;
  }

  return (
    <div className="grid items-start gap-8 md:grid-cols-[1fr_2fr]">
      <section className="parchment px-2 py-3 text-center" aria-labelledby="categories-title">
        <h2
          id="categories-title"
          className="title-shadow mb-4 font-display text-3xl font-bold text-ink"
        >
          Categories
        </h2>
        <nav aria-label="Task categories">
          <ul className="space-y-1">
            <li>
              <Link
                to={categoryLink('/tasks')}
                className={`${categoryLinkClass} ${!category ? 'font-semibold underline' : ''}`}
              >
                All Quests
              </Link>
            </li>
            {categories.map((item) => (
              <li key={item.id}>
                <Link
                  to={categoryLink(`/tasks/${encodeURIComponent(item.name)}`)}
                  className={`${categoryLinkClass} ${
                    item.name === category ? 'font-semibold underline' : ''
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section className="parchment px-2 py-3" aria-labelledby="quests-title">
        <h1
          id="quests-title"
          className="title-shadow mb-1 text-center font-display text-3xl font-bold text-ink sm:text-4xl"
        >
          {category ? category : 'Quests'}
        </h1>
        <p className="mb-3 text-center text-muted">
          {loading ? 'Loading quests...' : `${shownTasks.length} quests to choose from`}
        </p>

        <div
          role="group"
          aria-label="Filter by level"
          className="mb-4 flex flex-wrap justify-center gap-2"
        >
          {[null, ...LEVELS].map((item) => {
            const active = item === level;
            return (
              <button
                key={item || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => chooseLevel(item)}
                className={`${levelButtonClass} ${
                  active ? 'bg-ink text-panel' : 'text-ink hover:bg-brand-soft'
                }`}
              >
                {item || 'All'}
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="text-center font-semibold">
            Could not load quests: {error}
          </p>
        )}

        {/* Empty state fills the same space as the list, so the card keeps its size */}
        {!loading && !error && shownTasks.length === 0 && (
          <div className="flex min-h-[30rem] flex-col items-center gap-1 pt-6 text-center">
            <p className="title-shadow font-display text-2xl font-bold text-ink">No quests found</p>
            <p className="text-2xl text-muted">Try another category or level.</p>
            <Link
              to="/tasks"
              className="mt-1 rounded border border-line bg-brand-soft px-4 py-1 text-lg text-ink hover:bg-line"
            >
              See all quests
            </Link>
          </div>
        )}

        {/* key changes with the page, so each new page plays the page-turn animation */}
        <ul
          key={`${category}-${level}-${page}`}
          className={`page-turn divide-y divide-line ${pageTasks.length ? 'min-h-[30rem]' : ''}`}
        >
          {pageTasks.map((task) => (
            <li key={task.id} className="flex min-h-[5rem] items-center justify-between gap-3 py-2">
              <div>
                <p className="text-2xl font-semibold">{task.title}</p>
                {!category && <p className="text-lg text-muted">{task.category}</p>}
              </div>
              <DifficultyPlaque difficulty={task.difficulty} />
            </li>
          ))}
        </ul>

        {/* Always shown, even with one page, so the card is the same size everywhere */}
        <nav
          aria-label="Quest pages"
          className="flex items-center justify-between gap-3 border-t border-line pt-4"
        >
          <button
            type="button"
            className={pageButtonClass}
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
          >
            ‹ Prev
          </button>
          <p className="text-muted" aria-live="polite">
            Page {page} of {pageCount}
          </p>
          <button
            type="button"
            className={pageButtonClass}
            onClick={() => goToPage(page + 1)}
            disabled={page === pageCount}
          >
            Next ›
          </button>
        </nav>
      </section>
    </div>
  );
}
