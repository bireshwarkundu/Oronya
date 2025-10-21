import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building, CheckCircle, XCircle, TrendingUp, Users, Calendar, Mail, Globe } from "lucide-react";
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

interface CompanyAdminPanelProps {
  onLogout: () => void;
  adminUserId: string;
}

const CompanyAdminPanel = ({ onLogout, adminUserId }: CompanyAdminPanelProps) => {
  const [companies, setCompanies] = useState<Profile[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
  }, [searchQuery, statusFilter]);

  const loadCompanies = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'company')
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,organization.ilike.%${searchQuery}%,custom_user_id.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company: Profile) => {
    setSelectedCompany(company);
    setAdminNotes(company.admin_notes || "");
  };

  const updateCompanyStatus = async (status: string) => {
    if (!selectedCompany) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: status,
          admin_notes: adminNotes,
          managed_by: adminUserId
        })
        .eq('user_id', selectedCompany.user_id);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        _admin_user_id: adminUserId,
        _admin_role: 'company_admin',
        _target_user_id: selectedCompany.user_id,
        _action: `company_status_changed_to_${status}`,
        _details: { notes: adminNotes }
      });

      toast({
        title: "Success",
        description: `Company status updated to ${status}`,
      });

      // Refresh data
      loadCompanies();
      setSelectedCompany({ ...selectedCompany, status, admin_notes: adminNotes });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "Failed to update company status",
        variant: "destructive",
      });
    }
  };

  const getCompanyStats = () => {
    const total = companies.length;
    const verified = companies.filter(c => c.status === 'verified').length;
    const pending = companies.filter(c => c.status === 'pending').length;
    const suspended = companies.filter(c => c.status === 'suspended').length;
    
    return { total, verified, pending, suspended };
  };

  const stats = getCompanyStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-0 rounded-none">
        <div className="container mx-auto flex items-center justify-between px-[23px] py-[2px] rounded-none">
          <div className="flex items-center">
            <h1 className="funnel-display-bold text-xl text-primary">Company Admin Panel</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              Company Admin
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
                  <p className="funnel-display-medium text-sm text-muted-foreground">Total Companies</p>
                  <p className="funnel-display-bold text-2xl text-primary">{stats.total}</p>
                </div>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="funnel-display-medium text-sm text-muted-foreground">Verified</p>
                  <p className="funnel-display-bold text-2xl text-success">{stats.verified}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
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
                <TrendingUp className="h-8 w-8 text-orange-600" />
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
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Companies List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="funnel-display-semibold flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Company Management
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search companies..."
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
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
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
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCompany?.id === company.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => selectCompany(company)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={company.avatar_url} />
                          <AvatarFallback>
                            {company.organization?.charAt(0) || company.display_name?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="funnel-display-medium text-sm font-medium truncate">
                            {company.organization || company.display_name || 'No name'}
                          </p>
                          <p className="funnel-display-normal text-xs text-muted-foreground truncate">
                            {company.email}
                          </p>
                          <p className="funnel-display-normal text-xs text-muted-foreground">
                            ID: {company.custom_user_id}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge 
                            className={
                              company.status === 'verified' ? 'bg-success text-success-foreground' :
                              company.status === 'suspended' ? 'bg-destructive text-destructive-foreground' :
                              'bg-orange-100 text-orange-700'
                            }
                          >
                            {company.status || 'pending'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(company.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Details */}
          <div className="space-y-6">
            {selectedCompany ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="funnel-display-semibold">Company Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarImage src={selectedCompany.avatar_url} />
                        <AvatarFallback className="text-lg">
                          {selectedCompany.organization?.charAt(0) || selectedCompany.display_name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="funnel-display-semibold text-lg">
                        {selectedCompany.organization || selectedCompany.display_name || 'No name'}
                      </h3>
                      <p className="funnel-display-normal text-muted-foreground">
                        {selectedCompany.email}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="funnel-display-normal text-sm">
                          Registered: {new Date(selectedCompany.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="funnel-display-normal text-sm">
                          Contact: {selectedCompany.display_name || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="funnel-display-normal text-sm">
                          Company ID: {selectedCompany.custom_user_id}
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
                        placeholder="Add notes about this company..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => updateCompanyStatus('verified')}
                        className="w-full bg-success hover:bg-success/90 text-white"
                        disabled={selectedCompany.status === 'verified'}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Company
                      </Button>
                      <Button
                        onClick={() => updateCompanyStatus('pending')}
                        variant="outline"
                        className="w-full"
                        disabled={selectedCompany.status === 'pending'}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Mark as Pending
                      </Button>
                      <Button
                        onClick={() => updateCompanyStatus('suspended')}
                        variant="destructive"
                        className="w-full"
                        disabled={selectedCompany.status === 'suspended'}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Suspend Company
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="funnel-display-semibold text-lg mb-2">No Company Selected</h3>
                    <p className="funnel-display-normal text-muted-foreground">
                      Select a company from the list to view details and manage their account.
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

export default CompanyAdminPanel;