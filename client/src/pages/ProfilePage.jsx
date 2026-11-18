import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const buttonClass =
  'rounded bg-brand px-4 py-1 text-lg text-panel hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40';

const secondaryButtonClass =
  'rounded border border-line bg-brand-soft px-4 py-1 text-lg text-ink hover:bg-line disabled:cursor-not-allowed disabled:opacity-40';

const labelClass = 'font-display text-sm font-bold tracking-wider text-muted uppercase';

const inputClass =
  'w-full rounded border-2 border-ink bg-panel px-3 py-1 text-xl text-ink focus:outline-none focus:ring-2 focus:ring-brand';

function getTodayPoints(completedTasks = []) {
  const today = new Date().toDateString();
  return completedTasks
    .filter((task) => task.completed_at && new Date(task.completed_at).toDateString() === today)
    .reduce((sum, task) => sum + (task.points_earned || 0), 0);
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) return;
    apiFetch('/profile')
      .then(setProfile)
      .catch((err) => setLoadError(err.message || 'Could not load your profile.'));
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (loadError)
    return (
      <p role="alert" className="text-center font-semibold">
        {loadError}
      </p>
    );
  if (!profile) return <p className="text-center text-muted">Loading profile...</p>;

  return <ProfileCard profile={profile} setProfile={setProfile} />;
}

function ProfileCard({ profile, setProfile }) {
  const { user } = profile;
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startEditing() {
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setError('');
    setSaved(false);
    setEditing(true);
  }

  function cancelEditing() {
    setError('');
    setEditing(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await apiFetch('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      });

      setProfile((prev) => ({ ...prev, user: data.user }));
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Unable to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <section className="parchment px-2 py-3" aria-labelledby="profile-title">
        <h1
          id="profile-title"
          className="title-shadow mb-1 text-center font-display text-3xl font-bold text-ink sm:text-4xl"
        >
          Profile
        </h1>
        <p className="mb-4 text-center text-muted">Your adventurer details</p>

        <div aria-live="polite" className="text-center text-lg">
          {saved && !editing && (
            <p className="mb-3 rounded border border-line bg-brand-soft px-3 py-1">
              Profile saved.
            </p>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="profile-first-name" className={labelClass}>
                First Name
              </label>
              <input
                id="profile-first-name"
                type="text"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="profile-last-name" className={labelClass}>
                Last Name
              </label>
              <input
                id="profile-last-name"
                type="text"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="rounded border border-hard px-3 py-1 font-semibold">
                {error}
              </p>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <button type="submit" className={buttonClass} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={cancelEditing}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <dl className="divide-y divide-line">
              <div className="py-3">
                <dt className={labelClass}>First Name</dt>
                <dd className="text-2xl font-semibold">{user.first_name}</dd>
              </div>
              <div className="py-3">
                <dt className={labelClass}>Last Name</dt>
                <dd className="text-2xl font-semibold">{user.last_name}</dd>
              </div>
              <div className="py-3">
                <dt className={labelClass}>Email Address</dt>
                <dd className="text-2xl font-semibold">{user.email}</dd>
              </div>
              <div className="py-3">
                <dt className={labelClass}>Today's Points</dt>
                <dd className="text-2xl font-semibold">
                  {getTodayPoints(profile.completed_tasks)}
                </dd>
              </div>
              <div className="py-3">
                <dt className={labelClass}>Total Points</dt>
                <dd className="text-2xl font-semibold">{profile.total_points}</dd>
              </div>
            </dl>

            <div className="flex justify-center pt-3">
              <button type="button" className={buttonClass} onClick={startEditing}>
                Edit Profile
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
