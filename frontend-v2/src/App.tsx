import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout'; // Restore AppLayout import
import HomePage from './pages/HomePage'; // Import HomePage
import TextsListPage from './pages/TextsListPage'; // Import the list page
import TextDetailPage from './pages/TextDetailPage'; // Import the detail page
import './App.css'; // Keep default App styles for now

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/texts" element={<TextsListPage />} />
        <Route path="/texts/:textId" element={<TextDetailPage />} />
        {/* Add other routes here later, e.g.: */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </AppLayout>
  );
}

export default App;
