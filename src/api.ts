import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from 'axios';

const baseURL = import.meta.env.VITE_API_BASE ?? '/api';
const TOKEN_KEY = 'rag_token';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) => {
    const msg =
      (err.response?.data as { detail?: string })?.detail ??
      err.response?.statusText ??
      err.message ??
      'Request failed';
    return Promise.reject(new Error(msg));
  }
);

function data<T>(res: AxiosResponse<T>): T {
  return res.data;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface User {
  id: string;
  email: string;
  role: string;
  org_id?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function register(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/register', { email, password }).then(data);
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', { email, password }).then(data);
}

export function me(): Promise<User> {
  return api.get<User>('/auth/me').then(data);
}

export interface Org {
  id: string;
  name: string;
  created_at: string | null;
  max_pdfs?: number;
  max_chars?: number;
  upload_enabled?: boolean;
}

export interface Upload {
  id: number;
  org_id: string;
  filename: string;
  created_at: string | null;
}

export interface OrgDashboardResponse {
  org: Org;
  uploads: Upload[];
}

export function orgDashboard(): Promise<OrgDashboardResponse> {
  return api.get<OrgDashboardResponse>('/org/dashboard').then(data);
}

export interface OrgWithUploadCount extends Org {
  upload_count: number;
}

export interface AdminDashboardResponse {
  orgs: OrgWithUploadCount[];
}

export function adminDashboard(): Promise<AdminDashboardResponse> {
  return api.get<AdminDashboardResponse>('/admin/dashboard').then(data);
}

export function adminListOrgs(): Promise<{ orgs: Org[] }> {
  return api.get<{ orgs: Org[] }>('/admin/orgs').then(data);
}

export function createOrg(name: string): Promise<Org> {
  return api.post<Org>('/orgs', { name }).then(data);
}

export function getOrg(orgId: string): Promise<Org> {
  return api.get<Org>(`/orgs/${orgId}`).then(data);
}

export interface OrgDetailResponse extends Org {
  uploads: Upload[];
  upload_count: number;
  custom_prompt?: string | null;
  max_pdfs?: number;
  max_chars?: number;
  upload_enabled?: boolean;
}

export interface SetOrgLimitsRequest {
  max_pdfs?: number;
  max_chars?: number;
  upload_enabled?: boolean;
}

export function adminGetOrg(orgId: string): Promise<OrgDetailResponse> {
  return api.get<OrgDetailResponse>(`/admin/orgs/${orgId}`).then(data);
}

export function getDefaultPrompt(): Promise<{ content: string }> {
  return api.get<{ content: string }>('/admin/prompt').then(data);
}

export function setOrgPrompt(orgId: string, content: string | null): Promise<{ ok: boolean }> {
  return api.put<{ ok: boolean }>(`/admin/orgs/${orgId}/prompt`, { content: content ?? null }).then(data);
}

export function setOrgLimits(orgId: string, limits: SetOrgLimitsRequest): Promise<{ ok: boolean }> {
  return api.put<{ ok: boolean }>(`/admin/orgs/${orgId}/limits`, limits).then(data);
}

export function registerOrgUser(name: string, email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/register-org', { name, email, password }).then(data);
}

export interface UploadResponse {
  message: string;
  chunks_stored: number;
}

export function uploadPdf(orgId: string, file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<UploadResponse>(`/orgs/${orgId}/rag/upload`, form, {
      headers: { 'Content-Type': undefined },
    } as InternalAxiosRequestConfig)
    .then(data);
}

export interface QueryResponse {
  answer: string;
}

export function ragQuery(orgId: string, question: string): Promise<QueryResponse> {
  return api.post<QueryResponse>(`/orgs/${orgId}/rag/query`, { question }).then(data);
}

export interface ApiKeyInfo {
  id: string;
  key_prefix: string;
  created_at: string | null;
}

export interface CreateApiKeyResponse {
  api_key: string;
  key_prefix: string;
  created_at: string | null;
}

export function createOrgApiKey(orgId: string): Promise<CreateApiKeyResponse> {
  return api.post<CreateApiKeyResponse>(`/admin/orgs/${orgId}/api-keys`).then(data);
}

export interface ListApiKeysResponse {
  api_keys: ApiKeyInfo[];
}

export function listOrgApiKeys(orgId: string): Promise<ListApiKeysResponse> {
  return api.get<ListApiKeysResponse>(`/admin/orgs/${orgId}/api-keys`).then(data);
}

export function orgCreateApiKey(): Promise<CreateApiKeyResponse> {
  return api.post<CreateApiKeyResponse>('/org/api-keys').then(data);
}

export function orgListApiKeys(): Promise<ListApiKeysResponse> {
  return api.get<ListApiKeysResponse>('/org/api-keys').then(data);
}

export interface VectorStoreEmbedding {
  id: string;
  document_preview: string;
  metadata: Record<string, unknown>;
}

export interface VectorStoreResponse {
  collection_name: string;
  total_embeddings: number;
  recent: VectorStoreEmbedding[];
}

export function getVectorStore(): Promise<VectorStoreResponse> {
  return api.get<VectorStoreResponse>('/admin/vector').then(data);
}
