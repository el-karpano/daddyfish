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
  getMe: () => request<{ telegram_user_id: number }>('/api/me'),

  getRecords: () => request<any[]>('/api/fishing-records'),

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

  getMapData: () => request<any[]>('/api/map'),

  getStatistics: () => request<any>('/api/statistics'),

  getAchievements: () => request<any[]>('/api/achievements'),
};
