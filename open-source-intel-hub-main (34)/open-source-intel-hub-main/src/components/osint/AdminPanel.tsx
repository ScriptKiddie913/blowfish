import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import { AdminDebugPanel } from '@/components/osint/AdminDebugPanel';
import { CredentialSearchPanel } from '@/components/osint/CredentialSearchPanel';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldX,
  MessageSquare,
  Send,
  Eye,
  Search,
  Bell,
  Clock,
  Mail,
  AlertTriangle,
  Info,
  AlertCircle,
  Loader2,
  RefreshCw,
  Crown,
  UserCheck,
  Activity,
  Database,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  Plus,
  Lock,
  Unlock,
  EyeOff,
  Edit,
  Save,
  X,
  Key
} from 'lucide-react';
import {
  getAllUsers,
  updateUserRole,
  isCurrentUserAdmin,
  getSentMessages,
  sendAdminMessage,
  removeAdminRole,
  makeUserAdmin,
  type UserWithProfile,
  type AdminMessage,
} from '@/services/adminService';
import {
  getBreachDatasets,
  createBreachDataset,
  deleteBreachDataset,
  addBreachEntries,
  getAccessRequests,
  updateAccessStatus,
  getEntriesForDataset,
  updateBreachEntry,
  deleteBreachEntry,
  type BreachDataset,
  type AccessRequest,
  type BreachEntry
} from '@/services/breachService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const PROTECTED_ADMIN_EMAILS = [
  'sagnik.saha.raptor@gmail.com',
  'tathastuagarwala26@gmail.com',
  'souvikpanja582@gmail.com'
];

export function AdminPanel() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [sentMessages, setSentMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Breach Management State
  const [datasets, setDatasets] = useState<BreachDataset[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  
  // Dataset Editing State
  const [selectedDataset, setSelectedDataset] = useState<BreachDataset | null>(null);
  const [datasetEntries, setDatasetEntries] = useState<BreachEntry[]>([]);
  const [isEditingDataset, setIsEditingDataset] = useState(false);
  const [newEntryUrl, setNewEntryUrl] = useState('');
  const [newEntryEmail, setNewEntryEmail] = useState('');
  const [newEntryPass, setNewEntryPass] = useState('');

  // Create Dataset State
  const [newDatasetTitle, setNewDatasetTitle] = useState('');
  const [newDatasetDesc, setNewDatasetDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Message form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageSeverity, setMessageSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const adminStatus = await isCurrentUserAdmin();
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        await loadData();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load admin panel';
      setError(errorMessage);
      console.error('Admin panel error:', err);
    }
    setLoading(false);
  };

  const loadData = async () => {
    try {
      // Parallel fetching sometimes fails if one request errors.
      // Let's make them independent for better robustness.
      const usersData = await getAllUsers().catch(e => { console.error(e); return []; });
      const messagesData = await getSentMessages().catch(e => { console.error(e); return []; });
      const datasetsData = await getBreachDatasets().catch(e => { console.error(e); return []; });
      const requestsData = await getAccessRequests().catch(e => { console.error(e); return []; });

      setUsers(usersData);
      setSentMessages(messagesData);
      setDatasets(datasetsData);
      setAccessRequests(requestsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Data loading error:', err);
    }
  };

  // ... (Role Update and Message Logic)

  const handleCreateDataset = async () => {
    if (!newDatasetTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setIsCreating(true);
    try {
      const dataset = await createBreachDataset(newDatasetTitle, newDatasetDesc);
      if (dataset) {
        toast.success('Dataset created');
        setNewDatasetTitle('');
        setNewDatasetDesc('');
        await loadData();
        // Automatically open for editing
        handleEditDataset(dataset);
      } else {
        throw new Error('Failed to create');
      }
    } catch (err) {
      toast.error('Failed to create dataset');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (confirm('Are you sure? This will delete all entries in this dataset.')) {
      const success = await deleteBreachDataset(id);
      if (success) {
        toast.success('Dataset deleted');
        setDatasets(prev => prev.filter(d => d.id !== id));
        if (selectedDataset?.id === id) {
          setIsEditingDataset(false);
          setSelectedDataset(null);
        }
      } else {
        toast.error('Failed to delete dataset');
      }
    }
  };

  const handleEditDataset = async (dataset: BreachDataset) => {
    setSelectedDataset(dataset);
    setIsEditingDataset(true);
    const entries = await getEntriesForDataset(dataset.id);
    setDatasetEntries(entries);
  };

  const handleAddEntry = async () => {
    if (!selectedDataset) return;
    if (!newEntryUrl && !newEntryEmail) {
      toast.error('URL or Email/Username is required');
      return;
    }

    const newEntry = {
      dataset_id: selectedDataset.id,
      url: newEntryUrl,
      email: newEntryEmail,
      password: newEntryPass
    };

    const success = await addBreachEntries([newEntry]);
    if (success) {
      toast.success('Entry added');
      setNewEntryUrl('');
      setNewEntryEmail('');
      setNewEntryPass('');
      // Reload entries
      const entries = await getEntriesForDataset(selectedDataset.id);
      setDatasetEntries(entries);
    } else {
      toast.error('Failed to add entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const success = await deleteBreachEntry(id);
    if (success) {
      setDatasetEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } else {
      toast.error('Failed to delete entry');
    }
  };

  const handleAccessRequest = async (id: string, status: 'approved' | 'rejected' | 'revoked') => {
    const success = await updateAccessStatus(id, status);
    if (success) {
      toast.success(`Request ${status}`);
      setAccessRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } else {
      toast.error('Failed to update request');
    }
  };

  // ... (Role Update Logic)

  const handleRoleUpdate = async (user: UserWithProfile, newRole: 'admin' | 'soc' | 'user') => {
    if (user.role === newRole) return;
    
    const success = await updateUserRole(user.id, newRole);
    if (success) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success(`Updated ${user.email} role to ${newRole.toUpperCase()}`);
    } else {
      toast.error('Failed to update user role');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUserId || !messageTitle.trim() || !messageContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSendingMessage(true);
    const success = await sendAdminMessage(selectedUserId, messageTitle, messageContent, messageSeverity);
    
    if (success) {
      toast.success('Message sent to user monitoring section');
      setMessageDialogOpen(false);
      setMessageTitle('');
      setMessageContent('');
      setMessageSeverity('info');
      setSelectedUserId('');
      // Reload sent messages
      const messages = await getSentMessages();
      setSentMessages(messages);
    } else {
      toast.error('Failed to send message');
    }
    setSendingMessage(false);
  };

  const openMessageDialog = (userId: string) => {
    setSelectedUserId(userId);
    setMessageDialogOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <ShieldX className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground text-center">
          You do not have administrator privileges to access this section.
        </p>
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage users, roles, and send monitoring messages</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 font-medium">Error</span>
          </div>
          <p className="text-red-400 text-sm mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setError(null)}
            className="mt-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Crown className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'soc').length}</p>
                <p className="text-sm text-muted-foreground">SOC Analysts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sentMessages.length}</p>
                <p className="text-sm text-muted-foreground">Messages Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.reduce((acc, u) => acc + u.monitoring_count, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Monitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-primary">
            <MessageSquare className="h-4 w-4 mr-2" />
            Sent Messages
          </TabsTrigger>
          <TabsTrigger value="breaches" className="data-[state=active]:bg-primary">
            <Database className="h-4 w-4 mr-2" />
            Breach Data
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-primary">
            <Lock className="h-4 w-4 mr-2" />
            Access Requests
            {accessRequests.filter(r => r.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {accessRequests.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="credential-search" className="data-[state=active]:bg-red-600">
            <Key className="h-4 w-4 mr-2" />
            Credential Search
          </TabsTrigger>
          <TabsTrigger value="debug" className="data-[state=active]:bg-primary">
            <Crown className="h-4 w-4 mr-2" />
            Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          {/* Users List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user roles and send messages to their monitoring section</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="p-4 rounded-lg border bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            user.role === 'admin' ? "bg-yellow-500/20" : 
                            user.role === 'soc' ? "bg-blue-500/20" : "bg-primary/10"
                          )}>
                            {user.role === 'admin' ? (
                              <Crown className="h-5 w-5 text-yellow-400" />
                            ) : user.role === 'soc' ? (
                              <ShieldCheck className="h-5 w-5 text-blue-400" />
                            ) : (
                              <Users className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{user.email}</h4>
                              {user.role === 'admin' && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  Admin
                                </Badge>
                              )}
                              {user.role === 'soc' && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  SOC
                                </Badge>
                              )}
                            </div>
                            {user.display_name && (
                              <p className="text-sm text-muted-foreground">{user.display_name}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {user.monitoring_count} monitors
                              </span>
                              <span className="flex items-center gap-1">
                                <Bell className="h-3 w-3" />
                                {user.alerts_count} alerts
                              </span>
                              <span className="flex items-center gap-1">
                                <Search className="h-3 w-3" />
                                {user.search_count} searches
                              </span>
                              {user.last_active && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(user.last_active), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMessageDialog(user.id)}
                            className="text-primary border-primary/30 hover:bg-primary/10"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Select 
                            value={user.role} 
                            onValueChange={(val: 'admin' | 'soc' | 'user') => handleRoleUpdate(user, val)}
                            disabled={PROTECTED_ADMIN_EMAILS.includes(user.email)}
                          >
                            <SelectTrigger className={cn(
                              "w-[140px] h-9",
                              user.role === 'admin' ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                              user.role === 'soc' ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                              "border-slate-700 bg-slate-800"
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" /> User
                                </div>
                              </SelectItem>
                              <SelectItem value="soc">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-blue-400" /> SOC
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4 text-yellow-400" /> Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Sent Messages</CardTitle>
              <CardDescription>Messages you've sent to users' monitoring sections</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {sentMessages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          msg.severity === 'critical' ? "bg-red-500/5 border-red-500/20" :
                          msg.severity === 'warning' ? "bg-yellow-500/5 border-yellow-500/20" :
                          "bg-slate-800/30 border-slate-700"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            msg.severity === 'critical' ? "bg-red-500/20" :
                            msg.severity === 'warning' ? "bg-yellow-500/20" : "bg-blue-500/20"
                          )}>
                            {msg.severity === 'critical' ? (
                              <AlertCircle className="h-4 w-4 text-red-400" />
                            ) : msg.severity === 'warning' ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            ) : (
                              <Info className="h-4 w-4 text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{msg.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn(
                                  msg.severity === 'critical' ? "text-red-400 border-red-500/30" :
                                  msg.severity === 'warning' ? "text-yellow-400 border-yellow-500/30" :
                                  "text-blue-400 border-blue-500/30"
                                )}>
                                  {msg.severity}
                                </Badge>
                                {msg.is_read && (
                                  <Badge variant="outline" className="text-green-400 border-green-500/30">
                                    Read
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                To: {msg.to_user_email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaches" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Manage Breach Datasets</CardTitle>
              <CardDescription>Create datasets and manage breach entries manually</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditingDataset && selectedDataset ? (
                <div className="space-y-6">
                  {/* Edit Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => setIsEditingDataset(false)}>
                        Back
                      </Button>
                      <h3 className="font-semibold text-lg">{selectedDataset.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary/30">
                      Editing Mode
                    </Badge>
                  </div>

                  {/* Add Entry Form */}
                  <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/30">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-400" />
                      Add New Entry
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <Input 
                        placeholder="URL / Website" 
                        value={newEntryUrl}
                        onChange={e => setNewEntryUrl(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                      <Input 
                        placeholder="Email / Username" 
                        value={newEntryEmail}
                        onChange={e => setNewEntryEmail(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                      <Input 
                        placeholder="Password" 
                        value={newEntryPass}
                        onChange={e => setNewEntryPass(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <Button onClick={handleAddEntry} className="w-full bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" /> Add Entry
                    </Button>
                  </div>

                  {/* Entries Table */}
                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-800">
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>Email/User</TableHead>
                          <TableHead>Password</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datasetEntries.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-mono text-xs">{entry.url}</TableCell>
                            <TableCell>{entry.email}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {entry.password}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {datasetEntries.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No entries found. Add one above.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Create Form */}
                  <div className="col-span-1 space-y-4 p-4 border border-slate-700 rounded-lg bg-slate-800/30 h-fit">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" />
                      Create Dataset
                    </h3>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input 
                        placeholder="e.g., Comb2024 Leak" 
                        value={newDatasetTitle}
                        onChange={e => setNewDatasetTitle(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Details about this dataset..." 
                        value={newDatasetDesc}
                        onChange={e => setNewDatasetDesc(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <Button 
                      onClick={handleCreateDataset} 
                      disabled={isCreating}
                      className="w-full bg-primary"
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Create & Start Adding
                    </Button>
                  </div>

                  {/* Datasets List */}
                  <div className="col-span-2 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      Existing Datasets
                    </h3>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {datasets.map(dataset => (
                          <div key={dataset.id} className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-lg">{dataset.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{dataset.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                                    <FileText className="h-3 w-3" />
                                    {dataset.entry_count} entries
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditDataset(dataset)}
                                  className="text-primary border-primary/30 hover:bg-primary/10"
                                >
                                  <Edit className="h-4 w-4 mr-2" /> Manage Data
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteDataset(dataset.id)}
                                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {datasets.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground border border-dashed border-slate-700 rounded-lg">
                            <Database className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p>No datasets found</p>
                            <p className="text-xs">Create one to get started</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Access Requests</CardTitle>
              <CardDescription>Manage SOC analyst access to breach datasets</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {accessRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-400" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accessRequests.map(req => (
                      <div key={req.id} className="p-4 rounded-lg border border-slate-700 bg-slate-800/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              req.status === 'pending' ? "bg-yellow-500/10" :
                              req.status === 'approved' ? "bg-green-500/10" : "bg-red-500/10"
                            )}>
                              {req.status === 'pending' ? <Lock className="h-4 w-4 text-yellow-400" /> :
                               req.status === 'approved' ? <Unlock className="h-4 w-4 text-green-400" /> :
                               <ShieldX className="h-4 w-4 text-red-400" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{req.user_email}</h4>
                                <Badge variant="outline" className={cn(
                                  req.status === 'pending' ? "text-yellow-400 border-yellow-500/30" :
                                  req.status === 'approved' ? "text-green-400 border-green-500/30" :
                                  "text-red-400 border-red-500/30"
                                )}>
                                  {req.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Requested access to: <span className="text-primary">{req.dataset_title}</span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(req.requested_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {req.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAccessRequest(req.id, 'approved')}
                                  className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAccessRequest(req.id, 'rejected')}
                                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                                >
                                  <XCircle className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {req.status === 'approved' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleAccessRequest(req.id, 'revoked')}
                                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                              >
                                <EyeOff className="h-4 w-4 mr-1" /> Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug">
          <AdminDebugPanel />
        </TabsContent>

        <TabsContent value="credential-search">
          <CredentialSearchPanel showExport={true} maxHeight="600px" />
        </TabsContent>
      </Tabs>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Send Message to User
            </DialogTitle>
            <DialogDescription>
              This message will appear in the user's monitoring section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Message title..."
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={messageSeverity} onValueChange={(v: any) => setMessageSeverity(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-400" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Enter your message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="bg-slate-800 border-slate-700 min-h-[100px]"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              className="w-full bg-primary"
              disabled={sendingMessage}
            >
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
