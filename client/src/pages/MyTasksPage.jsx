import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Notice from '../components/Notice.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { removeTask } from '../lib/catalog.js';
import { getUserTasks, startTask, stopTask } from '../lib/userTasks.js';

// Pill colors come from the category tokens in styles/theme.css.
const categoryFill = {
  Homework: 'bg-cat-homework/70 text-cat-homework-ink',
  'Exam Review': 'bg-cat-exam/70 text-cat-exam-ink',
  Chores: 'bg-cat-chores/70 text-cat-chores-ink',
  Health: 'bg-cat-health/70 text-cat-health-ink',
  Personal: 'bg-cat-personal/70 text-cat-personal-ink',
};

// Local YYYY-MM-DD, so "today" matches the user's own calendar.
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 272 seconds -> "04:32", and over an hour -> "1:04:32".
function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return hours ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// "2026-11-20" -> "Nov 20"
function shortDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// XP earned today, this week (from Sunday) and this month.
function getScores(userTasks, now) {
  const today = dateKey(now);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const scores = { today: 0, week: 0, month: 0 };
  for (const userTask of userTasks) {
    if (!userTask.completed_at) continue;
    const done = new Date(userTask.completed_at);
    if (dateKey(done) === today) scores.today += userTask.points_earned;
    if (done >= weekStart) scores.week += userTask.points_earned;
    if (done.getFullYear() === now.getFullYear() && done.getMonth() === now.getMonth()) {
      scores.month += userTask.points_earned;
    }
  }
  return scores;
}

// Today's quests: everything not done yet, plus what was finished today.
// Planned quests from earlier days still show, since they can still be started.
function getTodaysQuests(userTasks, today) {
  const order = { in_progress: 0, planned: 1, completed: 2 };
  return userTasks
    .filter((userTask) =>
      userTask.status === 'completed' ? dateKey(new Date(userTask.completed_at)) === today : true,
    )
    .sort(
      (a, b) =>
        order[a.status] - order[b.status] ||
        a.planned_for.localeCompare(b.planned_for) ||
        a.id - b.id,
    );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden="true">
      <path d="M7 2h2v2h6V2h2v2h3a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3zM5 9v10h14V9zm2 2h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden="true">
      <path d="M6 3h12v2h3v3a4 4 0 01-4 4h-.4A5 5 0 0113 15v3h3v3H8v-3h3v-3a5 5 0 01-3.6-3H7a4 4 0 01-4-4V5h3zm0 4H5v1a2 2 0 001.3 1.9A5 5 0 016 8zm12 0v1a5 5 0 01-.3 1.9A2 2 0 0019 8V7z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <path d="M3 1.5v9l7.5-4.5z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <rect x="2" y="2" width="8" height="8" rx="1" />
    </svg>
  );
}

function CloseIcon() {
  return (
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
  );
}

// Thin line with a small diamond in the middle, under the card titles.
function Divider() {
  return (
    <div className="mx-auto mb-4 flex max-w-xs items-center gap-2" aria-hidden="true">
      <span className="h-0.5 flex-1 bg-ink" />
      <span className="h-2.5 w-2.5 rotate-45 bg-ink" />
      <span className="h-0.5 flex-1 bg-ink" />
    </div>
  );
}

// Small curved notch with a short line, drawn in the top left corner of a box.
// The other corners use the same shape, just flipped. Thin is for the quest rows.
function Corner({ className, thin }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`pointer-events-none absolute h-5 w-5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={thin ? 1 : 2}
      aria-hidden="true"
    >
      <path d={thin ? 'M0.5 10A9.5 9.5 0 0 0 10 0.5' : 'M1 10A9 9 0 0 0 10 1'} />
      {/* Short slanted line across the corner */}
      <path d="M2 7L7 2" strokeLinecap="round" />
    </svg>
  );
}

// Thin frame with the corners cut out, plus the notches that sit in them.
// Goes inside a "relative isolate" box. colorClass sets the line color and
// fillClass an optional background, which gets the same cut corners.
function NotchedFrame({ colorClass, fillClass = '', thin }) {
  return (
    <>
      <span
        className={`notched-frame pointer-events-none absolute inset-0 -z-10 border-current ${fillClass} ${
          thin ? 'border' : 'border-2'
        } ${colorClass}`}
      />
      <Corner thin={thin} className={`top-0 left-0 ${colorClass}`} />
      <Corner thin={thin} className={`top-0 right-0 -scale-x-100 ${colorClass}`} />
      <Corner thin={thin} className={`bottom-0 left-0 -scale-y-100 ${colorClass}`} />
      <Corner thin={thin} className={`right-0 bottom-0 -scale-100 ${colorClass}`} />
    </>
  );
}

function ScoreBox({ icon, label, points }) {
  return (
    <div className="relative isolate flex items-center gap-3 px-4 py-3">
      <NotchedFrame colorClass="text-ink/70" />
      <span className="shrink-0 text-brand">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-wider whitespace-nowrap uppercase">{label}</p>
        <p className="font-display text-3xl font-bold whitespace-nowrap">
          {points.toLocaleString()} XP
        </p>
      </div>
    </div>
  );
}

// Every pill, chip and button in a row is the same height (h-9),
// and each column uses one width, so the rows line up like a table.
const pillClass =
  'inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-base whitespace-nowrap';
const categoryWidth = 'w-36';
const statusWidth = 'w-36';
const actionWidth = 'w-36';
const rowColumns = 'xl:grid-cols-[minmax(0,1fr)_9rem_9rem_14rem]';

function StatusPill({ status }) {
  if (status === 'completed') {
    return (
      <span className={`${pillClass} ${statusWidth} bg-status-done/70 text-status-done-ink`}>
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          <circle cx="10" cy="10" r="10" fill="currentColor" />
          <path
            d="M5.5 10.5l3 3 6-6.5"
            fill="none"
            stroke="var(--color-status-done)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Completed
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className={`${pillClass} ${statusWidth} bg-status-doing/70 text-status-doing-ink`}>
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          <circle cx="10" cy="10" r="10" fill="currentColor" />
          <rect x="6.5" y="5.5" width="2.5" height="9" rx="0.5" fill="var(--color-status-doing)" />
          <rect x="11" y="5.5" width="2.5" height="9" rx="0.5" fill="var(--color-status-doing)" />
        </svg>
        In Progress
      </span>
    );
  }
  return (
    <span className={`${pillClass} ${statusWidth} bg-status-todo/70 text-status-todo-ink`}>
      <span className="h-5 w-5 rounded-full border-[3px] border-current" />
      Not Started
    </span>
  );
}

const actionButtonClass =
  'inline-flex h-9 w-36 items-center justify-center gap-2 rounded-full bg-brand px-4 text-base whitespace-nowrap text-panel shadow-[0_2px_0_var(--color-ink)] hover:bg-brand-hover active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50';

const chipClass =
  'inline-flex h-9 items-center justify-center rounded-full border border-line bg-panel px-3 text-base whitespace-nowrap tabular-nums';

export default function MyTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Id of the user task whose button is waiting on the server.
  const [busyId, setBusyId] = useState(null);
  // Message above the list: { type: 'done' | 'error', text, points? }
  const [notice, setNotice] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    getUserTasks()
      .then((list) => {
        if (!ignore) setUserTasks(list);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  // Tick once a second, but only while a timer is running.
  const hasRunningTimer = userTasks.some((userTask) => userTask.status === 'in_progress');
  useEffect(() => {
    if (!hasRunningTimer) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [hasRunningTimer]);

  if (authLoading) return null;
  // My Tasks is only for logged in users.
  if (!user) return <Navigate to="/login" replace />;

  function replaceUserTask(updated) {
    setUserTasks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function runAction(userTask, action) {
    setBusyId(userTask.id);
    setNotice(null);
    try {
      await action();
      setNow(new Date());
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  const handleStart = (userTask) =>
    runAction(userTask, async () => replaceUserTask(await startTask(userTask.id)));

  const handleComplete = (userTask) =>
    runAction(userTask, async () => {
      const { userTask: updated, points } = await stopTask(userTask.id);
      replaceUserTask(updated);
      setNotice({ type: 'done', text: userTask.task.title, points });
    });

  const handleRemove = (userTask) =>
    runAction(userTask, async () => {
      await removeTask(userTask.id);
      setUserTasks((prev) => prev.filter((item) => item.id !== userTask.id));
    });

  const today = dateKey(now);
  const quests = getTodaysQuests(userTasks, today);
  const scores = getScores(userTasks, now);

  function renderAction(userTask) {
    const busy = busyId === userTask.id;

    if (userTask.status === 'completed') {
      const minutes = Math.floor(
        (new Date(userTask.completed_at) - new Date(userTask.started_at)) / 60000,
      );
      return (
        <span className={`${chipClass} ${actionWidth}`}>
          {minutes} min · {userTask.points_earned} XP
        </span>
      );
    }

    if (userTask.status === 'in_progress') {
      const seconds = (now - new Date(userTask.started_at)) / 1000;
      return (
        <>
          <span className={`${chipClass} w-18`} aria-label="Time so far">
            {formatClock(seconds)}
          </span>
          <button
            type="button"
            className={actionButtonClass}
            onClick={() => handleComplete(userTask)}
            disabled={busy}
          >
            <StopIcon />
            Complete
          </button>
        </>
      );
    }

    const removeButton = (
      <button
        type="button"
        className="grid h-7 w-7 place-items-center rounded-full border border-line text-muted hover:bg-line hover:text-ink disabled:opacity-50"
        onClick={() => handleRemove(userTask)}
        disabled={busy}
        aria-label={`Remove ${userTask.task.title}`}
        title="Remove"
      >
        <CloseIcon />
      </button>
    );

    // Planned for a later day: it can't be started yet.
    if (userTask.planned_for > today) {
      return (
        <>
          {removeButton}
          <span className={`${chipClass} ${actionWidth}`}>
            Starts {shortDate(userTask.planned_for)}
          </span>
        </>
      );
    }

    return (
      <>
        {removeButton}
        <button
          type="button"
          className={actionButtonClass}
          onClick={() => handleStart(userTask)}
          disabled={busy || hasRunningTimer}
          title={hasRunningTimer ? 'Finish your running quest first' : undefined}
        >
          <PlayIcon />
          Start Quest
        </button>
      </>
    );
  }

  return (
    // On big screens the page is wider than the usual site width, so the quest table fits.
    <div className="grid items-start gap-8 lg:relative lg:left-1/2 lg:w-[min(90rem,calc(100vw-3rem))] lg:-translate-x-1/2 lg:grid-cols-[1fr_2.4fr]">
      <section className="parchment px-2 py-3" aria-labelledby="scoreboard-title">
        <h2
          id="scoreboard-title"
          className="title-shadow mb-2 text-center font-display text-3xl font-bold text-ink"
        >
          Scoreboard
        </h2>
        <Divider />
        <div className="space-y-4">
          <ScoreBox icon={<StarIcon />} label="Today's score" points={scores.today} />
          <ScoreBox icon={<CalendarIcon />} label="This week's score" points={scores.week} />
          <ScoreBox icon={<TrophyIcon />} label="This month's score" points={scores.month} />
        </div>
      </section>

      <section className="parchment px-2 py-3" aria-labelledby="quests-title">
        <h1
          id="quests-title"
          className="title-shadow mb-2 text-center font-display text-3xl font-bold text-ink sm:text-4xl"
        >
          Today's Quests
        </h1>
        <Divider />

        <div aria-live="polite" className="text-center text-lg">
          {notice && (
            <Notice type={notice.type} onClose={() => setNotice(null)}>
              {notice.type === 'done'
                ? `Quest complete! "${notice.text}" earned you ${notice.points} XP.`
                : notice.text}
            </Notice>
          )}
        </div>

        {loading && <p className="text-center text-muted">Loading your quests...</p>}
        {error && (
          <p role="alert" className="text-center font-semibold">
            Could not load your quests: {error}
          </p>
        )}

        {!loading && !error && quests.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-8 text-center">
            <p className="title-shadow font-display text-2xl font-bold">No quests for today</p>
            <p className="text-muted">Pick a few from the catalog to get started.</p>
            <Link
              to="/tasks"
              className="mt-2 rounded border border-line bg-brand-soft px-4 py-1 text-lg hover:bg-line"
            >
              Choose quests
            </Link>
          </div>
        )}

        {/* On big screens only the rows scroll. The titles sit on top of the scroll box,
            so the scrollbar starts up by them like the wireframe. The quest-scroll
            class in app.css hides rows as they slide under the titles. */}
        {quests.length > 0 && (
          <div className="relative">
            <div
              className={`absolute inset-x-0 top-0 z-10 hidden h-11 items-center gap-3 pr-[calc(0.75rem+22px)] pl-3 text-xl font-semibold xl:grid ${rowColumns}`}
            >
              <span>Quest</span>
              <span className="text-center">Category</span>
              <span className="text-center">Status</span>
              {/* Centered over the button, since every row ends with a w-36 button or chip */}
              <span className="w-36 justify-self-end text-center">Time / XP</span>
            </div>
            <div className="quest-scroll lg:max-h-[min(36rem,68vh)] lg:overflow-y-auto lg:pr-2">
              <ul className="space-y-2">
                {quests.map((userTask) => (
                  <li
                    key={userTask.id}
                    className={`relative isolate flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 xl:grid ${rowColumns}`}
                  >
                    <NotchedFrame thin colorClass="text-muted/70" />
                    <div className="w-full min-w-0 xl:w-auto">
                      <p className="text-xl font-semibold break-words">{userTask.task.title}</p>
                      {userTask.status === 'planned' && userTask.planned_for < today && (
                        <p className="text-base text-muted">
                          From {shortDate(userTask.planned_for)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`${pillClass} ${categoryWidth} ${
                        categoryFill[userTask.task.category] || 'bg-brand-soft'
                      }`}
                    >
                      {userTask.task.category}
                    </span>
                    <span className="flex">
                      <StatusPill status={userTask.status} />
                    </span>
                    <div className="ml-auto flex items-center justify-end gap-2">
                      {renderAction(userTask)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!loading && quests.length > 0 && (
          <p className="mt-4 text-center">
            <Link to="/tasks" className="font-semibold underline decoration-2 underline-offset-4">
              Add more quests
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
