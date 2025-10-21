import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  userData: {
    user_id: string;
    custom_user_id: string;
    display_name: string;
  };
}

const QRCodeDisplay = ({ userData }: QRCodeDisplayProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    generateQRCode();
  }, [userData]);

  const generateQRCode = async () => {
    try {
      const qrData = `VERIFY_USER:${userData.user_id}:${userData.custom_user_id}`;
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-2" />
          Show QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verification QR Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <p className="funnel-display-normal text-sm text-muted-foreground mb-4">
              Show this QR code to government officials for identity verification
            </p>
            
            {qrCodeUrl ? (
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={qrCodeUrl} alt="Verification QR Code" className="mx-auto" />
              </div>
            ) : (
              <div className="bg-muted h-[300px] w-[300px] mx-auto rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Generating QR Code...</p>
                </div>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="funnel-display-medium text-sm">User ID: {userData.custom_user_id}</p>
              <p className="funnel-display-normal text-xs text-muted-foreground">
                {userData.display_name}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay;