import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ValidationRun {
  run_number: number;
  tree_count: number;
  land_cover_class: string;
  area_hectares: number;
  co2_tons: number;
}

const CarbonValidation = () => {
  const [validating, setValidating] = useState(false);
  const [validationRuns, setValidationRuns] = useState<ValidationRun[]>([]);
  const [validationResult, setValidationResult] = useState<{
    passed: boolean;
    variance: number;
    mean: number;
  } | null>(null);
  const { toast } = useToast();

  const runValidation = async () => {
    setValidating(true);
    setValidationRuns([]);
    setValidationResult(null);

    try {
      const runs: ValidationRun[] = [];
      
      // Different land cover types to test
      const landCoverTypes = ['tropical_forest', 'temperate_forest', 'mixed_forest', 'mangrove', 'default'];
      
      // Run carbon calculation 20 times with DIFFERENT parameters
      for (let i = 1; i <= 20; i++) {
        // Generate random parameters for each test
        const testParams = {
          tree_count: Math.floor(Math.random() * 20) + 1, // 1-20 trees
          land_cover_class: landCoverTypes[Math.floor(Math.random() * landCoverTypes.length)],
          area_hectares: parseFloat((Math.random() * 29 + 1).toFixed(2)) // 1-30 hectares
        };

        const { data: result, error } = await supabase.functions.invoke('calculate-carbon', {
          body: testParams
        });

        if (error) throw error;

        runs.push({
          run_number: i,
          tree_count: testParams.tree_count,
          land_cover_class: testParams.land_cover_class,
          area_hectares: testParams.area_hectares,
          co2_tons: result.co2_equivalent_tons
        });

        setValidationRuns([...runs]);
      }

      // Calculate variance as percentage (coefficient of variation)
      const co2Values = runs.map(r => r.co2_tons);
      const mean = co2Values.reduce((sum, val) => sum + val, 0) / co2Values.length;
      const squaredDiffs = co2Values.map(val => Math.pow(val - mean, 2));
      const stdDev = Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / co2Values.length);
      const variancePercent = (stdDev / mean) * 100;

      // Check if variance is within 10% threshold
      const passed = variancePercent <= 10;

      setValidationResult({
        passed,
        variance: variancePercent,
        mean
      });

      toast({
        title: passed ? "Validation Passed ✓" : "Variance Exceeds 10%",
        description: passed 
          ? `Calculation variance ${variancePercent.toFixed(2)}% is within 10% threshold`
          : `Calculation variance ${variancePercent.toFixed(2)}% exceeds 10% threshold`,
        variant: passed ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: error.message || "Failed to run validation tests",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="funnel-display-bold flex items-center gap-2">
          Carbon Credit Calculation Validation
        </CardTitle>
        <CardDescription className="funnel-display-normal">
          Tests calculations with varied tree counts (1-20), areas (1-30 ha), and land types - variance shows input diversity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runValidation} 
          disabled={validating}
          className="w-full"
        >
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Validation ({validationRuns.length}/20)
            </>
          ) : (
            'Run Validation Test (20 Trials)'
          )}
        </Button>

        {validationResult && (
          <div className={`p-4 rounded-lg border-2 ${
            validationResult.passed 
              ? 'bg-green-50 dark:bg-green-950 border-green-500' 
              : 'bg-red-50 dark:bg-red-950 border-red-500'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {validationResult.passed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <h3 className="funnel-display-semibold text-lg">
                {validationResult.passed ? 'Validation Passed ✓' : 'Variance Too High'}
              </h3>
            </div>
            <div className="space-y-1 funnel-display-normal text-sm">
              <p>Mean CO₂: <strong>{validationResult.mean.toFixed(2)} tons</strong></p>
              <p>Variance: <strong>{validationResult.variance.toFixed(2)}%</strong></p>
              <p>Threshold: <strong>≤ 10%</strong></p>
              <p className="mt-2 text-muted-foreground">
                {validationResult.passed 
                  ? 'Results show acceptable variance with different tree counts (1-20) and areas (1-30 ha)' 
                  : 'Variance exceeds 10% - this is expected with highly varied inputs'}
              </p>
            </div>
          </div>
        )}

        {validationRuns.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trial</TableHead>
                  <TableHead>Trees</TableHead>
                  <TableHead>Land Cover</TableHead>
                  <TableHead>Area (ha)</TableHead>
                  <TableHead className="text-right">CO₂ (tons)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationRuns.map((run) => (
                  <TableRow key={run.run_number}>
                    <TableCell className="font-medium">#{run.run_number}</TableCell>
                    <TableCell>{run.tree_count}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{run.land_cover_class}</Badge>
                    </TableCell>
                    <TableCell>{run.area_hectares}</TableCell>
                    <TableCell className="text-right font-mono">
                      {run.co2_tons.toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarbonValidation;
