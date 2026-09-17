import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DocumentsList from './pages/DocumentsList.jsx';
import Editor from './pages/Editor.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DocumentsList />} />
        <Route path="/d/:docId" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  );
}
