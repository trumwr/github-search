import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError, AxiosResponse } from 'axios';
import ReactDataGrid from '@inovua/reactdatagrid-community';
import { TypeColumn } from '@inovua/reactdatagrid-community/types';
import '@inovua/reactdatagrid-community/index.css';
import { TEXT } from './constants';

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
  const [searchTerm, setSearchTerm] = useState('');
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
        const query = searchTerm 
          ? `${encodeURIComponent(searchTerm)}+language:${apiLang}`
          : `language:${apiLang}`;

        const response: AxiosResponse<GitHubApiResponse> = await axios.get<GitHubApiResponse>(
          `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10&page=${page}`,
          {
            signal: controller.signal
          }
        );

        setRepos(response.data.items);
      } catch (err) {
        const axiosError = err as AxiosError;
        if (((axiosError as { code?: string }).code) === 'ERR_CANCELED') {
          return;
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
    return () => controller.abort();
  }, [language, page, searchTerm]);

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

      <div className="search-filter">
      <input
        type="text"
        placeholder="Filter repositories by name/description..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(1);
        }}
      />
    </div>

      {repos.length === 0 && !loading && (
        <div className="no-results">
          {searchTerm 
            ? `No results for "${searchTerm}" in ${LANGUAGE_MAP[language.toLowerCase()]}`
            : `No ${LANGUAGE_MAP[language.toLowerCase()]} repositories found`}
        </div>
      )}

      {error && (
        <div className="error-message">
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      )}

      <ReactDataGrid
        idProperty="id"
        columns={columns}
        dataSource={repos}
        style={{ minHeight: 500 }}
        loading={loading}
        pagination
      />
    </div>
  );
};

export default SearchPage;
