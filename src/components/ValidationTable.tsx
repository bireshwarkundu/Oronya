import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ValidationData {
  id: string;
  user_id: string;
  image_url: string;
  status: string;
  tree_count: number;
  co2_offset: number;
  location: string;
  created_at: string;
  verified_at: string | null;
  verification_notes: string | null;
}

const ValidationTable = () => {
  const [validationData, setValidationData] = useState<ValidationData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchValidationData();
  }, []);

  const fetchValidationData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tree_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setValidationData(data || []);
    } catch (error) {
      console.error('Error fetching validation data:', error);
      toast({
        title: "Error",
        description: "Failed to load validation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading validation data...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Table</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-3 text-left font-semibold">ID</th>
                <th className="border border-border p-3 text-left font-semibold">User ID</th>
                <th className="border border-border p-3 text-left font-semibold">Status</th>
                <th className="border border-border p-3 text-left font-semibold">Tree Count</th>
                <th className="border border-border p-3 text-left font-semibold">CO2 Offset</th>
                <th className="border border-border p-3 text-left font-semibold">Location</th>
                <th className="border border-border p-3 text-left font-semibold">Created At</th>
                <th className="border border-border p-3 text-left font-semibold">Verified At</th>
                <th className="border border-border p-3 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {validationData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-border p-4 text-center text-muted-foreground">
                    No validation data found
                  </td>
                </tr>
              ) : (
                validationData.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="border border-border p-3 text-sm">
                      {row.id.substring(0, 8)}...
                    </td>
                    <td className="border border-border p-3 text-sm">
                      {row.user_id.substring(0, 8)}...
                    </td>
                    <td className="border border-border p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="border border-border p-3 text-sm">
                      {row.tree_count}
                    </td>
                    <td className="border border-border p-3 text-sm">
                      {Number(row.co2_offset).toFixed(2)} tons
                    </td>
                    <td className="border border-border p-3 text-sm">
                      {row.location || 'N/A'}
                    </td>
                    <td className="border border-border p-3 text-sm">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="border border-border p-3 text-sm">
                      {row.verified_at ? new Date(row.verified_at).toLocaleDateString() : 'Not verified'}
                    </td>
                    <td className="border border-border p-3 text-sm">
                      {row.verification_notes || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationTable;
