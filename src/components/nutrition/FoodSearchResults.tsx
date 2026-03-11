import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { InfoIcon, ArrowRight, AlertTriangle, CheckCircle, AlertCircle, Leaf, Pizza, XCircle } from 'lucide-react';
import { getFoodVerdict, FoodVerdict } from '@/services/InvisibleAIService';
import { useHealthStore } from '@/store/healthStore';

export interface FoodSearchInfo {
  name: string;
  category: 'healthy' | 'unhealthy' | 'junk' | 'neutral';
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  sugar?: string;
  ingredients?: string[];
  healthImplications: string[];
  benefitsInfo?: string[];
  isVegan?: boolean;
  isNonFood?: boolean;
}

interface FoodSearchResultsProps {
  foodInfo: FoodSearchInfo | null;
  isLoading: boolean;
  onViewDetails: () => void;
  onClose: () => void;
}

const FoodSearchResults: React.FC<FoodSearchResultsProps> = ({
  foodInfo,
  isLoading,
  onViewDetails,
  onClose
}) => {
  const { healthData, geminiApiKey, geminiTier } = useHealthStore();
  const [verdict, setVerdict] = React.useState<FoodVerdict | null>(null);
  const [verdictLoading, setVerdictLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchVerdict = async () => {
      if (foodInfo && geminiApiKey && geminiTier === 'pro' && !foodInfo.isNonFood) {
        setVerdictLoading(true);
        const data = await getFoodVerdict(foodInfo.name, healthData, geminiApiKey);
        setVerdict(data);
        setVerdictLoading(false);
      }
    };
    fetchVerdict();
  }, [foodInfo, geminiApiKey, geminiTier, healthData]);

  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!foodInfo) return null;

  // Check if this is a non-food item based on health implications
  const isNonFood = foodInfo.isNonFood ||
    (foodInfo.category === 'junk' &&
      foodInfo.healthImplications?.some(implication =>
        implication.toLowerCase().includes('not a food item') ||
        implication.toLowerCase().includes('not meant for consumption')
      ));

  if (isNonFood) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{foodInfo.name}</CardTitle>
            </div>
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
              Not a Food Item
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1 mt-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>This is not recognized as a food item</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Important Information</span>
            </h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start">
                <span className="mr-2 text-red-500">•</span>
                <span className="text-red-700">This is not a food item intended for human consumption</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-red-500">•</span>
                <span className="text-red-700">Please search for actual food items for nutritional information</span>
              </li>
              {foodInfo.healthImplications && foodInfo.healthImplications.length > 0 &&
                foodInfo.healthImplications.map((implication, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-red-500">•</span>
                    <span className="text-red-700">{implication}</span>
                  </li>
                ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between pt-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const getCategoryIcon = () => {
    switch (foodInfo.category) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'junk':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCategoryLabel = () => {
    switch (foodInfo.category) {
      case 'healthy':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Healthy Food
          </Badge>
        );
      case 'unhealthy':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            Unhealthy Food
          </Badge>
        );
      case 'junk':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Junk Food
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Neutral Food
          </Badge>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">{foodInfo.name}</CardTitle>
            {foodInfo.isVegan && (
              <Badge variant="outline" className="bg-green-100 text-green-800 ml-2">
                <Leaf className="h-3 w-3 mr-1" /> Vegan
              </Badge>
            )}
          </div>
          {getCategoryLabel()}
        </div>
        <CardDescription className="flex items-center gap-1 mt-1">
          <Pizza className="h-4 w-4 text-muted-foreground" />
          <span>Food nutrition analysis</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pro Feature: Contextual Verdict */}
        {geminiTier === 'pro' && (
          <div className="mb-4">
            {verdictLoading ? (
              <div className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ) : verdict ? (
              <div className={`p-3 rounded-lg border flex items-start gap-3 ${verdict.verdict === 'safe' ? 'bg-green-50 border-green-100' :
                  verdict.verdict === 'caution' ? 'bg-orange-50 border-orange-100' :
                    'bg-red-50 border-red-100'
                }`}>
                <div className={`mt-0.5 p-1 rounded-full ${verdict.verdict === 'safe' ? 'bg-green-100 text-green-600' :
                    verdict.verdict === 'caution' ? 'bg-orange-100 text-orange-600' :
                      'bg-red-100 text-red-600'
                  }`}>
                  {verdict.verdict === 'safe' ? <CheckCircle className="h-4 w-4" /> :
                    verdict.verdict === 'caution' ? <AlertCircle className="h-4 w-4" /> :
                      <AlertTriangle className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold uppercase tracking-wide ${verdict.verdict === 'safe' ? 'text-green-700' :
                        verdict.verdict === 'caution' ? 'text-orange-700' :
                          'text-red-700'
                      }`}>
                      {verdict.verdict} for you
                    </span>
                    {verdict.healthConditionMatch && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-white/50">
                        {verdict.healthConditionMatch}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm mt-0.5 ${verdict.verdict === 'safe' ? 'text-green-800' :
                      verdict.verdict === 'caution' ? 'text-orange-800' :
                        'text-red-800'
                    }`}>
                    {verdict.reason}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 p-3 rounded-md">
            <div className="text-xs text-muted-foreground">Calories</div>
            <div className="font-semibold">{foodInfo.calories}</div>
          </div>
          <div className="bg-primary/5 p-3 rounded-md">
            <div className="text-xs text-muted-foreground">Protein</div>
            <div className="font-semibold">{foodInfo.protein}</div>
          </div>
          <div className="bg-primary/5 p-3 rounded-md">
            <div className="text-xs text-muted-foreground">Carbs</div>
            <div className="font-semibold">{foodInfo.carbs}</div>
          </div>
          <div className="bg-primary/5 p-3 rounded-md">
            <div className="text-xs text-muted-foreground">Fat</div>
            <div className="font-semibold">{foodInfo.fat}</div>
          </div>
        </div>

        {foodInfo.ingredients && foodInfo.ingredients.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Main Ingredients</h4>
              <div className="flex flex-wrap gap-1">
                {foodInfo.ingredients.map((ingredient, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            {getCategoryIcon()}
            <span>Health Implications</span>
          </h4>
          <ul className="space-y-1 text-sm">
            {foodInfo.healthImplications.map((implication, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span className="text-muted-foreground">{implication}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onViewDetails} className="gap-1">
          <span>View Details</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FoodSearchResults;
