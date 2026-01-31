import { Sprout, Sun, CloudRain, Leaf } from 'lucide-react';

export function WelcomeState() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-8 animate-fade-in">
      {/* Logo/Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full gradient-farm flex items-center justify-center shadow-lg">
          <Sprout className="w-10 h-10 text-white" />
        </div>
        {/* Decorative icons */}
        <Sun className="absolute -top-2 -right-2 w-6 h-6 text-farmer-wheat animate-bounce-gentle" />
        <CloudRain className="absolute -bottom-1 -left-3 w-5 h-5 text-farmer-sky opacity-70" />
        <Leaf className="absolute top-1/2 -right-4 w-4 h-4 text-primary rotate-45 opacity-60" />
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
        Farmer Assistant
      </h1>
      
      {/* Subtitle */}
      <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-6">
        Your friendly guide for crops, soil, weather, and farming success. 
        Ask me anything about agriculture!
      </p>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-muted-foreground max-w-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Crop Selection
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          Pest Control
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-farmer-sky" />
          Weather Tips
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-farmer-wheat" />
          Market Prices
        </div>
      </div>
    </div>
  );
}
