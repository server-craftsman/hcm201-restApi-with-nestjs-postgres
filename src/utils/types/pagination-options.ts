export interface IPaginationOptions {
  page: number;
  limit: number;
}

export interface IFilterOptions {
  [key: string]: any;
}

export interface ISortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface IQueryOptions {
  pagination?: IPaginationOptions;
  filters?: IFilterOptions;
  sort?: ISortOptions;
}

export interface IPaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
