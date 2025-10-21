import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, UserCheck, UserX, Activity, Calendar, Mail, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  custom_user_id: string;
  avatar_url: string;
  organization: string;
  user_type: string;
  status: string;
  last_login: string;
  admin_notes: string;
  created_at: string;
}

interface UserAdminPanelProps {
  onLogout: () => void;
  adminUserId: string;
}

const UserAdminPanel = ({ onLogout, adminUserId }: UserAdminPanelProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [searchQuery, statusFilter]);

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'ngo')
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,custom_user_id.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user: Profile) => {
    setSelectedUser(user);
    setAdminNotes(user.admin_notes || "");
  };

  const updateUserStatus = async (status: string) => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: status,
          admin_notes: adminNotes,
          managed_by: adminUserId
        })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        _admin_user_id: adminUserId,
        _admin_role: 'user_admin',
        _target_user_id: selectedUser.user_id,
        _action: `user_status_changed_to_${status}`,
        _details: { notes: adminNotes }
      });

      toast({
        title: "Success",
        description: `User status updated to ${status}`,
      });

      // Refresh data
      loadUsers();
      setSelectedUser({ ...selectedUser, status, admin_notes: adminNotes });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const suspended = users.filter(u => u.status === 'suspended').length;
    const pending = users.filter(u => u.status === 'pending').length;
    
    return { total, active, suspended, pending };
  };

  const stats = getUserStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-0 rounded-none">
        <div className="container mx-auto flex items-center justify-between px-[23px] py-[2px] rounded-none">
          <div className="flex items-center">
            <h1 className="funnel-display-bold text-xl text-primary">User Admin Panel</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              User Admin
            </Badge>
            <Button variant="outline" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="funnel-display-medium text-sm text-muted-foreground">Total Users</p>
                  <p className="funnel-display-bold text-2xl text-primary">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="funnel-display-medium text-sm text-muted-foreground">Active Users</p>
                  <p className="funnel-display-bold text-2xl text-success">{stats.active}</p>
                </div>
                <UserCheck className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="funnel-display-medium text-sm text-muted-foreground">Suspended</p>
                  <p className="funnel-display-bold text-2xl text-destructive">{stats.suspended}</p>
                </div>
                <UserX className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="funnel-display-medium text-sm text-muted-foreground">Pending</p>
                  <p className="funnel-display-bold text-2xl text-orange-600">{stats.pending}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Users List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="funnel-display-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Management
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => selectUser(user)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="funnel-display-medium text-sm font-medium truncate">
                            {user.display_name || 'No name'}
                          </p>
                          <p className="funnel-display-normal text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                          <p className="funnel-display-normal text-xs text-muted-foreground">
                            ID: {user.custom_user_id}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge 
                            className={
                              user.status === 'active' ? 'bg-success text-success-foreground' :
                              user.status === 'suspended' ? 'bg-destructive text-destructive-foreground' :
                              'bg-orange-100 text-orange-700'
                            }
                          >
                            {user.status || 'active'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Details */}
          <div className="space-y-6">
            {selectedUser ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="funnel-display-semibold">User Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarImage src={selectedUser.avatar_url} />
                        <AvatarFallback className="text-lg">
                          {selectedUser.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="funnel-display-semibold text-lg">
                        {selectedUser.display_name || 'No name'}
                      </h3>
                      <p className="funnel-display-normal text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="funnel-display-normal text-sm">
                          Joined: {new Date(selectedUser.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="funnel-display-normal text-sm">
                          Org: {selectedUser.organization || 'None'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="funnel-display-normal text-sm">
                          User ID: {selectedUser.custom_user_id}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="funnel-display-semibold">Admin Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="funnel-display-medium text-sm mb-2 block">
                        Admin Notes
                      </label>
                      <Textarea
                        placeholder="Add notes about this user..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => updateUserStatus('active')}
                        className="w-full bg-success hover:bg-success/90 text-white"
                        disabled={selectedUser.status === 'active'}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate User
                      </Button>
                      <Button
                        onClick={() => updateUserStatus('suspended')}
                        variant="destructive"
                        className="w-full"
                        disabled={selectedUser.status === 'suspended'}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Suspend User
                      </Button>
                      <Button
                        onClick={() => updateUserStatus('pending')}
                        variant="outline"
                        className="w-full"
                        disabled={selectedUser.status === 'pending'}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Mark as Pending
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="funnel-display-semibold text-lg mb-2">No User Selected</h3>
                    <p className="funnel-display-normal text-muted-foreground">
                      Select a user from the list to view details and manage their account.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserAdminPanel;