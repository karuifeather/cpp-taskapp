import { useParams } from 'react-router-dom';
import PlannedPage from '../components/PlannedPage.jsx';

export function MyTasksPage() {
  return (
    <PlannedPage
      title="My Tasks"
      description="Personal task list and completion actions will go here."
    />
  );
}

export function TasksPage() {
  return (
    <PlannedPage title="Task Catalog" description="Browse and filter predefined tasks here." />
  );
}

export function CategoryPage() {
  const { category } = useParams();
  return <PlannedPage title={`Category: ${category}`} description="Filtered catalog goes here." />;
}

export function TimerPage() {
  const { userTaskId } = useParams();
  return (
    <PlannedPage
      title={`Timer for task #${userTaskId}`}
      description="The frontend will display elapsed time from the backend's saved started_at timestamp."
    />
  );
}

export function ProfilePage() {
  return (
    <PlannedPage title="Profile" description="Account details and accumulated points go here." />
  );
}

export function LoginPage() {
  return (
    <PlannedPage
      title="Log In"
      description="The account login form will be implemented in Area 2."
    />
  );
}

export function SignupPage() {
  return (
    <PlannedPage
      title="Sign Up"
      description="The account creation form will be implemented in Area 2."
    />
  );
}

export function NotFoundPage() {
  return <PlannedPage title="Page not found" description="This page does not exist." />;
}
