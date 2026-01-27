// Admin Service - Handles admin operations for user management and messaging
import { supabase } from '@/integrations/supabase/client';

export interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  display_name: string | null;
  role: 'admin' | 'soc' | 'user';
  monitoring_count: number;
  alerts_count: number;
  search_count: number;
  last_active: string | null;
}

export interface AdminMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  updated_at: string;
  from_user_email?: string;
  to_user_email?: string;
}

// Get current user role
export async function getCurrentUserRole(): Promise<'admin' | 'soc' | 'user'> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'user';

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return 'user';
    return data.role as 'admin' | 'soc' | 'user';
  } catch (error) {
    console.error('[AdminService] Error checking user role:', error);
    return 'user';
  }
}

// Check if current user is admin (legacy support)
export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'admin';
}

// Get all users with their profiles and stats
export async function getAllUsers(): Promise<UserWithProfile[]> {
  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) throw profilesError;

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    // Get monitoring counts per user
    const { data: monitoringCounts, error: monitoringError } = await supabase
      .from('monitoring_items')
      .select('user_id');

    // Get search counts per user
    const { data: searchCounts, error: searchError } = await supabase
      .from('search_history')
      .select('user_id');

    // Get alerts counts per user
    const { data: alertsCounts, error: alertsError } = await supabase
      .from('monitoring_alerts')
      .select('user_id');

    // Get user sessions for last active
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('user_id, last_active_at')
      .order('last_active_at', { ascending: false });

    // Build the users array
    const users: UserWithProfile[] = (profiles || []).map(profile => {
      const userRoleEntry = roles?.find(r => r.user_id === profile.user_id);
      const userRole = (userRoleEntry?.role as 'admin' | 'soc' | 'user') || 'user';
      
      const userMonitoring = monitoringCounts?.filter(m => m.user_id === profile.user_id) || [];
      const userSearches = searchCounts?.filter(s => s.user_id === profile.user_id) || [];
      const userAlerts = alertsCounts?.filter(a => a.user_id === profile.user_id) || [];
      const userSession = sessions?.find(s => s.user_id === profile.user_id);

      return {
        id: profile.user_id,
        email: profile.email || 'Unknown',
        created_at: profile.created_at,
        display_name: profile.display_name,
        role: userRole,
        monitoring_count: userMonitoring.length,
        alerts_count: userAlerts.length,
        search_count: userSearches.length,
        last_active: userSession?.last_active_at || null,
      };
    });

    return users;
  } catch (error) {
    console.error('[AdminService] Error getting users:', error);
    return [];
  }
}

const PROTECTED_ADMIN_EMAILS = [
  'sagnik.saha.raptor@gmail.com',
  'tathastuagarwala26@gmail.com',
  'souvikpanja582@gmail.com'
];

// Update user role
export async function updateUserRole(userId: string, role: 'admin' | 'soc' | 'user'): Promise<boolean> {
  try {
    // Check if target user is a protected admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (profile && PROTECTED_ADMIN_EMAILS.includes(profile.email)) {
      console.warn('[AdminService] Cannot change role of protected admin:', profile.email);
      return false;
    }

    // If role is 'user', we remove the entry from user_roles
    if (role === 'user') {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      return !error;
    }

    // Otherwise upsert the new role
    const { error } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: userId, 
        role: role 
      }, { 
        onConflict: 'user_id' // Assuming user_id is unique or part of PK, but standard logic is one role per user here
      });
      // Note: If user_roles table allows multiple roles, we should delete others first. 
      // But based on previous schema, it seems designed for single role or we treat it as such.
      // Let's ensure we clean up if needed, but upsert is fine if (user_id, role) is PK or user_id is unique.
      // Wait, migration 20260117163945 defines PK as (user_id, role).
      // So a user COULD have multiple roles. 
      // To implement strict single role (Admin OR SOC OR User), we should delete all roles for this user first, then insert the new one.
      
      if (role !== 'user') {
        // Delete existing roles first to enforce single role policy
        await supabase.from('user_roles').delete().eq('user_id', userId);
        
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: role });
          
        return !insertError;
      }
      
    return !error;
  } catch (error) {
    console.error('[AdminService] Error updating user role:', error);
    return false;
  }
}

// Make a user an admin (legacy wrapper)
export async function makeUserAdmin(userId: string): Promise<boolean> {
  return updateUserRole(userId, 'admin');
}

// Remove admin role from user (legacy wrapper)
export async function removeAdminRole(userId: string): Promise<boolean> {
  return updateUserRole(userId, 'user');
}

// Send message to user's monitoring section
export async function sendAdminMessage(
  toUserId: string, 
  title: string, 
  message: string,
  severity: 'info' | 'warning' | 'critical' = 'info'
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('admin_messages')
      .insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        title,
        message,
        severity,
      });

    return !error;
  } catch (error) {
    console.error('[AdminService] Error sending message:', error);
    return false;
  }
}

// Get messages for current user (to display in their monitoring section)
export async function getMyAdminMessages(): Promise<AdminMessage[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get sender emails
    const fromUserIds = [...new Set((data || []).map(m => m.from_user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', fromUserIds);

    return (data || []).map(msg => ({
      ...msg,
      severity: msg.severity as 'info' | 'warning' | 'critical',
      from_user_email: profiles?.find(p => p.user_id === msg.from_user_id)?.email || 'Admin',
    }));
  } catch (error) {
    console.error('[AdminService] Error getting messages:', error);
    return [];
  }
}

// Get unread message count for current user
export async function getUnreadMessageCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('admin_messages')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', user.id)
      .eq('is_read', false);

    return error ? 0 : (count || 0);
  } catch (error) {
    console.error('[AdminService] Error getting unread count:', error);
    return 0;
  }
}

// Mark message as read
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    return !error;
  } catch (error) {
    console.error('[AdminService] Error marking message as read:', error);
    return false;
  }
}

// Get all messages sent by admin (for admin to view)
export async function getSentMessages(): Promise<AdminMessage[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get recipient emails
    const toUserIds = [...new Set((data || []).map(m => m.to_user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', toUserIds);

    return (data || []).map(msg => ({
      ...msg,
      severity: msg.severity as 'info' | 'warning' | 'critical',
      to_user_email: profiles?.find(p => p.user_id === msg.to_user_id)?.email || 'Unknown User',
    }));
  } catch (error) {
    console.error('[AdminService] Error getting sent messages:', error);
    return [];
  }
}
