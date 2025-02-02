import 'axios';

declare module 'axios' {
  // Extend the AxiosRequestConfig to include 'signal'
  export interface AxiosRequestConfig {
    signal?: AbortSignal;
  }
}