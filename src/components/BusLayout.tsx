import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BusConfig } from "./BusConfigurator";
import { cn } from "@/lib/utils";

interface BusLayoutProps {
  config: BusConfig;
  onToggleEmptySpace: (seatId: string) => void;
  onUpdateSeatNumber: (seatId: string, number: string) => void;
}

interface SeatProps {
  id: string;
  number: string;
  isEmpty: boolean;
  isEditing: boolean;
  onToggleEmpty: () => void;
  onStartEdit: () => void;
  onEndEdit: (newNumber: string) => void;
  floor: 'lower' | 'upper';
}

const Seat = ({ id, number, isEmpty, isEditing, onToggleEmpty, onStartEdit, onEndEdit, floor }: SeatProps) => {
  const [editValue, setEditValue] = useState(number);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEndEdit(editValue);
    } else if (e.key === 'Escape') {
      setEditValue(number);
      onEndEdit(number);
    }
  };

  if (isEditing) {
    return (
      <div className="w-10 h-10 flex items-center justify-center">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onEndEdit(editValue)}
          onKeyDown={handleKeyDown}
          className="w-8 h-8 text-xs text-center p-0 border-2 border-bus-primary"
          autoFocus
          maxLength={3}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 select-none",
        "hover:scale-105 active:scale-95",
        isEmpty
          ? "bg-seat-empty border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-seat-empty/80"
          : floor === 'upper'
          ? "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-seat hover:from-accent/90 hover:to-accent/70 border border-accent/20"
          : "bg-gradient-to-br from-seat-available to-seat-occupied text-bus-secondary shadow-seat hover:from-seat-hover hover:to-seat-available border border-bus-primary/20"
      )}
      onClick={onToggleEmpty}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isEmpty) onStartEdit();
      }}
      title={isEmpty ? "Click to add seat" : "Click to remove • Double-click to edit number"}
    >
      {isEmpty ? "•" : number}
    </div>
  );
};

export const BusLayout = ({ config, onToggleEmptySpace, onUpdateSeatNumber }: BusLayoutProps) => {
  const [editingSeat, setEditingSeat] = useState<string | null>(null);

  const generateSeatId = (floor: 'lower' | 'upper', row: number, position: number) => {
    return `${floor}-${row}-${position}`;
  };

  const getDefaultSeatNumber = (floor: 'lower' | 'upper', row: number, position: number) => {
    if (floor === 'upper') {
      // Upper deck starts after lower deck seats
      const lowerDeckSeats = (config.rows - 1) * 4 + config.lastRowSeats;
      const upperSeatBase = lowerDeckSeats + (row - 1) * 4;
      return (upperSeatBase + position).toString();
    } else {
      // Lower deck numbering
      if (row === config.rows) {
        // Last row
        const baseNumber = (row - 1) * 4;
        return (baseNumber + position).toString();
      } else {
        // Regular rows
        const baseNumber = (row - 1) * 4;
        return (baseNumber + position).toString();
      }
    }
  };

  const getSeatNumber = (floor: 'lower' | 'upper', row: number, position: number) => {
    const seatId = generateSeatId(floor, row, position);
    return config.seatNumbers.get(seatId) || getDefaultSeatNumber(floor, row, position);
  };

  const renderSeatRow = (floor: 'lower' | 'upper', row: number, isLastRow: boolean = false) => {
    const seatsInRow = isLastRow ? config.lastRowSeats : 4;
    const seats = [];

    if (isLastRow && config.lastRowSeats === 5) {
      // 5-seat configuration: 1 + gap + 2 + gap + 2
      for (let i = 1; i <= 5; i++) {
        const seatId = generateSeatId(floor, row, i);
        const seatNumber = getSeatNumber(floor, row, i);
        const isEmpty = config.emptySpaces.has(seatId);
        const isEditing = editingSeat === seatId;

        seats.push(
          <Seat
            key={seatId}
            id={seatId}
            number={seatNumber}
            isEmpty={isEmpty}
            isEditing={isEditing}
            floor={floor}
            onToggleEmpty={() => onToggleEmptySpace(seatId)}
            onStartEdit={() => setEditingSeat(seatId)}
            onEndEdit={(newNumber) => {
              onUpdateSeatNumber(seatId, newNumber);
              setEditingSeat(null);
            }}
          />
        );

        // Add gaps after seat 1 and seat 3
        if (i === 1 || i === 3) {
          seats.push(<div key={`gap-${i}`} className="w-4" />);
        }
      }
    } else {
      // 4-seat configuration: 2 + gap + 2
      for (let i = 1; i <= seatsInRow; i++) {
        const seatId = generateSeatId(floor, row, i);
        const seatNumber = getSeatNumber(floor, row, i);
        const isEmpty = config.emptySpaces.has(seatId);
        const isEditing = editingSeat === seatId;

        seats.push(
          <Seat
            key={seatId}
            id={seatId}
            number={seatNumber}
            isEmpty={isEmpty}
            isEditing={isEditing}
            floor={floor}
            onToggleEmpty={() => onToggleEmptySpace(seatId)}
            onStartEdit={() => setEditingSeat(seatId)}
            onEndEdit={(newNumber) => {
              onUpdateSeatNumber(seatId, newNumber);
              setEditingSeat(null);
            }}
          />
        );

        // Add gap after first 2 seats
        if (i === 2) {
          seats.push(<div key="aisle" className="w-6" />);
        }
      }
    }

    return (
      <div key={`${floor}-row-${row}`} className="flex items-center justify-center gap-1 py-1">
        {seats}
      </div>
    );
  };

  const renderFloor = (floor: 'lower' | 'upper') => {
    const rows = [];
    const rowCount = floor === 'upper' ? 2 : config.rows;

    for (let row = 1; row <= rowCount; row++) {
      const isLastRow = floor === 'lower' && row === config.rows;
      rows.push(renderSeatRow(floor, row, isLastRow));
    }

    return rows;
  };

  return (
    <div className="space-y-6">
      {/* Lower Deck */}
      <Card className="p-6 shadow-lg border-border/60 bg-gradient-to-b from-card to-card/80">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-bus-secondary flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bus-primary to-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              Main Deck
            </h3>
          </div>

          <div className="relative">
            {/* Bus outline */}
            <div className="border-2 border-bus-primary/30 rounded-3xl p-6 bg-gradient-to-b from-background/50 to-muted/20 shadow-bus">
              {/* Driver area indicator */}
              <div className="absolute top-4 left-8 w-6 h-6 rounded-full bg-bus-primary/20 border border-bus-primary/40 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-bus-primary/60"></div>
              </div>

              {/* Front of bus */}
              <div className="text-center text-xs text-muted-foreground mb-4 font-medium">
                ← FRONT
              </div>

              {/* Seat rows */}
              <div className="space-y-1">
                {renderFloor('lower')}
              </div>

              {/* Back of bus */}
              <div className="text-center text-xs text-muted-foreground mt-4 font-medium">
                BACK →
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Upper Deck */}
      {config.hasUpperDeck && (
        <Card className="p-6 shadow-lg border-border/60 bg-gradient-to-b from-accent/5 to-accent/10">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-bus-secondary flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                Upper Deck
              </h3>
            </div>

            <div className="relative">
              {/* Upper deck outline */}
              <div className="border-2 border-accent/30 rounded-3xl p-6 bg-gradient-to-b from-background/30 to-accent/5 shadow-lg">
                {/* Front indicator */}
                <div className="text-center text-xs text-muted-foreground mb-4 font-medium">
                  ← FRONT
                </div>

                {/* Upper deck seats (2 rows of 4) */}
                <div className="space-y-1">
                  {renderFloor('upper')}
                </div>

                {/* Back indicator */}
                <div className="text-center text-xs text-muted-foreground mt-4 font-medium">
                  BACK →
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};