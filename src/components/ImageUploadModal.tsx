import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  isFarmerRegistered, 
  registerFarmer, 
  mintCarbonCredit,
  getSigner 
} from "@/lib/blockchain";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

const ImageUploadModal = ({ isOpen, onClose, onUploadSuccess }: ImageUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to upload images",
          variant: "destructive"
        });
        return;
      }

      // Upload image to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Insert record into tree_uploads table first
      const { data: insertData, error: insertError } = await supabase
        .from('tree_uploads')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          location: location || 'Tree Upload',
          status: 'pending',
          co2_offset: 0.15, // Temporary default
          tree_count: 0 // Will be updated after AI analysis
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Analyze image with AI first
      try {
        console.log('Starting AI analysis for image:', publicUrl);
        
        const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('analyze-tree-image', {
          body: { image_url: publicUrl }
        });

        if (analysisError) {
          console.error('AI analysis error:', analysisError);
          throw analysisError;
        }

        console.log('AI analysis result:', analysisResult);

        // Validate that image contains trees
        if (!analysisResult.tree_count || analysisResult.tree_count === 0) {
          // Delete the upload record since validation failed
          await supabase
            .from('tree_uploads')
            .delete()
            .eq('id', insertData.id);

          toast({
            title: "No Tree Available",
            description: "The uploaded image does not contain any trees. Please upload an image with visible trees for carbon credit verification.",
            variant: "destructive",
            duration: 5000
          });
          
          setUploading(false);
          return;
        }

        // Use AI-estimated values for carbon calculation
        const { data: carbonResult, error: carbonError } = await supabase.functions.invoke('calculate-carbon', {
          body: { 
            tree_count: analysisResult.tree_count,
            land_cover_class: analysisResult.land_cover_class,
            area_hectares: analysisResult.estimated_area_hectares,
            upload_id: insertData.id
          }
        });

        if (carbonError) {
          console.error('Carbon calculation error:', carbonError);
          throw carbonError;
        }

        console.log('Carbon calculated with AI estimates:', carbonResult);

        // Update tree_count and co2_offset in database
        const { error: updateError } = await supabase
          .from('tree_uploads')
          .update({ 
            tree_count: analysisResult.tree_count,
            co2_offset: carbonResult.co2_equivalent_tons
          })
          .eq('id', insertData.id);

        if (updateError) {
          console.error('Failed to update tree data:', updateError);
          throw updateError;
        }
        
        console.log('Successfully updated tree_count to:', analysisResult.tree_count);

        // Upload metadata to IPFS
        try {
          console.log('Uploading metadata to IPFS...');
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, user_type')
            .eq('user_id', user.id)
            .maybeSingle();

          const registrantName = profileData?.display_name || user.email || 'Unknown';

          const { data: ipfsData, error: ipfsError } = await supabase.functions.invoke('upload-to-ipfs', {
            body: {
              image_url: publicUrl,
              tree_count: analysisResult.tree_count,
              co2_offset: carbonResult.co2_equivalent_tons,
              location: location || 'Tree Upload',
              land_cover_class: analysisResult.land_cover_class,
              estimated_area_hectares: analysisResult.estimated_area_hectares,
              registrant_name: registrantName,
              upload_id: insertData.id
            }
          });

          if (ipfsError) {
            console.error('IPFS upload error:', ipfsError);
            throw ipfsError;
          }

          console.log('IPFS upload successful:', ipfsData);

          // Store IPFS data in database for later minting (after government approval)
          await supabase
            .from('tree_uploads')
            .update({
              verification_notes: `IPFS: ${ipfsData.ipfs_hash}`
            })
            .eq('id', insertData.id);

          toast({
            title: "Upload Successful!",
            description: `AI detected ${analysisResult.tree_count} trees, ${carbonResult.co2_equivalent_tons.toFixed(2)}t CO₂. Awaiting government approval for NFT minting.`,
            duration: 5000
          });
        } catch (ipfsError: any) {
          console.error('IPFS upload error:', ipfsError);
          toast({
            title: "Success (partial)",
            description: `AI detected ${analysisResult.tree_count} trees. IPFS upload failed but can be retried later.`,
            variant: "destructive"
          });
        }

        // Wait for database to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error in AI analysis or carbon calculation:', error);
        toast({
          title: "Upload successful",
          description: "Tree uploaded but AI analysis failed. Using default estimates.",
          variant: "destructive"
        });
      }

      onUploadSuccess?.();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setLocation('');
    setDragOver(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="funnel-display-semibold">Upload Tree Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location" className="funnel-display-medium">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Forest Area A, Community Garden"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="funnel-display-normal"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label className="funnel-display-medium">Tree Image</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="funnel-display-medium text-sm text-muted-foreground">
                {selectedFile ? selectedFile.name : 'Drag & drop an image or click to browse'}
              </p>
              <p className="funnel-display-normal text-xs text-muted-foreground mt-1">
                Supports JPG, PNG, WEBP up to 10MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              className="flex-1"
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadModal;
