import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Shield, LogOut, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.svg";

interface TreeUpload {
  id: string;
  user_id: string;
  image_url: string;
  location: string;
  status: string;
  created_at: string;
  co2_offset: number;
  profiles?: {
    display_name: string;
    email: string;
  };
}

const GovVerifyPage = () => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<TreeUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchUploads();
  }, []);

  const checkAuthAndFetchUploads = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/gov-auth');
        return;
      }

      // Check if user has government_admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'government_admin')
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      fetchUploads();
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/gov-auth');
    }
  };

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('tree_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile info separately for each upload
      const uploadsWithProfiles = await Promise.all(
        (data || []).map(async (upload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', upload.user_id)
            .maybeSingle();
          
          return {
            ...upload,
            profiles: profile || { display_name: 'Unknown', email: 'N/A' }
          };
        })
      );

      setUploads(uploadsWithProfiles);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error",
        description: "Failed to load tree uploads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (uploadId: string, newStatus: 'verified' | 'rejected') => {
    setVerifyingId(uploadId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If verifying, calculate carbon credit first
      if (newStatus === 'verified') {
        try {
          // Default values - can be customized per upload
          const treeCount = 10; // Estimate trees per upload
          const landCoverClass = 'mixed_forest';
          
          console.log('Calculating carbon for upload:', uploadId);
          
          const { data: carbonResult, error: carbonError } = await supabase.functions.invoke('calculate-carbon', {
            body: { 
              tree_count: treeCount,
              land_cover_class: landCoverClass,
              upload_id: uploadId
            }
          });

          if (carbonError) {
            console.error('Carbon calculation error:', carbonError);
            toast({
              title: "Warning",
              description: "Carbon calculation failed. Using default CO₂ value.",
              variant: "destructive",
            });
          } else {
            console.log('Carbon calculated:', carbonResult);
            toast({
              title: "Carbon Calculated",
              description: `CO₂ offset: ${carbonResult.co2_equivalent_tons.toFixed(4)} tons`,
            });
          }
        } catch (carbonErr) {
          console.error('Error calling carbon function:', carbonErr);
        }
      }

      // Update verification status
      const { error } = await supabase
        .from('tree_uploads')
        .update({
          status: newStatus,
          verification_notes: notes[uploadId] || null,
          verified_at: new Date().toISOString()
        })
        .eq('id', uploadId);

      if (error) throw error;

      toast({
        title: newStatus === 'verified' ? "Tree Verified" : "Tree Rejected",
        description: `Successfully ${newStatus} the tree upload${newStatus === 'verified' ? ' with carbon calculation' : ''}.`,
      });

      fetchUploads();
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[uploadId];
        return newNotes;
      });
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive"
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/gov-auth');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = uploads.filter(u => u.status === 'pending').length;
  const verifiedCount = uploads.filter(u => u.status === 'verified').length;
  const rejectedCount = uploads.filter(u => u.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Oronya" className="h-12 w-12" />
            <div>
              <h1 className="funnel-display-bold text-xl flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Government Verification Portal
              </h1>
              <p className="text-sm text-muted-foreground">Tree Upload Verification</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-primary">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-success">{verifiedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Uploads List */}
        <Card>
          <CardHeader>
            <CardTitle>All Tree Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading uploads...</p>
            ) : uploads.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No tree uploads found.</p>
            ) : (
              <div className="space-y-6">
                {uploads.map(upload => (
                  <div key={upload.id} className="border border-border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image */}
                      <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={upload.image_url} 
                          alt="Tree" 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{upload.location || 'Tree Upload'}</h3>
                            <p className="text-sm text-muted-foreground">
                              Uploaded by: {upload.profiles?.display_name || 'Unknown'} ({upload.profiles?.email || 'N/A'})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Date: {new Date(upload.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              CO₂ Offset: {upload.co2_offset}t
                            </p>
                          </div>
                          {getStatusBadge(upload.status)}
                        </div>

                        {/* Verification Actions */}
                        {upload.status === 'pending' && (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Add verification notes (optional)"
                              value={notes[upload.id] || ''}
                              onChange={(e) => setNotes(prev => ({ ...prev, [upload.id]: e.target.value }))}
                              className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleVerify(upload.id, 'verified')}
                                disabled={verifyingId === upload.id}
                                className="bg-success hover:bg-success/90"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify
                              </Button>
                              <Button
                                onClick={() => handleVerify(upload.id, 'rejected')}
                                disabled={verifyingId === upload.id}
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default GovVerifyPage;
