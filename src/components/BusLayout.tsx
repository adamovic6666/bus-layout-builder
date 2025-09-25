import { BusConfig } from "./BusConfigurator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, Car } from "lucide-react";
import { useState } from "react";
import { useDrop } from 'react-dnd';
import { cn } from "@/lib/utils";

interface BusLayoutProps {
  config: BusConfig;
  onToggleEmptySpace: (seatId: string) => void;
  onUpdateSeatNumber: (seatId: string, number: string) => void;
  onToggleTourGuideSeat?: (seatId: string) => void;
  onSeatAssignment?: (seatId: string, personId: string | null) => void;
}

const Seat = ({ 
  seatId, 
  config, 
  onToggleEmptySpace, 
  onUpdateSeatNumber, 
  onToggleTourGuideSeat,
  onSeatAssignment 
}: {
  seatId: string;
  config: BusConfig;
  onToggleEmptySpace: (seatId: string) => void;
  onUpdateSeatNumber: (seatId: string, number: string) => void;
  onToggleTourGuideSeat?: (seatId: string) => void;
  onSeatAssignment?: (seatId: string, personId: string | null) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editingSeat, setEditingSeat] = useState<string | null>(null);

  const isEmpty = config.emptySpaces.has(seatId);
  const customNumber = config.seatNumbers.get(seatId);
  const displayNumber = customNumber || seatId;
  const isTourGuideSeat = config.tourGuideSeats.includes(seatId);
  const assignedPersonId = config.seatAssignments.get(seatId);
  const assignedPerson = assignedPersonId ? config.people.find(p => p.id === assignedPersonId) : null;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'person',
    drop: (item: { id: string, name: string }) => {
      if (onSeatAssignment && !isEmpty) {
        onSeatAssignment(seatId, item.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (onToggleTourGuideSeat) {
        onToggleTourGuideSeat(seatId);
      }
    } else {
      onToggleEmptySpace(seatId);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(displayNumber);
    setEditingSeat(seatId);
  };

  const handleSave = () => {
    onUpdateSeatNumber(seatId, editValue);
    setIsEditing(false);
    setEditingSeat(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingSeat(null);
    }
  };

  if (isEmpty) {
    return (
      <div 
        className="w-8 h-8 border-2 border-dashed border-muted-foreground/30 rounded bg-muted/20 cursor-pointer"
        onClick={handleClick}
        title="Empty space (click to add seat)"
      />
    );
  }

  return (
    <div 
      ref={drop} 
      className={cn(
        "relative",
        isOver && !isEmpty && "ring-2 ring-primary ring-offset-1"
      )}
    >
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyPress={handleKeyPress}
          className="w-8 h-8 text-xs text-center p-0 border-2"
          autoFocus
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-8 h-8 p-0 text-xs font-medium border-2",
            isTourGuideSeat 
              ? "border-amber-500 bg-amber-100 text-amber-800 hover:bg-amber-200" 
              : assignedPerson
                ? "border-green-500 bg-green-100 text-green-800 hover:bg-green-200"
                : "border-seat-border bg-seat-available hover:bg-seat-hover"
          )}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          title={
            isTourGuideSeat 
              ? `Tour Guide Seat ${displayNumber} (Ctrl+click to remove)`
              : assignedPerson
                ? `Seat ${displayNumber} - ${assignedPerson.name} (click to unassign)`
                : `Seat ${displayNumber} (click to mark empty, Ctrl+click for tour guide, double-click to edit)`
          }
        >
          {assignedPerson ? assignedPerson.name.charAt(0).toUpperCase() : displayNumber}
        </Button>
      )}
    </div>
  );
};

export const BusLayout = ({ config, onToggleEmptySpace, onUpdateSeatNumber, onToggleTourGuideSeat, onSeatAssignment }: BusLayoutProps) => {
  const renderMainDeck = () => {
    const rows = [];
    for (let row = 1; row <= config.mainDeckRows; row++) {
      const isLastRow = row === config.mainDeckRows;
      const seatsInRow = isLastRow ? config.lastRowSeats : 4;
      
      rows.push(
        <div key={row} className="flex justify-center gap-2 mb-2">
          <div className="text-xs text-muted-foreground w-6 text-center">{row}</div>
          <div className="flex gap-1">
            {Array.from({ length: seatsInRow }, (_, seatIndex) => {
              const seatLetter = String.fromCharCode(65 + seatIndex);
              const seatId = `${row}${seatLetter}`;
              return (
                <Seat
                  key={seatId}
                  seatId={seatId}
                  config={config}
                  onToggleEmptySpace={onToggleEmptySpace}
                  onUpdateSeatNumber={onUpdateSeatNumber}
                  onToggleTourGuideSeat={onToggleTourGuideSeat}
                  onSeatAssignment={onSeatAssignment}
                />
              );
            })}
          </div>
        </div>
      );
    }
    return rows;
  };

  const renderUpperDeck = () => {
    if (!config.hasUpperDeck) return null;
    
    const rows = [];
    for (let row = 1; row <= config.upperDeckRows; row++) {
      rows.push(
        <div key={`upper-${row}`} className="flex justify-center gap-2 mb-2">
          <div className="text-xs text-muted-foreground w-6 text-center">U{row}</div>
          <div className="flex gap-1">
            {Array.from({ length: 4 }, (_, seatIndex) => {
              const seatLetter = String.fromCharCode(65 + seatIndex);
              const seatId = `U${row}${seatLetter}`;
              return (
                <Seat
                  key={seatId}
                  seatId={seatId}
                  config={config}
                  onToggleEmptySpace={onToggleEmptySpace}
                  onUpdateSeatNumber={onUpdateSeatNumber}
                  onToggleTourGuideSeat={onToggleTourGuideSeat}
                  onSeatAssignment={onSeatAssignment}
                />
              );
            })}
          </div>
        </div>
      );
    }
    return rows;
  };

  return (
    <div className="space-y-6">
      {/* Main Deck */}
      <Card className="shadow-lg border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-bus-secondary">
            <Car className="h-5 w-5" />
            Main Deck
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-b from-bus-floor to-bus-floor/80 p-4 rounded-lg border-2 border-bus-exterior">
            {renderMainDeck()}
          </div>
        </CardContent>
      </Card>

      {/* Upper Deck */}
      {config.hasUpperDeck && (
        <Card className="shadow-lg border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-bus-secondary">
              <Layers className="h-5 w-5" />
              Upper Deck
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-b from-bus-floor to-bus-floor/80 p-4 rounded-lg border-2 border-bus-exterior">
              {renderUpperDeck()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};