import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import PageShell from './components/PageShell.jsx';
import { APP_NAME } from './config/app.js';
import {
  CategoryPage,
  LoginPage,
  MyTasksPage,
  NotFoundPage,
  ProfilePage,
  SignupPage,
  TasksPage,
  TimerPage,
} from './pages/Pages.jsx';

export default function App() {
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return (
    <PageShell>
      <Routes>
        <Route path="/" element={<MyTasksPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:category" element={<CategoryPage />} />
        <Route path="/timer/:userTaskId" element={<TimerPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </PageShell>
  );
}
