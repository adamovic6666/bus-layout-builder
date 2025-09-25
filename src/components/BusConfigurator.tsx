import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BusLayout } from "./BusLayout";
import { Plus, Minus, Bus, Users, Settings2 } from "lucide-react";
import { toast } from "sonner";

export interface BusConfig {
  mainDeckRows: number;
  upperDeckRows: number;
  hasUpperDeck: boolean;
  lastRowSeats: 4 | 5;
  emptySpaces: Set<string>;
  seatNumbers: Map<string, string>;
}

const BusConfigurator = () => {
  const [config, setConfig] = useState<BusConfig>({
    mainDeckRows: 12,
    upperDeckRows: 3,
    hasUpperDeck: false,
    lastRowSeats: 5,
    emptySpaces: new Set(),
    seatNumbers: new Map(),
  });

  const updateMainDeckRows = (increment: number) => {
    const newRows = Math.max(1, Math.min(25, config.mainDeckRows + increment));
    setConfig(prev => ({ ...prev, mainDeckRows: newRows }));
    if (newRows !== config.mainDeckRows) {
      toast(`Main deck rows updated to ${newRows}`);
    }
  };

  const updateUpperDeckRows = (increment: number) => {
    const newRows = Math.max(1, Math.min(15, config.upperDeckRows + increment));
    setConfig(prev => ({ ...prev, upperDeckRows: newRows }));
    if (newRows !== config.upperDeckRows) {
      toast(`Upper deck rows updated to ${newRows}`);
    }
  };

  const toggleUpperDeck = () => {
    setConfig(prev => ({ ...prev, hasUpperDeck: !prev.hasUpperDeck }));
    toast(config.hasUpperDeck ? "Upper deck removed" : "Upper deck added");
  };

  const toggleLastRowSeats = () => {
    const newSeats = config.lastRowSeats === 4 ? 5 : 4;
    setConfig(prev => ({ ...prev, lastRowSeats: newSeats }));
    toast(`Last row seats changed to ${newSeats}`);
  };

  const toggleEmptySpace = (seatId: string) => {
    const newEmptySpaces = new Set(config.emptySpaces);
    if (newEmptySpaces.has(seatId)) {
      newEmptySpaces.delete(seatId);
    } else {
      newEmptySpaces.add(seatId);
    }
    setConfig(prev => ({ ...prev, emptySpaces: newEmptySpaces }));
  };

  const updateSeatNumber = (seatId: string, number: string) => {
    const newSeatNumbers = new Map(config.seatNumbers);
    if (number.trim()) {
      newSeatNumbers.set(seatId, number.trim());
    } else {
      newSeatNumbers.delete(seatId);
    }
    setConfig(prev => ({ ...prev, seatNumbers: newSeatNumbers }));
  };

  const getTotalSeats = () => {
    const regularRows = config.mainDeckRows - 1;
    const regularSeats = regularRows * 4;
    const lastRowSeats = config.lastRowSeats;
    const upperDeckSeats = config.hasUpperDeck ? config.upperDeckRows * 4 : 0;
    return regularSeats + lastRowSeats + upperDeckSeats - config.emptySpaces.size;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bus className="h-8 w-8 text-bus-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-bus-primary to-accent bg-clip-text text-transparent">
              Bus Seating Configurator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Design and customize your bus seating layout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-lg border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-bus-secondary">
                  <Settings2 className="h-5 w-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Deck Rows Control */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Main Deck Rows</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMainDeckRows(-1)}
                      disabled={config.mainDeckRows <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={config.mainDeckRows}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setConfig(prev => ({ ...prev, mainDeckRows: Math.max(1, Math.min(25, value)) }));
                      }}
                      className="text-center h-8 w-16"
                      min="1"
                      max="25"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMainDeckRows(1)}
                      disabled={config.mainDeckRows >= 25}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Upper Deck Rows Control */}
                {config.hasUpperDeck && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Upper Deck Rows</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateUpperDeckRows(-1)}
                        disabled={config.upperDeckRows <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={config.upperDeckRows}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setConfig(prev => ({ ...prev, upperDeckRows: Math.max(1, Math.min(15, value)) }));
                        }}
                        className="text-center h-8 w-16"
                        min="1"
                        max="15"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateUpperDeckRows(1)}
                        disabled={config.upperDeckRows >= 15}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Double Decker Toggle */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bus Type</Label>
                  <Button
                    variant={config.hasUpperDeck ? "default" : "outline"}
                    onClick={toggleUpperDeck}
                    className="w-full justify-start"
                  >
                    <Bus className="h-4 w-4 mr-2" />
                    {config.hasUpperDeck ? "Double Decker" : "Single Decker"}
                  </Button>
                </div>

                {/* Last Row Configuration */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Row Seats</Label>
                  <Button
                    variant="outline"
                    onClick={toggleLastRowSeats}
                    className="w-full justify-between"
                  >
                    <span>{config.lastRowSeats} Seats</span>
                    <Badge variant="secondary">{config.lastRowSeats === 5 ? "Wide" : "Standard"}</Badge>
                  </Button>
                </div>

                {/* Statistics */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Seats:</span>
                    <Badge variant="secondary" className="bg-seat-available">
                      <Users className="h-3 w-3 mr-1" />
                      {getTotalSeats()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Empty Spaces:</span>
                    <Badge variant="outline">
                      {config.emptySpaces.size}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-bus-secondary">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>• Click seats to mark as empty spaces (doors, facilities)</p>
                <p>• Double-click seat numbers to edit them</p>
                <p>• Use controls to adjust bus configuration</p>
              </CardContent>
            </Card>
          </div>

          {/* Bus Layout */}
          <div className="lg:col-span-3">
            <BusLayout
              config={config}
              onToggleEmptySpace={toggleEmptySpace}
              onUpdateSeatNumber={updateSeatNumber}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusConfigurator;