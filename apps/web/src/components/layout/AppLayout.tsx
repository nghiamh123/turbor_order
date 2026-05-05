import { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, theme } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  TeamOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { changeLanguage } from '@/i18n';
import api from '@/lib/api';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

/**
 * Main application layout with collapsible sidebar, header with user/language controls,
 * and content area for page routing.
 */
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { token } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: t('sidebar.dashboard'),
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: t('sidebar.orders'),
    },
    {
      key: '/products',
      icon: <TagOutlined />,
      label: t('sidebar.products'),
    },
    {
      key: '/customers',
      icon: <TeamOutlined />,
      label: t('sidebar.customers'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('sidebar.settings'),
    },
  ];

  const languageItems: MenuProps['items'] = [
    { key: 'vi', label: '🇻🇳 Tiếng Việt' },
    { key: 'en', label: '🇺🇸 English' },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || 'Admin',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      danger: true,
    },
  ];

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  const handleLanguageChange = (e: { key: string }) => {
    changeLanguage(e.key as 'vi' | 'en');
  };

  const handleUserMenuClick = async (e: { key: string }) => {
    if (e.key === 'logout') {
      await api.post('/auth/logout');
      logout();
      navigate('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
        width={240}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            gap: 8,
          }}
        >
          <span style={{ fontSize: 24 }}>⚡</span>
          {!collapsed && (
            <span style={{ fontSize: 18, fontWeight: 700, color: token.colorPrimary }}>
              TurboOrder
            </span>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none', marginTop: 8 }}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            height: 64,
          }}
        >
          {/* Left: Collapse trigger */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />

          {/* Right: Language + User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown menu={{ items: languageItems, onClick: handleLanguageChange }}>
              <Button type="text" icon={<GlobalOutlined />}>
                {i18n.language === 'vi' ? '🇻🇳' : '🇺🇸'}
              </Button>
            </Dropdown>

            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                {user?.name && <span style={{ fontSize: 14 }}>{user.name}</span>}
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content Area */}
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
