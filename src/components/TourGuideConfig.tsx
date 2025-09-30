import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, X } from "lucide-react";
import { toast } from "sonner";

interface TourGuideConfigProps {
  tourGuideSeats: string[];
  onTourGuideSeatsChange: (seats: string[]) => void;
  totalSeats: number;
}

export const TourGuideConfig = ({ tourGuideSeats, onTourGuideSeatsChange, totalSeats }: TourGuideConfigProps) => {
  const getSeatDisplayLabel = (seatId: string): string => {
    const match = seatId.match(/^(\d+)([A-Z])$/);
    if (!match) return seatId;
    
    const row = parseInt(match[1]);
    const letter = match[2];
    const seatIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    
    // Calculate numeric seat number: (row-1) * 4 + seatIndex + 1
    const numericSeat = (row - 1) * 4 + seatIndex + 1;
    return numericSeat.toString();
  };

  const addPresetSeats = (preset: string) => {
    let newSeats: string[] = [];
    
    switch (preset) {
      case 'front-4':
        newSeats = ['1A', '1B', '1C', '1D'];
        break;
      case 'seats-1-2':
        newSeats = ['1A', '1B'];
        break;
      case 'seats-3-4':
        newSeats = ['1C', '1D'];
        break;
    }
    
    onTourGuideSeatsChange(newSeats);
    
    // Display with numeric labels
    const displayLabels = newSeats.map(getSeatDisplayLabel).join(', ');
    toast(`Tour guide seats set to: Seats ${displayLabels}`);
  };

  const removeTourGuideSeat = (seatId: string) => {
    const newSeats = tourGuideSeats.filter(seat => seat !== seatId);
    onTourGuideSeatsChange(newSeats);
    toast(`Removed Seat ${getSeatDisplayLabel(seatId)} from tour guide seats`);
  };

  const clearAllTourGuideSeats = () => {
    onTourGuideSeatsChange([]);
    toast("All tour guide seats cleared");
  };

  return (
    <Card className="shadow-lg border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-bus-secondary">
          <MapPin className="h-5 w-5" />
          Tour Guide Seats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Options */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Quick Presets:</div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addPresetSeats('seats-1-2')}
              className="text-xs"
            >
              Seats 1, 2
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addPresetSeats('seats-3-4')}
              className="text-xs"
            >
              Seats 3, 4
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addPresetSeats('front-4')}
              className="text-xs col-span-2"
            >
              All Front Row
            </Button>
          </div>
        </div>

        {/* Current Tour Guide Seats */}
        {tourGuideSeats.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Current:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllTourGuideSeats}
                className="text-xs h-6 px-2"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tourGuideSeats.map((seatId) => (
                <Badge key={seatId} variant="secondary" className="flex items-center gap-1">
                  Seat {getSeatDisplayLabel(seatId)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTourGuideSeat(seatId)}
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {tourGuideSeats.length === 0 && (
          <div className="text-center text-muted-foreground py-2">
            <p className="text-xs">No tour guide seats selected</p>
            <p className="text-xs">Click on bus seats or use presets above</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};