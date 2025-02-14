import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { TEXT } from './constants';

type Repo = {
  name: string;
  html_url: string;
  description: string;
  owner: { login: string; html_url: string };
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license?: { name: string };
};

const RepoDetails: React.FC = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [repo, setRepo] = useState<Repo | null>(location.state?.repo || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRepo = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get<Repo>(
          `https://api.github.com/repositories/${repoId}`
        );
        setRepo(response.data);
      } catch (error) {
        setError(
          (error instanceof Error || typeof error === 'object')
            ? (error as { message?: string }).message || 'Unknown error'
            : 'Failed to fetch repository details'
        );
      } finally {
        setLoading(false);
      }
    };

    // Fetch repo only if it's not already available in location.state
    if (!repo && repoId) {
      fetchRepo();
    }
  }, [repo, repoId]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (loading) {
    return <div className="loading">{TEXT.LOADING}</div>;
  }

  if (!repo) {
    return <div>{TEXT.REPO_NOT_FOUND}</div>;
  }

  return (
    <div className="repo-details">
      <h1 style={{ color: 'var(--text-dark)', margin: '1rem 0' }}>
        {repo.name}
      </h1>

      {repo.description && (
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>{repo.description}</p>
      )}

      <div className="details-grid">
        <div>
          <strong>{TEXT.OWNER}</strong>
          <a href={repo.owner.html_url} target="_blank" rel="noopener noreferrer">
            {repo.owner.login}
          </a>
        </div>

        <div>
          <strong>{TEXT.STARS}</strong>
          {repo.stargazers_count.toLocaleString()}
        </div>

        <div>
          <strong>{TEXT.FORKS}</strong>
          {repo.forks_count.toLocaleString()}
        </div>

        <div>
          <strong>{TEXT.OPEN_ISSUES}</strong>
          {repo.open_issues_count.toLocaleString()}
        </div>

        <div>
          <strong>{TEXT.LICENSE}</strong>
          {repo.license?.name || TEXT.NONE}
        </div>

        <div>
          <strong>{TEXT.REPOSITORY}</strong>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
            {TEXT.VIEW_ON_GITHUB}
          </a>
        </div>
      </div>
      <button className="button-primary" onClick={() => navigate(-1)}>
        {TEXT.BACK_BUTTON}
      </button>
    </div>
  );
};

export default RepoDetails;