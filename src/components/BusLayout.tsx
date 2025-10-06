import React, { useState } from "react";
import { BusConfig } from "./BusConfigurator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Layers, Car, StickyNote, DoorOpen } from "lucide-react";
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { cn } from "@/lib/utils";
import { CSS } from '@dnd-kit/utilities';

interface BusLayoutProps {
  config: BusConfig;
  onToggleEmptySpace: (seatId: string) => void;
  onUpdateSeatNumber: (seatId: string, number: string) => void;
  onToggleTourGuideSeat?: (seatId: string) => void;
  onSeatAssignment?: (seatId: string, personId: string | null, fromSeatId?: string) => void;
}

const Seat = ({ 
  seatId, 
  config, 
  onToggleEmptySpace, 
  onUpdateSeatNumber, 
  onToggleTourGuideSeat,
  onSeatAssignment,
  displayLabel
}: {
  seatId: string;
  config: BusConfig;
  onToggleEmptySpace: (seatId: string) => void;
  onUpdateSeatNumber: (seatId: string, number: string) => void;
  onToggleTourGuideSeat?: (seatId: string) => void;
  onSeatAssignment?: (seatId: string, personId: string | null, fromSeatId?: string) => void;
  displayLabel: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editingSeat, setEditingSeat] = useState<string | null>(null);

  const isEmpty = config.emptySpaces.has(seatId);
  const customNumber = config.seatNumbers.get(seatId);
  const isNumeric = (val?: string) => !!val && /^\d+$/.test(val);
  const displayResolved = isNumeric(customNumber) ? customNumber! : displayLabel;
  const isTourGuideSeat = config.tourGuideSeats.includes(seatId);
  const assignedPersonId = config.seatAssignments.get(seatId);
  const assignedPerson = assignedPersonId ? config.people.find(p => p.id === assignedPersonId) : null;

  const hasPerson = !!assignedPerson;

  const { attributes, listeners, setNodeRef: setDragRef, isDragging, transform } = useDraggable({
    id: `seat-${seatId}-person`,
    disabled: !hasPerson,
    data: hasPerson ? { type: 'person', personId: assignedPerson!.id, fromSeatId: seatId } : undefined,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: seatId,
    data: { accepts: ['person'] },
  });

  const handleClick = (e: React.MouseEvent) => {
    if (transform) return; // if dragging, ignore clicks
    if (assignedPerson) return; // don't toggle when occupied; use drag instead
    if (e.ctrlKey || e.metaKey) {
      onToggleTourGuideSeat?.(seatId);
    } else {
      onToggleEmptySpace(seatId);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(displayResolved);
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
        className="w-24 h-10 border-2 border-dashed border-muted-foreground/30 rounded bg-muted/20 cursor-pointer"
        onClick={handleClick}
        title="Empty space (click to add seat)"
      />
    );
  }

  return (
    <>
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyPress={handleKeyPress}
          className="w-24 h-10 text-xs text-center p-1 border-2"
          autoFocus
        />
      ) : (
        <div
          ref={setDropRef}
          className={cn(
            "inline-block",
            isOver && !isEmpty && "ring-2 ring-primary ring-offset-1 rounded",
            isDragging && "opacity-30",
            assignedPerson && "cursor-move"
          )}
        >
          {assignedPerson ? (
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <div
                  ref={setDragRef}
                  {...listeners}
                  {...attributes}
                  style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-24 h-10 p-1 text-xs font-medium border-2 truncate relative",
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
                        ? `Tour Guide Seat ${displayResolved} (Ctrl+click to remove)`
                        : assignedPerson
                          ? `Seat ${displayResolved} - ${assignedPerson.name} (drag to move)`
                          : `Seat ${displayResolved} (click to mark empty, Ctrl+click for tour guide, double-click to edit)`
                    }
                  >
                    {assignedPerson.name}
                    {assignedPerson.notes && (
                      <StickyNote className="h-3 w-3 absolute top-0.5 right-0.5 text-amber-600" />
                    )}
                  </Button>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{assignedPerson.name}</h4>
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Seat:</span> {displayResolved}</p>
                    {assignedPerson.birthDate && (
                      <p><span className="font-medium">Birth Date:</span> {new Date(assignedPerson.birthDate).toLocaleDateString()}</p>
                    )}
                    {assignedPerson.notes && (
                      <p><span className="font-medium">Notes:</span> {assignedPerson.notes}</p>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-24 h-10 p-1 text-xs font-medium border-2 truncate",
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
                  ? `Tour Guide Seat ${displayResolved} (Ctrl+click to remove)`
                  : assignedPerson
                    ? `Seat ${displayResolved} - ${assignedPerson.name} (drag to move)`
                    : `Seat ${displayResolved} (click to mark empty, Ctrl+click for tour guide, double-click to edit)`
              }
            >
              {assignedPerson ? assignedPerson.name : displayResolved}
            </Button>
          )}
        </div>
      )}
    </>
  );
};

export const BusLayout = ({ config, onToggleEmptySpace, onUpdateSeatNumber, onToggleTourGuideSeat, onSeatAssignment }: BusLayoutProps) => {
  const [activeDeck, setActiveDeck] = useState<'main' | 'upper'>('main');

  // Compute sequential seat numbering skipping empty spaces
  const seatNumberMap = (() => {
    let counter = 0;
    const map = new Map<string, string>();

    // Main deck
    for (let row = 1; row <= config.mainDeckRows; row++) {
      const isLastRow = row === config.mainDeckRows;
      const isEntranceRow = config.entranceRows?.includes(row);
      const seatsInRow = isLastRow ? config.lastRowSeats : 4;
      
      // For entrance rows, reserve numbering for B and C BEFORE actual seats
      if (isEntranceRow) {
        counter += 2;
      }
      
      for (let seatIndex = 0; seatIndex < seatsInRow; seatIndex++) {
        const seatLetter = String.fromCharCode(65 + seatIndex);
        const sid = `${row}${seatLetter}`;
        
        // Skip the entrance placeholders (B and C) without incrementing further
        if (isEntranceRow && (seatLetter === 'B' || seatLetter === 'C')) {
          continue;
        }
        
        if (!config.emptySpaces.has(sid)) {
          counter += 1;
          map.set(sid, String(counter));
        }
      }
      }

    // Upper deck (continues numbering)
    if (config.hasUpperDeck) {
      for (let row = 1; row <= config.upperDeckRows; row++) {
        for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
          const seatLetter = String.fromCharCode(65 + seatIndex);
          const sid = `U${row}${seatLetter}`;
          if (!config.emptySpaces.has(sid)) {
            counter += 1;
            map.set(sid, String(counter));
          }
        }
      }
    }

    return map;
  })();

  const renderMainDeck = () => {
    const rows = [];
    for (let row = 1; row <= config.mainDeckRows; row++) {
      const isLastRow = row === config.mainDeckRows;
      const seatsInRow = isLastRow ? config.lastRowSeats : 4;
      const isEntranceRow = config.entranceRows?.includes(row);
      
      rows.push(
        <div key={row} className="flex justify-center gap-2 mb-2">
          <div className="text-xs text-muted-foreground w-6 text-center">{row}</div>
          <div className="flex gap-1">
            {Array.from({ length: seatsInRow }, (_, seatIndex) => {
              const seatLetter = String.fromCharCode(65 + seatIndex);
              const seatId = `${row}${seatLetter}`;
              const seatNumber = seatNumberMap.get(seatId) ?? "";
              
              // Skip middle seats (B and C) for entrance rows and show entrance indicator
              if (isEntranceRow && seatIndex === 1) {
                return (
                  <React.Fragment key={`entrance-${row}`}>
                    <div className="w-[208px] h-10 flex items-center justify-center gap-2 bg-muted/30 border-2 border-dashed border-muted-foreground/30 rounded text-xs text-muted-foreground font-medium">
                      <DoorOpen className="h-4 w-4" />
                      ENTRANCE
                    </div>
                    <Seat
                      seatId={`${row}D`}
                      displayLabel={seatNumberMap.get(`${row}D`) ?? ""}
                      config={config}
                      onToggleEmptySpace={onToggleEmptySpace}
                      onUpdateSeatNumber={onUpdateSeatNumber}
                      onToggleTourGuideSeat={onToggleTourGuideSeat}
                      onSeatAssignment={onSeatAssignment}
                    />
                  </React.Fragment>
                );
              }
              
              // Skip B, C, D seats in entrance rows as they're handled above
              if (isEntranceRow && (seatIndex === 1 || seatIndex === 2 || seatIndex === 3)) {
                return null;
              }
              
              return (
                <div key={seatId} className="flex items-center gap-1">
                  <Seat
                    seatId={seatId}
                    displayLabel={seatNumber}
                    config={config}
                    onToggleEmptySpace={onToggleEmptySpace}
                    onUpdateSeatNumber={onUpdateSeatNumber}
                    onToggleTourGuideSeat={onToggleTourGuideSeat}
                    onSeatAssignment={onSeatAssignment}
                  />
                  {seatIndex === 1 && (!isLastRow || seatsInRow !== 5) && !isEntranceRow && <div className="w-24" />}
                </div>
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
              const seatNumber = seatNumberMap.get(seatId) ?? "";
              return (
                <div key={seatId} className="flex items-center gap-1">
                  <Seat
                    seatId={seatId}
                    displayLabel={seatNumber}
                    config={config}
                    onToggleEmptySpace={onToggleEmptySpace}
                    onUpdateSeatNumber={onUpdateSeatNumber}
                    onToggleTourGuideSeat={onToggleTourGuideSeat}
                    onSeatAssignment={onSeatAssignment}
                  />
                  {seatIndex === 1 && <div className="w-24" />}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return rows;
  };

  if (!config.hasUpperDeck) {
    // Single deck - no tabs needed
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  // Double deck - with tabs
  return (
    <div className="space-y-6">
      <Tabs value={activeDeck} onValueChange={(value) => setActiveDeck(value as 'main' | 'upper')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Main Deck
          </TabsTrigger>
          <TabsTrigger value="upper" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Upper Deck
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="main">
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
        </TabsContent>

        <TabsContent value="upper">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};