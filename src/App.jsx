import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const NotFound = lazy(() => import('./pages/NotFound'));

const BrowseStates = lazy(() => import('./pages/volunteer/BrowseStates'));
const BrowseChapters = lazy(() => import('./pages/volunteer/BrowseChapters'));
const ChapterEvents = lazy(() => import('./pages/volunteer/ChapterEvents'));
const EventDetail = lazy(() => import('./pages/volunteer/EventDetail'));
const MyEvents = lazy(() => import('./pages/volunteer/MyEvents'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const EventForm = lazy(() => import('./pages/admin/EventForm'));
const EventRoster = lazy(() => import('./pages/admin/EventRoster'));

const Profile = lazy(() => import('./pages/volunteer/Profile'))
const Analytics = lazy(() => import('./pages/admin/Analytics'));

export default function App() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/volunteer"
              element={
                <ProtectedRoute role="volunteer">
                  <BrowseStates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/my-events"
              element={
                <ProtectedRoute role="volunteer">
                  <MyEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/profile"
              element={
                <ProtectedRoute role="volunteer">
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/event/:eventId"
              element={
                <ProtectedRoute role="volunteer">
                  <EventDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/:state"
              element={
                <ProtectedRoute role="volunteer">
                  <BrowseChapters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/:state/:chapterId"
              element={
                <ProtectedRoute role="volunteer">
                  <ChapterEvents />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute role="admin">
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events/new"
              element={
                <ProtectedRoute role="admin">
                  <EventForm mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events/:eventId/edit"
              element={
                <ProtectedRoute role="admin">
                  <EventForm mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events/:eventId/roster"
              element={
                <ProtectedRoute role="admin">
                  <EventRoster />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
