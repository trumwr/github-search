import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SearchPage from './SearchPage';
import RepoDetails from './RepoDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/details/:repoId" element={<RepoDetails />} />
      </Routes>
    </Router>
  );
}

export default App;