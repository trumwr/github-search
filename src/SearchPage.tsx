import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import ReactDataGrid, { TypeColumn } from '@inovua/reactdatagrid-community';
import '@inovua/reactdatagrid-community/index.css';
import { TEXT } from './constants';

// Define the Repo interface
interface Repo {
  id: number;
  name: string;
  html_url: string;
  owner: {
    login: string;
    html_url: string;
  };
  description: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license?: {
    name: string;
  } | null;
}

// Define the GitHub API response interface
interface GitHubApiResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repo[];
}

// Map for language conversion if needed for the API query
const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  'c#': 'csharp'
};

const SearchPage: React.FC = () => {
  const [language, setLanguage] = useState('javascript');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setError(null);
      try {
        setLoading(true);
        const apiLang = LANGUAGE_MAP[language.toLowerCase()] || language;
        const config: AxiosRequestConfig = {
          // Use a double cast to allow the signal property
          signal: controller.signal
        } as unknown as AxiosRequestConfig;
        const response: AxiosResponse<GitHubApiResponse> = await axios.get<GitHubApiResponse>(
          `https://api.github.com/search/repositories?q=language:${apiLang}&sort=stars&order=desc&per_page=10&page=${page}`,
          config
        );
        setRepos((prev) =>
          page === 1 ? response.data.items : [...prev, ...response.data.items]
        );
      } catch (err) {
        const axiosError = err as AxiosError;
        // Instead of using 'any', cast to an object with an optional code property.
        if (((axiosError as { code?: string }).code) === 'ERR_CANCELED') {
          return; // Request was canceled, do nothing
        }
        if (axiosError.response?.status === 403) {
          setError(TEXT.API_RATE_LIMIT);
        } else {
          console.error('API Error:', axiosError);
          setError(TEXT.ERROR_FETCH_REPOS);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup: cancel the request if the component unmounts or dependencies change
    return () => {
      controller.abort();
    };
  }, [language, page]);

  // Define the grid columns
  const columns: TypeColumn[] = [
    {
      name: 'name',
      header: 'Repository',
      render: ({ data }: { data: Repo }) => (
        <a href={data.html_url} target="_blank" rel="noopener noreferrer">
          {data.name}
        </a>
      )
    },
    {
      name: 'description',
      header: 'Description',
      flex: 2,
      render: ({ data }: { data: Repo }) => data.description || 'No description'
    },
    {
      name: 'details',
      header: 'Details',
      render: ({ data }: { data: Repo }) => (
        <button onClick={() => navigate(`/details/${data.id}`, { state: data })}>
          {TEXT.VIEW_DETAILS}
        </button>
      )
    }
  ];

  return (
    <div className="search-page">
      <h1>{TEXT.SEARCH_TITLE}</h1>
      <div className="language-selector">
        <label>{TEXT.SELECT_LANGUAGE}</label>
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setPage(1);
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="c#">C#</option>
        </select>
      </div>

      {repos.length === 0 && !loading && (
        <div className="no-results">
          {`No ${LANGUAGE_MAP[language.toLowerCase()]} repositories found`}
        </div>
      )}

      {error && (
        <div className="error-message">
          <p style={{ color: 'red' }}>{error}</p>
          {error === TEXT.API_RATE_LIMIT && (
            <button onClick={() => setPage(1)}>
              {TEXT.TRY_AGAIN}
            </button>
          )}
        </div>
      )}

      <ReactDataGrid
        idProperty="id"
        columns={columns}
        dataSource={repos}
        style={{ minHeight: 500 }}
        loading={loading}
        pagination
        onPageChange={(pageInfo: { page: number }) => setPage(pageInfo.page)}
      />
    </div>
  );
};

export default SearchPage;
