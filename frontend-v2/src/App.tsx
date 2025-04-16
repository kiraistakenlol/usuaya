import { Routes, Route } from 'react-router-dom';
// import AppLayout from './components/AppLayout'; // Removed unused import
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
    <Routes>
      <Route path="/" element={<HomePlaceholder />} />
      {/* Add other routes here later, e.g.: */}
      {/* <Route path="/texts" element={<TextsListPage />} /> */}
      {/* <Route path="/texts/:textId" element={<TextDetailPage />} /> */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;
