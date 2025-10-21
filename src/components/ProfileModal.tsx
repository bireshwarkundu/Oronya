import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Upload, Save } from "lucide-react";
import QRCodeDisplay from "./QRCodeDisplay";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'ngo' | 'company' | 'personal' | 'community_leader' | 'government';
  userId: string;
}

// Function to generate unique custom user ID
const generateCustomUserId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORN${timestamp}${randomStr}`.toUpperCase();
};

const ProfileModal = ({ isOpen, onClose, userType, userId }: ProfileModalProps) => {
  const [profile, setProfile] = useState({
    display_name: '',
    email: '',
    organization: '',
    avatar_url: '',
    custom_user_id: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load existing profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen, userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Load profile error:', error);
        return;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          email: data.email || '',
          organization: data.organization || '',
          avatar_url: data.avatar_url || '',
          custom_user_id: data.custom_user_id || ''
        });
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const generateUniqueUserId = async () => {
    setIsGeneratingId(true);
    try {
      let attempts = 0;
      let customId = '';
      let isUnique = false;

      while (!isUnique && attempts < 10) {
        customId = generateCustomUserId();
        
        // Check if this ID already exists
        const { data, error } = await supabase
          .from('profiles')
          .select('custom_user_id')
          .eq('custom_user_id', customId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('ID check error:', error);
          break;
        }

        if (!data) {
          isUnique = true;
        }
        attempts++;
      }

      if (isUnique) {
        setProfile(prev => ({ ...prev, custom_user_id: customId }));
        toast({
          title: "ID Generated",
          description: `Generated unique ID: ${customId}`,
        });
      } else {
        toast({
          title: "Generation failed",
          description: "Could not generate unique ID. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Generate ID error:', error);
      toast({
        title: "Generation failed",
        description: "An error occurred while generating ID.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingId(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: "Upload successful",
        description: "Profile photo uploaded successfully!",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // Validation
      if (!profile.display_name.trim()) {
        toast({
          title: "Validation Error",
          description: "Display name is required.",
          variant: "destructive",
        });
        return;
      }

      if (!profile.email.trim()) {
        toast({
          title: "Validation Error",
          description: "Email is required.",
          variant: "destructive",
        });
        return;
      }

      // Upsert profile data
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: profile.display_name.trim(),
          email: profile.email.trim(),
          organization: userType === 'company' ? profile.organization?.trim() || null : null,
          avatar_url: profile.avatar_url,
          user_type: userType,
          custom_user_id: profile.custom_user_id || null
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Save error:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505' && error.message.includes('custom_user_id')) {
          toast({
            title: "ID already exists",
            description: "This custom user ID is already taken. Please generate a new one.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Save failed",
          description: "Failed to save profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully!",
      });
      
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url} alt="Profile" />
              <AvatarFallback>
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-center space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground text-center">
                JPG, PNG up to 5MB
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            {/* Custom User ID */}
            <div className="space-y-2">
              <Label htmlFor="custom_user_id">Custom User ID</Label>
              <div className="flex space-x-2">
                <Input
                  id="custom_user_id"
                  placeholder="Generate or enter custom ID"
                  value={profile.custom_user_id}
                  onChange={(e) => setProfile(prev => ({ ...prev, custom_user_id: e.target.value.toUpperCase() }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateUniqueUserId}
                  disabled={isGeneratingId}
                  className="whitespace-nowrap"
                >
                  {isGeneratingId ? 'Generating...' : 'Generate'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Unique identifier for your account (e.g., ORN123ABC456)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                placeholder="Enter your name"
                value={profile.display_name}
                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            {userType === 'company' && (
              <div className="space-y-2">
                <Label htmlFor="organization">Company Name</Label>
                <Input
                  id="organization"
                  placeholder="Enter company name"
                  value={profile.organization}
                  onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
                />
              </div>
            )}
          </div>

          {/* QR Code Display */}
          {profile.custom_user_id && (
            <div className="flex justify-center py-4 border-t">
              <QRCodeDisplay 
                userData={{
                  user_id: userId,
                  custom_user_id: profile.custom_user_id,
                  display_name: profile.display_name
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;