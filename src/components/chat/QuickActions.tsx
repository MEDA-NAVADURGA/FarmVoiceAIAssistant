import { Sprout, Bug, CloudRain, Wheat, Coins, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
}

const quickActions = [
  {
    icon: Sprout,
    label: 'Crop Selection',
    query: 'What crops should I plant this season based on my location?',
    color: 'text-primary',
  },
  {
    icon: Bug,
    label: 'Pest Control',
    query: 'How can I protect my crops from common pests?',
    color: 'text-secondary',
  },
  {
    icon: CloudRain,
    label: 'Weather Tips',
    query: 'What weather conditions should I prepare for this week?',
    color: 'text-farmer-sky',
  },
  {
    icon: Wheat,
    label: 'Soil Health',
    query: 'How can I improve my soil health naturally?',
    color: 'text-farmer-terracotta',
  },
  {
    icon: Coins,
    label: 'Market Prices',
    query: 'What are the current market prices for crops in my region?',
    color: 'text-farmer-wheat',
  },
  {
    icon: HelpCircle,
    label: 'Government Schemes',
    query: 'What government schemes and subsidies are available for farmers in my area?',
    color: 'text-farmer-green-light',
  },
];

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {quickActions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="h-auto py-3 px-3 flex flex-col items-center gap-2 hover:bg-muted/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => onSelect(action.query)}
          disabled={disabled}
        >
          <action.icon className={`w-5 h-5 ${action.color}`} />
          <span className="text-xs font-medium text-foreground">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
