import { MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationData } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';

interface LocationBannerProps {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  onRequestLocation: () => void;
}

export function LocationBanner({
  location,
  loading,
  error,
  permissionDenied,
  onRequestLocation,
}: LocationBannerProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Detecting your location...</span>
      </div>
    );
  }

  if (error || permissionDenied) {
    return (
      <div className="flex items-center justify-between gap-2 text-sm bg-muted/50 px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>{permissionDenied ? 'Location access denied' : error}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRequestLocation}
          className="text-primary hover:text-primary"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!location) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onRequestLocation}
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      >
        <MapPin className="w-4 h-4" />
        <span>Enable location for personalized advice</span>
      </Button>
    );
  }

  const locationParts = [
    location.region,
    location.district,
    location.state,
  ].filter(Boolean);

  return (
    <div className={cn(
      "flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-lg",
      "bg-primary/10 border border-primary/20"
    )}>
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-foreground font-medium">
          {locationParts.join(', ') || `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRequestLocation}
        className="h-7 px-2 text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className="w-3 h-3" />
      </Button>
    </div>
  );
}
