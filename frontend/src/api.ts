const API_BASE = import.meta.env.VITE_API_URL || '';

function getInitData(): string {
  return (window as any).Telegram?.WebApp?.initData || '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'X-Telegram-Init-Data': getInitData(),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Ошибка сервера' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth / me
  getMe: () => request<any>('/api/me'),

  // Club
  getClub: () => request<any>('/api/club'),
  getClubMembers: () => request<any[]>('/api/club/members'),
  createInvite: () => request<{ token: string }>('/api/club/invite', { method: 'POST' }),
  removeMember: (memberId: number) =>
    request<any>(`/api/club/members/${memberId}`, { method: 'DELETE' }),

  // Users
  getUserProfile: (userId: number) => request<any>(`/api/users/${userId}`),

  // Fishing records
  getRecords: (userId?: number) => {
    const params = userId ? `?user_id=${userId}` : '';
    return request<any[]>(`/api/fishing-records${params}`);
  },

  getRecord: (id: number) => request<any>(`/api/fishing-records/${id}`),

  createRecord: (data: any) =>
    request<any>('/api/fishing-records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRecord: (id: number, data: any) =>
    request<any>(`/api/fishing-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRecord: (id: number) =>
    request<any>(`/api/fishing-records/${id}`, { method: 'DELETE' }),

  // Photos
  uploadPhoto: (recordId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<any>(`/api/fishing-records/${recordId}/photos`, {
      method: 'POST',
      body: form,
    });
  },

  deletePhoto: (recordId: number, photoId: number) =>
    request<any>(`/api/fishing-records/${recordId}/photos/${photoId}`, {
      method: 'DELETE',
    }),

  // Map
  getMapData: () => request<any[]>('/api/map'),

  // Statistics
  getStatistics: () => request<any>('/api/statistics'),
  getClubStatistics: () => request<any>('/api/statistics/club'),

  // Achievements
  getAchievements: (userId?: number) => {
    const path = userId ? `/api/achievements/${userId}` : '/api/achievements';
    return request<any[]>(path);
  },
};