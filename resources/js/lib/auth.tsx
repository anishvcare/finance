import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api, { initializeCsrf } from './api';
import { setDefaultCurrency } from './currencies';

interface User {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    is_super_admin: boolean;
    onboarding_completed: boolean;
    current_workspace_id: number | null;
    timezone: string;
    date_format: string;
    current_workspace: Workspace | null;
    workspaces: Workspace[];
}

interface Workspace {
    id: number;
    uuid: string;
    name: string;
    type: 'personal' | 'business';
    currency: string;
    timezone: string;
    pivot?: { role: string };
    settings?: WorkspaceSettings;
}

interface WorkspaceSettings {
    business_name: string | null;
    logo_path: string | null;
    invoice_prefix: string;
    accent_color: string;
}

interface AuthContextType {
    user: User | null;
    workspace: Workspace | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    switchWorkspace: (workspaceId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        try {
            await initializeCsrf();
            const response = await api.get('/auth/user');
            setUser(response.data);
            setDefaultCurrency(response.data?.current_workspace?.currency);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (email: string, password: string) => {
        await initializeCsrf();
        const response = await api.post('/auth/login', { email, password });
        setUser(response.data.user);
        setDefaultCurrency(response.data.user?.current_workspace?.currency);
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
        window.location.href = '/login';
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    const switchWorkspace = async (workspaceId: number) => {
        await api.post(`/workspaces/${workspaceId}/switch`);
        await refreshUser();
    };

    const workspace = user?.current_workspace || null;

    return (
        <AuthContext.Provider value={{ user, workspace, isLoading, login, logout, refreshUser, switchWorkspace }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
