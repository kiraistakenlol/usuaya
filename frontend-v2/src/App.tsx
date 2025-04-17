import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout'; // Restore AppLayout import
import TextsListPage from './pages/TextsListPage'; // Import the list page
import TextDetailPage from './pages/TextDetailPage'; // Import the detail page
import './App.css'; // Keep default App styles for now

function HomePlaceholder() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to Usuaya (Vite Version)</h1>
      <p>This is the basic routing setup.</p>
      {/* We'll replace this with actual page components later */}
    </div>
  );
}

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePlaceholder />} />
        <Route path="/texts" element={<TextsListPage />} />
        <Route path="/texts/:textId" element={<TextDetailPage />} />
        {/* Add other routes here later, e.g.: */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </AppLayout>
  );
}

export default App;
