import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import AppRouter from '@/routes/AppRouter';
import '@/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const { i18n } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (data.success) {
          setAuth(data.data.accessToken, data.data.user);
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
      } finally {
        setInitialized(true);
      }
    };
    initAuth();
  }, [setAuth, setInitialized]);

  const locale = i18n.language === 'vi' ? viVN : enUS;

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={locale}
        theme={{
          token: {
            colorPrimary: '#1677FF',
            borderRadius: 6,
          },
        }}
      >
        <AntApp>
          <AppRouter />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
