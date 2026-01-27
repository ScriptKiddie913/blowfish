import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Pause,
  Play,
  Bell,
  BellOff,
  Eye,
  Globe,
  Mail,
  Hash,
  User,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  Settings,
  MessageSquare,
  Key,
} from 'lucide-react';
import {
  getMonitoringItems,
  addMonitoringItem,
  deleteMonitoringItem,
  pauseMonitoringItem,
  resumeMonitoringItem,
  getMonitoringAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  type MonitoringItem,
  type MonitoringAlert,
} from '@/services/userDataService';
import { getMyAdminMessages, markMessageAsRead, type AdminMessage } from '@/services/adminService';
import { 
  getBreachDatasets, 
  requestAccess, 
  getDatasetAccessStatus,
  getEntriesForDataset,
  type BreachDataset,
  type BreachEntry
} from '@/services/breachService';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CredentialSearchPanel } from '@/components/osint/CredentialSearchPanel';
import { getCurrentUserRole } from '@/services/adminService';

const MONITOR_TYPES = [
  { value: 'domain', label: 'Domain', icon: Globe },
  { value: 'ip', label: 'IP Address', icon: Shield },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'keyword', label: 'Keyword', icon: Hash },
  { value: 'username', label: 'Username', icon: User },
  { value: 'hash', label: 'File Hash', icon: Hash },
  { value: 'cve', label: 'CVE ID', icon: AlertTriangle },
];

const ALERT_THRESHOLDS = [
  { value: 'any', label: 'Any detection' },
  { value: 'high', label: 'High severity only' },
  { value: 'critical', label: 'Critical only' },
];

export function MonitoringDashboard() {
  const [items, setItems] = useState<MonitoringItem[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [breachDatasets, setBreachDatasets] = useState<(BreachDataset & { status?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'soc' | 'user'>('user');
  
  // Breach Viewing State
  const [viewingDataset, setViewingDataset] = useState<BreachDataset | null>(null);
  const [datasetEntries, setDatasetEntries] = useState<BreachEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('domain');
  const [newValue, setNewValue] = useState('');
  const [newThreshold, setNewThreshold] = useState('any');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // Check user role
    getCurrentUserRole().then(role => setUserRole(role));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, alertsData, messagesData, breachesData] = await Promise.all([
        getMonitoringItems(),
        getMonitoringAlerts(),
        getMyAdminMessages(),
        getBreachDatasets()
      ]);
      setItems(itemsData);
      setAlerts(alertsData);
      setAdminMessages(messagesData);
      
      // Load status for each dataset
      const datasetsWithStatus = await Promise.all(breachesData.map(async (d) => {
        const status = await getDatasetAccessStatus(d.id);
        return { ...d, status };
      }));
      setBreachDatasets(datasetsWithStatus);

    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (id: string) => {
    // With new auto-approve logic, this is just "Get Access"
    // Optimistic update
    setBreachDatasets(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d));
    
    const success = await requestAccess(id);
    if (success) {
      toast.success('Access granted');
    } else {
      toast.error('Failed to grant access');
      // Revert on failure
      setBreachDatasets(prev => prev.map(d => d.id === id ? { ...d, status: 'none' } : d));
    }
  };

  const handleViewDataset = async (dataset: BreachDataset) => {
    setViewingDataset(dataset);
    setEntriesLoading(true);
    setDatasetEntries([]);
    try {
      const entries = await getEntriesForDataset(dataset.id);
      setDatasetEntries(entries);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load entries');
    } finally {
      setEntriesLoading(false);
    }
  };

  const handleMarkMessageRead = async (id: string) => {
    const success = await markMessageAsRead(id);
    if (success) {
      setAdminMessages(prev => prev.map(m => 
        m.id === id ? { ...m, is_read: true } : m
      ));
      toast.success('Message marked as read');
    }
  };

  const handleAddItem = async () => {
    if (!newName.trim() || !newValue.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const item = await addMonitoringItem(newName, newType, newValue, newThreshold);
      if (item) {
        setItems(prev => [item, ...prev]);
        toast.success('Monitoring item added');
        setAddDialogOpen(false);
        setNewName('');
        setNewValue('');
        setNewType('domain');
        setNewThreshold('any');
      } else {
        toast.error('Failed to add monitoring item');
      }
    } catch (error) {
      toast.error('Failed to add monitoring item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteMonitoringItem(id);
    if (success) {
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Monitoring item removed');
    } else {
      toast.error('Failed to remove item');
    }
  };

  const handleTogglePause = async (item: MonitoringItem) => {
    const success = item.status === 'active'
      ? await pauseMonitoringItem(item.id)
      : await resumeMonitoringItem(item.id);
    
    if (success) {
      setItems(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, status: item.status === 'active' ? 'paused' : 'active' }
          : i
      ));
      toast.success(`Monitoring ${item.status === 'active' ? 'paused' : 'resumed'}`);
    }
  };

  const handleMarkAllRead = async () => {
    const success = await markAllAlertsAsRead();
    if (success) {
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      toast.success('All alerts marked as read');
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length + adminMessages.filter(m => !m.is_read).length;
  const activeCount = items.filter(i => i.status === 'active').length;

  const getTypeIcon = (type: string) => {
    const typeConfig = MONITOR_TYPES.find(t => t.value === type);
    return typeConfig?.icon || Globe;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Track domains, IPs, emails, and more for threats</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Monitor
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle>Add Monitoring Item</DialogTitle>
                <DialogDescription>
                  Track a new indicator for threat detection
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="My Company Domain"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {MONITOR_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value to Monitor</Label>
                  <Input
                    placeholder={newType === 'domain' ? 'example.com' : newType === 'email' ? 'user@example.com' : 'Enter value...'}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alert Threshold</Label>
                  <Select value={newThreshold} onValueChange={setNewThreshold}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {ALERT_THRESHOLDS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAddItem} 
                  className="w-full bg-primary"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Monitor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{items.length}</p>
                <p className="text-sm text-muted-foreground">Total Monitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Bell className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Unread Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alerts.length + adminMessages.length}</p>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitoring Items */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Monitored Items
            </CardTitle>
            <CardDescription>Your active monitoring targets</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No monitoring items yet</p>
                  <p className="text-sm">Add your first monitor to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => {
                    const TypeIcon = getTypeIcon(item.monitor_type);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          item.status === 'active'
                            ? "bg-slate-800/50 border-slate-700"
                            : "bg-slate-800/20 border-slate-800 opacity-60"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <TypeIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground font-mono">{item.value}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.monitor_type}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs",
                                    item.status === 'active' ? "text-green-400 border-green-500/30" : "text-yellow-400 border-yellow-500/30"
                                  )}
                                >
                                  {item.status}
                                </Badge>
                                {item.alerts_count > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {item.alerts_count} alerts
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePause(item)}
                            >
                              {item.status === 'active' ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Alerts & Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {alerts.length === 0 && adminMessages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-400" />
                    <p>No alerts</p>
                    <p className="text-sm">You're all clear!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Admin Messages */}
                    {adminMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          !msg.is_read
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-slate-800/30 border-slate-700"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            <MessageSquare className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{msg.title}</h4>
                              {!msg.is_read && (
                                <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">Admin Message</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{msg.from_user_email}</span>
                                <span className="text-slate-600">•</span>
                                <Clock className="h-3 w-3" />
                                <span>{new Date(msg.created_at).toLocaleString()}</span>
                              </div>
                              {!msg.is_read && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs"
                                  onClick={() => handleMarkMessageRead(msg.id)}
                                >
                                  Mark as read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* System Alerts */}
                    {alerts.map(alert => (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          !alert.is_read
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-slate-800/30 border-slate-700"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-red-500/20">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{alert.type}</h4>
                              {!alert.is_read && (
                                <Badge className="bg-red-500 hover:bg-red-600 text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(alert.created_at).toLocaleString()}</span>
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

          {/* Recent Breaches */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Recent Breaches
              </CardTitle>
              <CardDescription>Available breach datasets for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {breachDatasets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No datasets available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {breachDatasets.map(dataset => (
                      <div key={dataset.id} className="p-3 rounded-lg border border-slate-700 bg-slate-800/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{dataset.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dataset.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {dataset.status === 'approved' ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Access Granted</Badge>
                              ) : dataset.status === 'revoked' ? (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Access Revoked</Badge>
                              ) : null}
                            </div>
                          </div>
                          
                          {dataset.status === 'approved' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewDataset(dataset)}
                              className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                            >
                              <Eye className="h-4 w-4 mr-2" /> View Data
                            </Button>
                          ) : dataset.status === 'revoked' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRequestAccess(dataset.id)}
                              className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                            >
                              Re-Gain Access
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRequestAccess(dataset.id)}
                              className="text-primary border-primary/30 hover:bg-primary/10"
                            >
                              Get Access
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credential Search - Only for SOC and Admin */}
      {(userRole === 'soc' || userRole === 'admin') && (
        <div className="mt-6">
          <CredentialSearchPanel showExport={true} maxHeight="500px" />
        </div>
      )}
      
      {/* View Data Dialog */}
      <Dialog open={!!viewingDataset} onOpenChange={(open) => !open && setViewingDataset(null)}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingDataset?.title}</DialogTitle>
            <DialogDescription>{viewingDataset?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden border border-slate-700 rounded-lg mt-4">
            {entriesLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader className="bg-slate-800 sticky top-0">
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Email/User</TableHead>
                      <TableHead>Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasetEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">{entry.url}</TableCell>
                        <TableCell>{entry.email}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{entry.password}</TableCell>
                      </TableRow>
                    ))}
                    {datasetEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No entries found in this dataset.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
