import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, QrCode, CheckCircle, XCircle, User, Calendar, MapPin, FileText, Shield, TreePine } from "lucide-react";
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
  is_verified: boolean;
  verified_by: string;
  verified_at: string;
  verification_notes: string;
  created_at: string;
}

interface TreeUpload {
  id: string;
  user_id: string;
  image_url: string;
  location: string;
  status: string;
  co2_offset: number;
  verification_notes: string;
  verified_at: string;
  created_at: string;
}

interface VerificationHistory {
  id: string;
  verification_status: boolean;
  verification_notes: string;
  verified_by: string;
  created_at: string;
}

interface GovernmentAdminPanelProps {
  onLogout: () => void;
  adminUserId: string;
}

const GovernmentAdminPanel = ({ onLogout, adminUserId }: GovernmentAdminPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [treeUploads, setTreeUploads] = useState<TreeUpload[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<TreeUpload | null>(null);
  const [uploadVerificationNotes, setUploadVerificationNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { toast } = useToast();

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a username or custom user ID to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`custom_user_id.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
      
      if (data && data.length === 0) {
        toast({
          title: "No Results",
          description: "No users found matching your search criteria",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = async (user: Profile) => {
    setSelectedUser(user);
    setVerificationNotes(user.verification_notes || "");
    
    // Load verification history
    try {
      const { data, error } = await supabase
        .from('verification_history')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerificationHistory(data || []);
    } catch (error) {
      console.error('Failed to load verification history:', error);
    }

    // Load tree uploads
    try {
      const { data, error } = await supabase
        .from('tree_uploads')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTreeUploads(data || []);
    } catch (error) {
      console.error('Failed to load tree uploads:', error);
      toast({
        title: "Error",
        description: "Failed to load user's tree uploads",
        variant: "destructive",
      });
    }
  };

  const verifyUser = async (isVerified: boolean) => {
    if (!selectedUser) return;

    try {
      // Update profile verification status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_verified: isVerified,
          verified_by: adminUserId,
          verified_at: new Date().toISOString(),
          verification_notes: verificationNotes
        })
        .eq('user_id', selectedUser.user_id);

      if (profileError) throw profileError;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        _admin_user_id: adminUserId,
        _admin_role: 'government_admin',
        _target_user_id: selectedUser.user_id,
        _action: `user_verification_${isVerified ? 'approved' : 'rejected'}`,
        _details: { notes: verificationNotes }
      });

      
      // Add to verification history
      const { error: historyError } = await supabase
        .from('verification_history')
        .insert({
          user_id: selectedUser.user_id,
          verified_by: adminUserId,
          verification_status: isVerified,
          verification_notes: verificationNotes
        });

      if (historyError) throw historyError;

      toast({
        title: "Verification Completed",
        description: `User ${isVerified ? 'verified' : 'rejected'} successfully. Returning to main panel...`,
      });

      // Auto-redirect after 5 seconds
      setTimeout(() => {
        setSelectedUser(null);
        setSearchQuery("");
        setSearchResults([]);
        setVerificationNotes("");
        setVerificationHistory([]);
        
        toast({
          title: "Ready for Next Verification",
          description: "Scan another QR code or search for a user to verify",
        });
      }, 5000);
      
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQRScan = async (result: string) => {
    if (result.startsWith('VERIFY_USER:')) {
      const parts = result.split(':');
      if (parts.length >= 3) {
        const customUserId = parts[2];
        setSearchQuery(customUserId);
        setShowQRScanner(false);
        
        // Auto-search and select user immediately
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('custom_user_id', customUserId)
            .single();

          if (error) throw error;
          
          if (data) {
            await selectUser(data);
            toast({
              title: "User Found",
              description: `Loaded profile for verification: ${data.display_name}`,
            });
          }
        } catch (error) {
          console.error('QR scan user lookup error:', error);
          toast({
            title: "User Not Found",
            description: "Could not find user with this QR code",
            variant: "destructive",
          });
        }
      }
    } else {
      toast({
        title: "Invalid QR Code",
        description: "This QR code is not a valid user verification code",
        variant: "destructive",
      });
    }
  };

  const verifyTreeUpload = async (upload: TreeUpload, isVerified: boolean) => {
    try {
      const newStatus = isVerified ? 'verified' : 'rejected';
      
      const { error } = await supabase
        .from('tree_uploads')
        .update({
          status: newStatus,
          verification_notes: uploadVerificationNotes,
          verified_at: new Date().toISOString()
        })
        .eq('id', upload.id);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        _admin_user_id: adminUserId,
        _admin_role: 'government_admin',
        _target_user_id: upload.user_id,
        _action: `tree_upload_${newStatus}`,
        _details: { upload_id: upload.id, notes: uploadVerificationNotes }
      });

      toast({
        title: "Upload " + (isVerified ? "Verified" : "Rejected"),
        description: `Tree upload has been ${newStatus} successfully`,
      });

      // Refresh uploads list
      if (selectedUser) {
        const { data } = await supabase
          .from('tree_uploads')
          .select('*')
          .eq('user_id', selectedUser.user_id)
          .order('created_at', { ascending: false });

        setTreeUploads(data || []);
      }

      setSelectedUpload(null);
      setUploadVerificationNotes("");
    } catch (error) {
      console.error('Upload verification error:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to update upload status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-0 rounded-none">
        <div className="container mx-auto flex items-center justify-between px-[23px] py-[2px] rounded-none">
          <div className="flex items-center">
            <h1 className="funnel-display-bold text-xl text-primary">Government Admin Panel</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
              <Shield className="h-3 w-3 mr-1" />
              Government Admin
            </Badge>
            <Button variant="outline" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="funnel-display-semibold flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Find User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Input
                  placeholder="Enter username or custom user ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={searchUsers} 
                    disabled={isSearching}
                    className="flex-1"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                  <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Scan QR Code</DialogTitle>
                      </DialogHeader>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Ask the user to show their profile QR code, then point your camera at it.
                        </p>
                        {/* QR Scanner would go here - simplified for now */}
                        <div className="bg-muted h-48 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">QR Scanner</p>
                            <p className="text-xs text-muted-foreground">Camera access required</p>
                          </div>
                        </div>
                        <Input
                          placeholder="Or enter QR code data manually"
                          className="mt-4"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleQRScan((e.target as HTMLInputElement).value);
                            }
                          }}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="funnel-display-medium text-sm text-muted-foreground">Search Results</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedUser?.id === user.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => selectUser(user)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="funnel-display-medium text-sm truncate">
                              {user.display_name || 'No name'}
                            </p>
                            <p className="funnel-display-normal text-xs text-muted-foreground truncate">
                              ID: {user.custom_user_id}
                            </p>
                          </div>
                          {user.is_verified && (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Details & Verification */}
          <div className="lg:col-span-2 space-y-6">
            {selectedUser ? (
              <>
                {/* User Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="funnel-display-semibold flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      User Information
                      {selectedUser.is_verified && (
                        <Badge className="ml-2 bg-success text-success-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedUser.avatar_url} />
                          <AvatarFallback className="text-lg">
                            {selectedUser.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="funnel-display-semibold text-lg">
                            {selectedUser.display_name || 'No name provided'}
                          </h3>
                          <p className="funnel-display-normal text-muted-foreground">
                            {selectedUser.email}
                          </p>
                          <p className="funnel-display-normal text-sm text-muted-foreground">
                            ID: {selectedUser.custom_user_id}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="funnel-display-normal text-sm">
                            {selectedUser.organization || 'No organization'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="funnel-display-normal text-sm">
                            Type: {selectedUser.user_type || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="funnel-display-normal text-sm">
                            Joined: {new Date(selectedUser.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedUser.is_verified && (
                      <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                          <div>
                            <p className="funnel-display-medium text-sm text-success">
                              Verified by Government Admin
                            </p>
                            <p className="funnel-display-normal text-xs text-muted-foreground">
                              Verified on: {new Date(selectedUser.verified_at).toLocaleString()}
                            </p>
                            {selectedUser.verification_notes && (
                              <p className="funnel-display-normal text-sm mt-2">
                                {selectedUser.verification_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Verification Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="funnel-display-semibold flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Identity Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="funnel-display-medium text-sm mb-2 block">
                        Verification Notes
                      </label>
                      <Textarea
                        placeholder="Enter verification notes (required for verification)..."
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={() => verifyUser(true)}
                        disabled={!verificationNotes.trim()}
                        className="bg-success hover:bg-success/90 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify User
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => verifyUser(false)}
                        disabled={!verificationNotes.trim()}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Verification
                      </Button>
                    </div>

                    <p className="funnel-display-normal text-xs text-muted-foreground">
                      * Verification notes are required before you can verify or reject a user
                    </p>
                  </CardContent>
                </Card>

                {/* Tree Uploads Section */}
                {treeUploads.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="funnel-display-semibold flex items-center">
                        <TreePine className="h-5 w-5 mr-2" />
                        Tree Uploads ({treeUploads.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {treeUploads.map((upload) => (
                          <div
                            key={upload.id}
                            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                          >
                            <div className="relative aspect-square">
                              <img
                                src={upload.image_url}
                                alt="Tree upload"
                                className="w-full h-full object-cover"
                              />
                              <Badge 
                                className={`absolute top-2 right-2 ${
                                  upload.status === 'verified' 
                                    ? 'bg-success text-success-foreground' 
                                    : upload.status === 'rejected'
                                    ? 'bg-destructive text-destructive-foreground'
                                    : 'bg-warning text-warning-foreground'
                                }`}
                              >
                                {upload.status}
                              </Badge>
                            </div>
                            <div className="p-4 space-y-2">
                              <div className="flex items-center space-x-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="funnel-display-normal">
                                  {upload.location || 'No location'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <TreePine className="h-4 w-4 text-muted-foreground" />
                                <span className="funnel-display-normal">
                                  CO₂ Offset: {upload.co2_offset} kg
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="funnel-display-normal">
                                  {new Date(upload.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {upload.verified_at && (
                                <p className="funnel-display-normal text-xs text-muted-foreground">
                                  Verified: {new Date(upload.verified_at).toLocaleDateString()}
                                </p>
                              )}
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full mt-2"
                                    onClick={() => {
                                      setSelectedUpload(upload);
                                      setUploadVerificationNotes(upload.verification_notes || "");
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    {upload.status === 'pending' ? 'Verify' : 'View Details'}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Tree Upload Details</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="relative aspect-video rounded-lg overflow-hidden">
                                      <img
                                        src={upload.image_url}
                                        alt="Tree upload"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="funnel-display-medium text-sm text-muted-foreground">Location</p>
                                        <p className="funnel-display-normal">{upload.location || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <p className="funnel-display-medium text-sm text-muted-foreground">CO₂ Offset</p>
                                        <p className="funnel-display-normal">{upload.co2_offset} kg</p>
                                      </div>
                                      <div>
                                        <p className="funnel-display-medium text-sm text-muted-foreground">Status</p>
                                        <Badge className={
                                          upload.status === 'verified' 
                                            ? 'bg-success text-success-foreground' 
                                            : upload.status === 'rejected'
                                            ? 'bg-destructive text-destructive-foreground'
                                            : 'bg-warning text-warning-foreground'
                                        }>
                                          {upload.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="funnel-display-medium text-sm text-muted-foreground">Uploaded</p>
                                        <p className="funnel-display-normal text-sm">
                                          {new Date(upload.created_at).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>

                                    {upload.verification_notes && (
                                      <div>
                                        <p className="funnel-display-medium text-sm text-muted-foreground mb-1">
                                          Previous Notes
                                        </p>
                                        <p className="funnel-display-normal text-sm p-3 bg-muted rounded-lg">
                                          {upload.verification_notes}
                                        </p>
                                      </div>
                                    )}

                                    <div>
                                      <label className="funnel-display-medium text-sm mb-2 block">
                                        Verification Notes
                                      </label>
                                      <Textarea
                                        placeholder="Add verification notes..."
                                        value={uploadVerificationNotes}
                                        onChange={(e) => setUploadVerificationNotes(e.target.value)}
                                        rows={3}
                                      />
                                    </div>

                                    {upload.status === 'pending' && (
                                      <div className="flex space-x-3">
                                        <Button
                                          onClick={() => verifyTreeUpload(upload, false)}
                                          variant="destructive"
                                          className="flex-1"
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Reject Upload
                                        </Button>
                                        <Button
                                          onClick={() => verifyTreeUpload(upload, true)}
                                          className="flex-1 bg-success hover:bg-success/90 text-white"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Verify Upload
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Verification History */}
                {verificationHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="funnel-display-semibold">Verification History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {verificationHistory.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-start space-x-3 p-3 border rounded-lg"
                          >
                            {record.verification_status ? (
                              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="funnel-display-medium text-sm">
                                {record.verification_status ? 'Verified' : 'Rejected'}
                              </p>
                              <p className="funnel-display-normal text-xs text-muted-foreground">
                                {new Date(record.created_at).toLocaleString()}
                              </p>
                              {record.verification_notes && (
                                <p className="funnel-display-normal text-sm mt-1">
                                  {record.verification_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="funnel-display-semibold text-lg mb-2">No User Selected</h3>
                    <p className="funnel-display-normal text-muted-foreground">
                      Search for a user by their username or custom user ID to begin verification.
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

export default GovernmentAdminPanel;