import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList, TextInput, ViewStyle, TextStyle, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Users, BarChart3, Settings, ArrowLeft, Search, Home, Bell, Clock } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { format } from 'date-fns';

const AnimatedView = Animated.createAnimatedComponent(View);

type Section = 'overview' | 'users' | 'notifications' | 'settings' | 'api-logs';

type UserRole = 'admin' | 'user' | 'banned';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in: string;
  role: UserRole;
  alerts_enabled: boolean;
  alert_time: string;
  alert_frequency: number;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalApiCalls: number;
  apiCallsToday: number;
  apiSuccessRate: number;
  averageResponseTime: number;
}

// Add new interfaces for API Logs
interface APILog {
  id: string;
  user_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  timestamp: string;
  response_time: number;
  user_email?: string;
  user_name?: string;
}

// Add type definitions for styles
interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  title: TextStyle;
  content: ViewStyle;
  loadingContainer: ViewStyle;
  statsGrid: ViewStyle;
  statCard: ViewStyle;
  statValue: TextStyle;
  statTitle: TextStyle;
  usersSection: ViewStyle;
  searchContainer: ViewStyle;
  searchInput: TextStyle;
  userRow: ViewStyle;
  userInfo: ViewStyle;
  userName: TextStyle;
  userEmail: TextStyle;
  userMetadata: ViewStyle;
  userMetaText: TextStyle;
  roleTag: ViewStyle;
  roleText: TextStyle;
  separator: ViewStyle;
  emptyText: TextStyle;
  navbar: ViewStyle;
  navButton: ViewStyle;
  navButtonActive: ViewStyle;
  navLabel: TextStyle;
  navLabelActive: TextStyle;
  sectionContent: ViewStyle;
  sectionContainer: ViewStyle;
  sectionTitle: TextStyle;
  comingSoon: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  roleOption: ViewStyle;
  roleOptionActive: ViewStyle;
  roleOptionText: TextStyle;
  roleDescription: TextStyle;
  banOption: ViewStyle;
  banText: TextStyle;
  closeButton: ViewStyle;
  closeButtonText: TextStyle;
  settingsGroup: ViewStyle;
  settingsGroupTitle: TextStyle;
  settingsList: ViewStyle;
  settingsUserRow: ViewStyle;
  settingsUserInfo: ViewStyle;
  settingsUserMain: ViewStyle;
  settingsUserName: TextStyle;
  settingsUserEmail: TextStyle;
  settingsUserMeta: TextStyle;
  settingsRoleTag: ViewStyle;
  settingsRoleText: TextStyle;
  settingsSeparator: ViewStyle;
  mainContent: ViewStyle;
  settingsContent: ViewStyle;
  alertUserRow: ViewStyle;
  alertUserInfo: ViewStyle;
  alertUserName: TextStyle;
  alertUserEmail: TextStyle;
  alertMetadata: ViewStyle;
  alertTimeTag: ViewStyle;
  alertTimeText: TextStyle;
  alertFrequencyTag: ViewStyle;
  alertFrequencyText: TextStyle;
  logsLoading: ViewStyle;
  logRow: ViewStyle;
  logHeader: ViewStyle;
  logUser: ViewStyle;
  logUserName: TextStyle;
  logUserEmail: TextStyle;
  logTimestamp: TextStyle;
  logDetails: ViewStyle;
  logMethod: ViewStyle;
  logMethodText: TextStyle;
  logEndpoint: TextStyle;
  logStatus: ViewStyle;
  logStatusText: TextStyle;
  logFooter: ViewStyle;
  logResponseTime: TextStyle;
  statSuffix: TextStyle;
  overviewContainer: ViewStyle;
  overviewSection: ViewStyle;
  overviewTitle: TextStyle;
  overviewSubtitle: TextStyle;
  statHeader: ViewStyle;
  statDescription: TextStyle;
  usersList: ViewStyle;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalApiCalls: 0,
    apiCallsToday: 0,
    apiSuccessRate: 0,
    averageResponseTime: 0
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [apiLogs, setApiLogs] = useState<APILog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchDashboardStats();
    fetchUsers();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/sign-in');
        return;
      }

      // Check if user has admin role in profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile?.role !== 'admin') {
        Alert.alert('Access Denied', 'You need admin privileges to access this page.');
        router.back();
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.back();
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Get total users count
      const { count: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get users who logged in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: activeUsers, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('last_sign_in', today.toISOString());

      if (activeError) throw activeError;

      // Get new users today
      const { count: newUsers, error: newError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', today.toISOString());

      if (newError) throw newError;

      // Get total API calls
      const { count: totalApiCalls, error: apiError } = await supabase
        .from('api_logs')
        .select('*', { count: 'exact', head: true });

      if (apiError) throw apiError;

      // Get today's API calls
      const { count: apiCallsToday, error: apiTodayError } = await supabase
        .from('api_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (apiTodayError) throw apiTodayError;

      // Get success rate and average response time
      const { data: apiStats, error: statsError } = await supabase
        .from('api_logs')
        .select('status_code, response_time');

      if (statsError) throw statsError;

      const successfulCalls = apiStats?.filter(log => log.status_code >= 200 && log.status_code < 300).length || 0;
      const apiSuccessRate = apiStats?.length ? (successfulCalls / apiStats.length) * 100 : 0;
      const averageResponseTime = apiStats?.length 
        ? apiStats.reduce((acc, log) => acc + log.response_time, 0) / apiStats.length 
        : 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersToday: newUsers || 0,
        totalApiCalls: totalApiCalls || 0,
        apiCallsToday: apiCallsToday || 0,
        apiSuccessRate: Math.round(apiSuccessRate * 10) / 10,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      Alert.alert('Error', 'Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      Alert.alert('Success', 'User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    } finally {
      setIsLoading(false);
      setShowRoleModal(false);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    if (!selectedUser) return;

    Alert.alert(
      'Confirm Role Change',
      `Are you sure you want to change ${selectedUser.full_name}'s role to ${newRole}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: () => updateUserRole(selectedUser.id, newRole)
        }
      ]
    );
  };

  const RoleModal = () => (
    <Modal
      visible={showRoleModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRoleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Change Role: {selectedUser?.full_name}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.roleOption,
              selectedUser?.role === 'admin' && styles.roleOptionActive
            ]}
            onPress={() => handleRoleChange('admin')}
          >
            <Text style={styles.roleOptionText}>Admin</Text>
            <Text style={styles.roleDescription}>
              Full access to dashboard and user management
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleOption,
              selectedUser?.role === 'user' && styles.roleOptionActive
            ]}
            onPress={() => handleRoleChange('user')}
          >
            <Text style={styles.roleOptionText}>User</Text>
            <Text style={styles.roleDescription}>
              Standard user access
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleOption,
              selectedUser?.role === 'banned' && styles.roleOptionActive,
              styles.banOption
            ]}
            onPress={() => handleRoleChange('banned')}
          >
            <Text style={[styles.roleOptionText, styles.banText]}>Ban User</Text>
            <Text style={styles.roleDescription}>
              Prevent user from accessing the app
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowRoleModal(false)}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon,
    suffix,
    description,
    color = '#0a84ff'
  }: { 
    title: string; 
    value: number; 
    icon: any;
    suffix?: string;
    description?: string;
    color?: string;
  }) => (
    <AnimatedView 
      entering={FadeIn} 
      style={[styles.statCard, { borderColor: color }]}
    >
      <View style={styles.statHeader}>
        <Icon size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>
        {value}{suffix && <Text style={styles.statSuffix}>{suffix}</Text>}
      </Text>
      {description && (
        <Text style={styles.statDescription}>{description}</Text>
      )}
    </AnimatedView>
  );

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.userRow}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMetadata}>
          <Text style={styles.userMetaText}>Created: {formatDate(item.created_at)}</Text>
          <Text style={styles.userMetaText}>
            Last Login: {item.last_sign_in ? formatDate(item.last_sign_in) : 'Never'}
          </Text>
          <TouchableOpacity
            style={[
              styles.roleTag,
              {
                backgroundColor: 
                  item.role === 'admin' ? '#ff375f' :
                  item.role === 'banned' ? '#ff453a' : '#32d74b'
              }
            ]}
            onPress={() => {
              setSelectedUser(item);
              setShowRoleModal(true);
            }}
          >
            <Text style={styles.roleText}>{item.role}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NavButton = ({ section, icon: Icon, label }: { section: Section; icon: any; label: string }) => (
    <TouchableOpacity
      style={[
        styles.navButton,
        activeSection === section && styles.navButtonActive
      ]}
      onPress={() => setActiveSection(section)}
    >
      <Icon
        size={24}
        color={activeSection === section ? '#0a84ff' : '#8e8e93'}
      />
      <Text
        style={[
          styles.navLabel,
          activeSection === section && styles.navLabelActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOverviewSection = () => (
    <ScrollView style={styles.overviewContainer}>
      <View style={styles.overviewSection}>
        <Text style={styles.overviewTitle}>User Statistics</Text>
        <Text style={styles.overviewSubtitle}>Overview of user activity and growth</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers}
            icon={Users}
            description="Total registered users"
          />
          <StatCard 
            title="Active Today" 
            value={stats.activeUsers}
            icon={BarChart3}
            description="Users active in last 24h"
          />
          <StatCard 
            title="New Today" 
            value={stats.newUsersToday}
            icon={Settings}
            description="New registrations today"
          />
        </View>
      </View>

      <View style={styles.overviewSection}>
        <Text style={styles.overviewTitle}>API Performance</Text>
        <Text style={styles.overviewSubtitle}>Real-time API metrics and health</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total API Calls" 
            value={stats.totalApiCalls}
            icon={BarChart3}
            description="Total requests made"
          />
          <StatCard 
            title="Calls Today" 
            value={stats.apiCallsToday}
            icon={Clock}
            description="Requests in last 24h"
          />
          <StatCard 
            title="Success Rate" 
            value={stats.apiSuccessRate}
            suffix="%"
            icon={BarChart3}
            description="Successful responses"
            color={stats.apiSuccessRate > 95 ? '#32d74b' : stats.apiSuccessRate > 90 ? '#ff9f0a' : '#ff453a'}
          />
          <StatCard 
            title="Avg Response" 
            value={stats.averageResponseTime}
            suffix="ms"
            icon={Clock}
            description="Average response time"
            color={stats.averageResponseTime < 100 ? '#32d74b' : stats.averageResponseTime < 300 ? '#ff9f0a' : '#ff453a'}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderUsersSection = () => (
    <View style={styles.usersSection}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#8e8e93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#8e8e93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No users found</Text>
        )}
        contentContainerStyle={styles.usersList}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );

  const renderNotificationsSection = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Weather Alert Subscribers</Text>
      
      <View style={styles.searchContainer}>
        <Search size={20} color="#8e8e93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#8e8e93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers.filter(user => user.alerts_enabled)}
        renderItem={({ item }) => (
          <View style={styles.alertUserRow}>
            <View style={styles.alertUserInfo}>
              <Text style={styles.alertUserName}>{item.full_name}</Text>
              <Text style={styles.alertUserEmail}>{item.email}</Text>
              <View style={styles.alertMetadata}>
                <View style={styles.alertTimeTag}>
                  <Clock size={14} color="#fff" />
                  <Text style={styles.alertTimeText}>
                    {item.alert_time ? 
                      `${parseInt(item.alert_time.slice(0, 2)) % 12 || 12}:${item.alert_time.slice(3, 5)} ${parseInt(item.alert_time.slice(0, 2)) >= 12 ? 'PM' : 'AM'}` 
                      : 'No time set'}
                  </Text>
                </View>
                <View style={styles.alertFrequencyTag}>
                  <Bell size={14} color="#fff" />
                  <Text style={styles.alertFrequencyText}>
                    {item.alert_frequency === 1 
                      ? 'Every hour'
                      : `Every ${item.alert_frequency} hours`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No users have enabled weather alerts</Text>
        )}
      />
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.sectionContainer}>
      <FlatList
        ListHeaderComponent={() => (
          <>
            
            
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupTitle}>User Role Management</Text>
              <View style={styles.searchContainer}>
                <Search size={20} color="#8e8e93" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users by name or email..."
                  placeholderTextColor="#8e8e93"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
          </>
        )}
        data={filteredUsers}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.settingsUserRow}
            onPress={() => {
              setSelectedUser(item);
              setShowRoleModal(true);
            }}
          >
            <View style={styles.settingsUserInfo}>
              <View style={styles.settingsUserMain}>
                <Text style={styles.settingsUserName}>{item.full_name}</Text>
                <Text style={styles.settingsUserEmail}>{item.email}</Text>
              </View>
              <View style={[
                styles.settingsRoleTag,
                {
                  backgroundColor: 
                    item.role === 'admin' ? '#ff375f' :
                    item.role === 'banned' ? '#ff453a' : '#32d74b'
                }
              ]}>
                <Text style={styles.settingsRoleText}>{item.role}</Text>
              </View>
            </View>
            <Text style={styles.settingsUserMeta}>
              Last active: {item.last_sign_in ? formatDate(item.last_sign_in) : 'Never'}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.settingsSeparator} />}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No users found</Text>
        )}
        ListFooterComponent={() => (
          <View style={styles.settingsGroup}>
            <Text style={styles.settingsGroupTitle}>App Settings</Text>
            <Text style={styles.comingSoon}>More settings coming soon...</Text>
          </View>
        )}
        contentContainerStyle={styles.settingsContent}
      />
    </View>
  );

  const fetchApiLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const { data, error } = await supabase
        .from('api_logs')
        .select(`
          *,
          profiles!api_logs_user_id_fkey (
            email,
            full_name
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      const logsWithUserInfo = data?.map(log => ({
        ...log,
        user_email: log.profiles?.email,
        user_name: log.profiles?.full_name
      })) || [];

      setApiLogs(logsWithUserInfo);
    } catch (error) {
      console.error('Error fetching API logs:', error);
      Alert.alert('Error', 'Failed to load API logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'api-logs') {
      fetchApiLogs();
    }
  }, [activeSection]);

  const renderApiLogsSection = () => {
    const getStatusColor = (status: number) => {
      if (status >= 200 && status < 300) return '#32d74b';
      if (status >= 300 && status < 400) return '#0a84ff';
      return '#ff453a';
    };

    const getMethodColor = (method: string) => {
      switch (method.toUpperCase()) {
        case 'GET': return '#32d74b';
        case 'POST': return '#0a84ff';
        case 'PUT': return '#ff9f0a';
        case 'DELETE': return '#ff453a';
        default: return '#8e8e93';
      }
    };

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>API Logs</Text>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#8e8e93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by user or endpoint..."
            placeholderTextColor="#8e8e93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isLoadingLogs ? (
          <ActivityIndicator size="large" color="#0a84ff" style={styles.logsLoading} />
        ) : (
          <FlatList
            data={apiLogs.filter(log => 
              log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              log.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={({ item }) => (
              <View style={styles.logRow}>
                <View style={styles.logHeader}>
                  <View style={styles.logUser}>
                    <Text style={styles.logUserName}>{item.user_name || 'Unknown User'}</Text>
                    <Text style={styles.logUserEmail}>{item.user_email || 'No email'}</Text>
                  </View>
                  <Text style={styles.logTimestamp}>
                    {format(new Date(item.timestamp), 'MMM d, HH:mm:ss')}
                  </Text>
                </View>
                
                <View style={styles.logDetails}>
                  <View style={[styles.logMethod, { backgroundColor: getMethodColor(item.method) }]}>
                    <Text style={styles.logMethodText}>{item.method}</Text>
                  </View>
                  <Text style={styles.logEndpoint}>{item.endpoint}</Text>
                  <View style={[styles.logStatus, { backgroundColor: getStatusColor(item.status_code) }]}>
                    <Text style={styles.logStatusText}>{item.status_code}</Text>
                  </View>
                </View>
                
                <View style={styles.logFooter}>
                  <Text style={styles.logResponseTime}>
                    Response time: {item.response_time.toFixed(2)}ms
                  </Text>
                </View>
              </View>
            )}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No API logs found</Text>
            )}
          />
        )}
      </View>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverviewSection();
      case 'users':
        return renderUsersSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'settings':
        return renderSettingsSection();
      case 'api-logs':
        return renderApiLogsSection();
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>

      <View style={styles.navbar}>
        <NavButton
          section="overview"
          icon={Home}
          label="Overview"
        />
        <NavButton
          section="users"
          icon={Users}
          label="Users"
        />
        <NavButton
          section="notifications"
          icon={Bell}
          label="Notifications"
        />
        <NavButton
          section="api-logs"
          icon={BarChart3}
          label="API Logs"
        />
        <NavButton
          section="settings"
          icon={Settings}
          label="Settings"
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a84ff" />
        </View>
      ) : (
        <View style={styles.mainContent}>
          {renderActiveSection()}
        </View>
      )}
      <RoleModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  statsGrid: {
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#3a3a3c',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  usersSection: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
  },
  usersList: {
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    padding: 4,
  },
  userRow: {
    padding: 12,
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
  },
  userInfo: {
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: '#8e8e93',
  },
  userMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  userMetaText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  separator: {
    height: 8,
  },
  emptyText: {
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 16,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#2c2c2e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  navButtonActive: {
    backgroundColor: '#3a3a3c',
  },
  navLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#0a84ff',
  },
  sectionContent: {
    padding: 16,
  },
  sectionContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  comingSoon: {
    color: '#8e8e93',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2c2c2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleOption: {
    backgroundColor: '#3a3a3c',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  roleOptionActive: {
    borderColor: '#0a84ff',
    borderWidth: 2,
  },
  roleOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleDescription: {
    color: '#8e8e93',
    fontSize: 14,
  },
  banOption: {
    backgroundColor: '#3a3a3c',
  },
  banText: {
    color: '#ff453a',
  },
  closeButton: {
    backgroundColor: '#3a3a3c',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsGroup: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 1,
    marginBottom: 20,
  },
  settingsGroupTitle: {
    fontSize: 25,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  settingsList: {
    maxHeight: 400,
  },
  settingsUserRow: {
    padding: 12,
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
  },
  settingsUserInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsUserMain: {
    flex: 1,
    marginRight: 12,
  },
  settingsUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  settingsUserEmail: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 2,
  },
  settingsUserMeta: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 8,
  },
  settingsRoleTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  settingsRoleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  settingsSeparator: {
    height: 8,
  },
  mainContent: {
    flex: 1,
  },
  settingsContent: {
    padding: 16,
  },
  alertUserRow: {
    padding: 12,
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
  },
  alertUserInfo: {
    gap: 4,
  },
  alertUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  alertUserEmail: {
    fontSize: 14,
    color: '#8e8e93',
  },
  alertMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  alertTimeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a84ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  alertTimeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  alertFrequencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#32d74b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  alertFrequencyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  logsLoading: {
    marginTop: 20,
  },
  logRow: {
    padding: 12,
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logUser: {
    flex: 1,
  },
  logUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logUserEmail: {
    fontSize: 12,
    color: '#8e8e93',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#8e8e93',
    marginLeft: 8,
  },
  logDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  logMethod: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logMethodText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logEndpoint: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  logStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  logResponseTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
  statSuffix: {
    fontSize: 14,
    color: '#8e8e93',
    marginLeft: 2,
  },
  overviewContainer: {
    flex: 1,
  },
  overviewSection: {
    marginBottom: 24,
    padding: 16,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  overviewSubtitle: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statDescription: {
    fontSize: 14,
    color: '#8e8e93',
  },
}); 