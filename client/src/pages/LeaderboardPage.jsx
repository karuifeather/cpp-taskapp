import { Fragment, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../lib/api.js';

// How many players fit on one page. The API allows 1 to 50.
const PER_PAGE = 10;

// Title you earn from your total points. Checked top down, first match wins.
const TITLES = [
  { min: 2000, name: 'Legend' },
  { min: 1000, name: 'Champion' },
  { min: 600, name: 'Veteran' },
  { min: 300, name: 'Adventurer' },
  { min: 150, name: 'Seeker' },
  { min: 50, name: 'Apprentice' },
  { min: 0, name: 'Newcomer' },
];

const titleFor = (points) => TITLES.find((title) => points >= title.min).name;

// Ring color on the avatar for the top 3
const medalRing = {
  1: 'ring-[#c9a227]',
  2: 'ring-[#a8a8a8]',
  3: 'ring-[#b06a32]',
};

// Same columns for the header and every row. Title and Quests hide on phones.
const gridClass =
  'grid grid-cols-[2.25rem_1fr_4.25rem] items-center gap-1.5 sm:grid-cols-[4rem_1.4fr_1.1fr_6rem_7rem] sm:gap-3';

const linkClass = 'font-semibold underline decoration-2 underline-offset-4';

const pageButtonClass =
  'grid h-9 w-9 place-items-center rounded-sm border-2 border-ink bg-brand-soft text-ink shadow-[inset_0_0_0_2px_rgb(255_255_255/0.25),0_2px_0_var(--color-ink)] transition hover:bg-line active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40';

function Chevron({ flip }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3.5 w-3.5 ${flip ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7.5 2.5L4 6l3.5 3.5" />
    </svg>
  );
}

// Little swirl line used between sections of the list
function Flourish() {
  return (
    <div className="flex items-center gap-3 py-2 text-brand/60" aria-hidden="true">
      <span className="h-px flex-1 bg-brand/30" />
      <svg
        viewBox="0 0 48 12"
        className="h-4 w-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M2 6c6 0 6-4 11-4s5 8 11 8 6-8 11-8 5 4 11 4" />
      </svg>
      <span className="h-px flex-1 bg-brand/30" />
    </div>
  );
}

function Avatar({ player }) {
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand font-display text-xs font-bold text-panel sm:h-10 sm:w-10 sm:text-sm ${medalRing[player.rank] ? `ring-3 ${medalRing[player.rank]}` : 'ring-2 ring-ink/40'}`}
    >
      {player.first_name[0]}
      {player.last_initial}
    </span>
  );
}

// One player row. Your own row pops out of the list with a gold glow.
function PlayerRow({ player, isMe }) {
  const meClass =
    'relative z-10 -mx-2 my-1 rounded border-2 border-ink bg-panel px-2 py-3shadow-[0_0_0_2px_#c9a227,0_0_16px_4px_rgb(230_180_40/0.85)] sm:-mx-6 sm:px-6 sm:text-2xl';

  return (
    <li
      className={`${gridClass} ${isMe ? meClass : 'border-b border-line/60 px-1 py-2 text-lg last:border-b-0 sm:px-2 sm:text-xl'}`}
    >
      <span className="text-center font-display font-bold">#{player.rank}</span>
      <span className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Avatar player={player} />
        <span className="min-w-0 truncate font-semibold">
          {player.first_name} {player.last_initial}.
          {isMe && (
            <span className="ml-1.5 hidden text-base font-normal text-muted sm:inline">(you)</span>
          )}
        </span>
      </span>
      <span className="hidden truncate text-muted italic sm:block">
        {titleFor(player.total_points)}
      </span>
      <span className="hidden text-center text-muted sm:block">
        {player.completed_count} {player.completed_count === 1 ? 'quest' : 'quests'}
      </span>
      <span className="text-right font-display font-bold">
        {player.total_points.toLocaleString()}
        <span className="ml-1 text-xs sm:text-sm">pts</span>
      </span>
    </li>
  );
}

function HeaderRow() {
  const cell = 'sm:border-l sm:border-panel/30 sm:pl-3';
  return (
    <div
      className={`${gridClass} rounded-t-sm bg-brand px-1 py-2 font-display text-sm font-bold tracking-wider text-panel sm:px-2 sm:text-base`}
    >
      <span className="text-center">
        <span className="sm:hidden">#</span>
        <span className="hidden sm:inline">Rank</span>
      </span>
      <span className={cell}>Quester</span>
      <span className={`hidden sm:block ${cell}`}>Title</span>
      <span className={`hidden text-center sm:block ${cell}`}>Quests</span>
      <span className={`text-right ${cell}`}>Points</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  // page number lives in the URL (?page=2), like the Task Catalog
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // wait until we know if someone is logged in
    if (authLoading || !user) return;
    let ignore = false;
    apiFetch(`/leaderboard?limit=${PER_PAGE}&offset=${(page - 1) * PER_PAGE}`)
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [authLoading, user, page]);

  function goToPage(next) {
    setSearchParams(next === 1 ? {} : { page: String(next) });
  }

  let body;
  if (authLoading) {
    body = null;
  } else if (!user) {
    body = (
      <p className="text-muted">
        <Link to="/login" className={linkClass}>
          Log in
        </Link>{' '}
        to see who is leading the quest board.
      </p>
    );
  } else if (error) {
    body = <p className="text-hard">Could not load the leaderboard: {error}</p>;
  } else if (!data) {
    body = <p className="text-muted">Loading the standings...</p>;
  } else if (data.total === 0) {
    body = (
      <p className="text-muted">
        No one has finished a quest yet. Finish one from{' '}
        <Link to="/" className={linkClass}>
          My Tasks
        </Link>{' '}
        to claim the top spot!
      </p>
    );
  } else {
    const { leaderboard, me, total } = data;
    const pageCount = Math.ceil(total / PER_PAGE);
    const first = (page - 1) * PER_PAGE + 1;
    const last = first + leaderboard.length - 1;
    const meOnPage = me && leaderboard.some((player) => player.user_id === me.user_id);

    body = (
      <>
        <HeaderRow />
        {leaderboard.length === 0 ? (
          <p className="py-6 text-center text-muted">
            No questers on this page.{' '}
            <button type="button" onClick={() => goToPage(1)} className={linkClass}>
              Back to page 1
            </button>
          </p>
        ) : (
          <ol className="px-1">
            {leaderboard.map((player, index) => (
              <Fragment key={player.user_id}>
                <PlayerRow player={player} isMe={player.user_id === me?.user_id} />
                {/* swirl under the top 3 on the first page */}
                {page === 1 && index === 2 && leaderboard.length > 3 && (
                  <li aria-hidden="true">
                    <Flourish />
                  </li>
                )}
              </Fragment>
            ))}
          </ol>
        )}

        {/* your own spot when it's not on this page */}
        {me && !meOnPage && (
          <>
            <Flourish />
            {me.total_points > 0 ? (
              <ul className="px-1">
                <PlayerRow player={me} isMe />
              </ul>
            ) : (
              <p className="text-center text-muted">
                You don't have any points yet. Finish a quest to get on the board.
              </p>
            )}
          </>
        )}

        <div className="mt-5 flex items-center justify-center gap-4">
          <span className="text-muted">
            Showing {!leaderboard.length ? 0 : first === last ? first : `${first}-${last}`} of{' '}
            {total} {total === 1 ? 'quester' : 'questers'}
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              className={pageButtonClass}
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <Chevron />
            </button>
            <button
              type="button"
              className={pageButtonClass}
              onClick={() => goToPage(page + 1)}
              disabled={page >= pageCount}
              aria-label="Next page"
            >
              <Chevron flip />
            </button>
          </span>
        </div>
      </>
    );
  }

  return (
    <section className="parchment mx-auto max-w-4xl px-2 py-3 sm:px-4">
      <h1 className="title-shadow mb-1 font-display text-3xl font-bold text-ink sm:text-5xl">
        Leaderboard
      </h1>
      <p className="mb-6 text-muted">Top questers ranked by points from finished quests.</p>
      {body}
    </section>
  );
}
