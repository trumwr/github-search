declare module '@inovua/reactdatagrid-community' {
    import React from 'react';
    import { Repo } from './SearchPage'; // Import your Repo type
  
    export interface TypeColumn {
      name: string;
      header: string;
      flex?: number;
      render?: (params: { data: Repo }) => React.ReactNode;
      sortable?: boolean;
      resizable?: boolean;
      // Add other column props you use
    }
  
    export interface TypeDataGridProps {
      idProperty: string;
      columns: TypeColumn[];
      dataSource: Repo[];
      style?: React.CSSProperties;
      loading?: boolean;
      pagination?: boolean;
      onPageChange?: (pageInfo: { page: number }) => void;
    }
  
    const ReactDataGrid: React.FC<TypeDataGridProps>;
    export default ReactDataGrid;
  }