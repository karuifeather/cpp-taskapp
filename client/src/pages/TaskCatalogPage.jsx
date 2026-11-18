import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { addTask, getCategories, getPlannedTasks, getTasks, removeTask } from '../lib/catalog.js';

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

// Round icon button: a plus to add, a check after it was added.
// Pressing the check again removes the quest from My Tasks.
// Same height, frame and shadow as the difficulty plaque, so the two line up.
const iconCircleClass =
  'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-brand text-panel shadow-[inset_0_0_0_2px_rgb(241_226_192/0.25),0_2px_0_var(--color-ink)]';

const pressableClass = `${iconCircleClass} cursor-pointer transition active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-50`;

const addButtonClass = `${pressableClass} hover:bg-brand-hover`;

// Turns tan on hover so it is clear that pressing it will remove the quest.
const removeButtonClass = `${pressableClass} hover:bg-line hover:text-ink`;

// Drawn on a 12 x 12 grid with whole numbers, so the plus sits exactly in the middle.
function PlusIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <rect x="5" y="1" width="2" height="10" rx="1" />
      <rect x="1" y="5" width="10" height="2" rx="1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 6.5l2.5 2.5L10 3.5" />
    </svg>
  );
}

const noticeLinkClass = 'font-semibold underline decoration-2 underline-offset-4';

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
  const { user } = useAuth();
  // Add state per task id: 'adding' or 'removing' while a request runs, 'added' after an add worked.
  const [addState, setAddState] = useState({});
  // The user task id the server gave back for each added task id, needed to remove it again.
  const [userTaskIds, setUserTaskIds] = useState({});
  // Message shown above the list after an add or remove:
  // { type: 'added' | 'removed' | 'login' | 'error', text? }
  const [notice, setNotice] = useState(null);

  async function handleAdd(task) {
    if (!user) {
      setNotice({ type: 'login' });
      return;
    }
    setAddState((prev) => ({ ...prev, [task.id]: 'adding' }));
    try {
      const userTask = await addTask(task.id);
      setUserTaskIds((prev) => ({ ...prev, [task.id]: userTask.id }));
      setAddState((prev) => ({ ...prev, [task.id]: 'added' }));
      setNotice({ type: 'added', text: task.title });
    } catch (err) {
      setAddState((prev) => ({ ...prev, [task.id]: undefined }));
      setNotice(err.status === 401 ? { type: 'login' } : { type: 'error', text: err.message });
    }
  }

  async function handleRemove(task) {
    setAddState((prev) => ({ ...prev, [task.id]: 'removing' }));
    try {
      await removeTask(userTaskIds[task.id]);
      setAddState((prev) => ({ ...prev, [task.id]: undefined }));
      setUserTaskIds((prev) => ({ ...prev, [task.id]: undefined }));
      setNotice({ type: 'removed', text: task.title });
    } catch (err) {
      setAddState((prev) => ({ ...prev, [task.id]: 'added' }));
      setNotice(err.status === 401 ? { type: 'login' } : { type: 'error', text: err.message });
    }
  }

  useEffect(() => {
    Promise.all([getCategories(), getTasks()])
      .then(([categoryList, taskList]) => {
        setCategories(categoryList);
        setTasks(taskList);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // When logged in, mark quests that are already planned in My Tasks, so they show
  // the check after a page reload and can still be removed.
  useEffect(() => {
    if (!user) {
      setAddState({});
      setUserTaskIds({});
      return;
    }
    let ignore = false;
    getPlannedTasks()
      .then((plannedTasks) => {
        if (ignore) return;
        const ids = {};
        const states = {};
        for (const userTask of plannedTasks) {
          ids[userTask.task_id] = userTask.id;
          states[userTask.task_id] = 'added';
        }
        setUserTaskIds(ids);
        setAddState(states);
      })
      .catch(() => {
        // If this fails the catalog still works; quests just show "+".
      });
    return () => {
      ignore = true;
    };
  }, [user]);

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

        {/* Message after pressing Add or Remove. aria-live so screen readers hear it. */}
        <div aria-live="polite" className="text-center text-lg">
          {notice?.type === 'added' && (
            <p className="mb-3 rounded border border-line bg-brand-soft px-3 py-1">
              Added "{notice.text}" to today.{' '}
              <Link to="/" className={noticeLinkClass}>
                View My Tasks
              </Link>
            </p>
          )}
          {notice?.type === 'removed' && (
            <p className="mb-3 rounded border border-line bg-brand-soft px-3 py-1">
              Removed "{notice.text}" from today.
            </p>
          )}
          {notice?.type === 'login' && (
            <p className="mb-3 rounded border border-line bg-brand-soft px-3 py-1">
              Please log in to add quests to My Tasks.{' '}
              <Link to="/login" className={noticeLinkClass}>
                Log in
              </Link>
            </p>
          )}
          {notice?.type === 'error' && (
            <p role="alert" className="mb-3 rounded border border-hard px-3 py-1 font-semibold">
              Something went wrong: {notice.text}
            </p>
          )}
        </div>

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
              <div className="flex shrink-0 items-center gap-3">
                <DifficultyPlaque difficulty={task.difficulty} />
                {addState[task.id] === 'added' || addState[task.id] === 'removing' ? (
                  <button
                    type="button"
                    className={removeButtonClass}
                    onClick={() => handleRemove(task)}
                    disabled={addState[task.id] === 'removing'}
                    aria-label={`Remove ${task.title} from My Tasks`}
                    title="Added. Press to remove"
                  >
                    <CheckIcon />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={addButtonClass}
                    onClick={() => handleAdd(task)}
                    disabled={addState[task.id] === 'adding'}
                    aria-label={`Add ${task.title} to My Tasks`}
                    title="Add to My Tasks"
                  >
                    <PlusIcon />
                  </button>
                )}
              </div>
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
