import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Send cookies (Sanctum session)
    withXSRFToken: true,
});

// Request interceptor - add CSRF token
api.interceptors.request.use((config) => {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }
    return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
        if (error.response?.status === 419) {
            // CSRF token expired, reload page
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

// Initialize CSRF cookie
export async function initializeCsrf(): Promise<void> {
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
}

/**
 * Downloads a file (e.g. a PDF) through the authenticated API client.
 * Using axios (with session cookies) avoids the login redirect that
 * happens when opening an /api/... URL as a top-level browser navigation.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
    const res = await api.get(path, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

/**
 * Opens a file (e.g. a PDF) inline in a new browser tab for previewing.
 * The tab is opened synchronously on click (to avoid popup blockers),
 * then the fetched blob is loaded into it.
 */
export async function viewFile(path: string): Promise<void> {
    const win = window.open('', '_blank');
    try {
        const res = await api.get(path, { responseType: 'blob' });
        const blobUrl = URL.createObjectURL(res.data as Blob);
        if (win) win.location.href = blobUrl;
        else window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
        if (win) win.close();
        throw e;
    }
}

export default api;
