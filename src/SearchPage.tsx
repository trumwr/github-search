import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError, AxiosResponse } from 'axios';
import ReactDataGrid from '@inovua/reactdatagrid-community';
import { TypeColumn } from '@inovua/reactdatagrid-community/types';
import '@inovua/reactdatagrid-community/index.css';
import { TEXT } from './constants';
import { useDebounce } from "./useDebounce";

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
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  'c#': 'C#'
};

const SearchPage: React.FC = () => {
  const [language, setLanguage] = useState('javascript');
  const [searchTerm, setSearchTerm] = useState('');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const navigate = useNavigate();
  const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN ?? "";
  const headers = useMemo(() => {
    const result: { [key: string]: string } = {
      Accept: "application/vnd.github.v3+json",
    };
  
    if (GITHUB_TOKEN) {
      result['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }
  
    return result;
  }, [GITHUB_TOKEN]);

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }

  const fetchData = useCallback(async ({ skip, limit }: { skip: number; limit: number }): Promise<Repo[]> => {
    setError(null);
    setLoading(true);

    try {
      const apiLang = LANGUAGE_MAP[language.toLowerCase()] || language;
      const query = searchTerm.trim()
        ? `${encodeURIComponent(searchTerm)}+language:${apiLang}`
        : `language:${apiLang}`;

      const response: AxiosResponse<GitHubApiResponse> = await axios.get<GitHubApiResponse>(
        `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=${limit}&page=${skip / limit + 1}`,
        { headers }
      );

      return response.data.items;
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 429) {
        setError(TEXT.API_RATE_LIMIT);
        return [];
      }

      setError(TEXT.ERROR_FETCH_REPOS);
      return [];
    } finally {
      setLoading(false);
    }
  }, [headers, language, searchTerm]);

  const fetchDataSync = useCallback(async ({ skip, limit }: { skip: number; limit: number }) => {
    console.log("Fetching data for grid pagination:", { skip, limit, page });

    if (!searchTerm.trim() && page === 1) {
      console.log("Fetching default JavaScript repositories");
    }

    const data = await fetchData({ skip, limit });

    return {
      data: data ?? [],
      count: 1000,
    };
  }, [page, searchTerm, fetchData]);

  useEffect(() => {
    const fetchAndSetData = async () => {
      const data = await fetchData({ skip: (page - 1) * 10, limit: 10 });
      setRepos(data ?? []);
    };

    fetchAndSetData();
  }, [language, debouncedSearchTerm, page, fetchData]);


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
        dataSource={fetchDataSync}
        style={{ minHeight: 500 }}
        pagination={true}
        defaultLimit={10}
        defaultSkip={0}
      />
    </div>
  );
};

export default SearchPage;
