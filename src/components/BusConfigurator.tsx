import { useState, useEffect } from "react";
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BusLayout } from "./BusLayout";
import { PeopleManager, Person } from "./PeopleManager";
import { TourGuideConfig } from "./TourGuideConfig";
import { Plus, Minus, Bus, Users, Settings2, Save, Share, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface BusConfig {
  busName: string;
  licensePlates: string;
  mainDeckRows: number;
  upperDeckRows: number;
  hasUpperDeck: boolean;
  lastRowSeats: 4 | 5;
  tourGuideSeats: string[];
  emptySpaces: Set<string>;
  seatNumbers: Map<string, string>;
  people: Person[];
  seatAssignments: Map<string, string>; // seatId -> personId
}

const BusConfigurator = () => {
  const [config, setConfig] = useState<BusConfig>({
    busName: "",
    licensePlates: "",
    mainDeckRows: 12,
    upperDeckRows: 3,
    hasUpperDeck: false,
    lastRowSeats: 5,
    tourGuideSeats: [],
    emptySpaces: new Set(),
    seatNumbers: new Map(),
    people: [],
    seatAssignments: new Map(),
  });

  const [savedConfigId, setSavedConfigId] = useState<string | null>(null);

  // Log the complete configuration whenever it changes
  useEffect(() => {
    console.log("=== BUS CONFIGURATION ===");
    console.log("Bus Name:", config.busName);
    console.log("License Plates:", config.licensePlates);
    console.log("Main Deck Rows:", config.mainDeckRows);
    console.log("Upper Deck Rows:", config.upperDeckRows);
    console.log("Has Upper Deck:", config.hasUpperDeck);
    console.log("Last Row Seats:", config.lastRowSeats);
    console.log("Tour Guide Seats:", config.tourGuideSeats);
    console.log("Empty Spaces:", Array.from(config.emptySpaces));
    console.log("Seat Numbers:", Object.fromEntries(config.seatNumbers));
    console.log("People:", config.people);
    console.log("Seat Assignments:", Object.fromEntries(config.seatAssignments));
    console.log("Total Seats:", getTotalSeats());
    console.log("========================");
  }, [config]);

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

  const autoAssignPeople = () => {
    const availableSeats = getAvailableSeats();
    const newAssignments = new Map(config.seatAssignments);
    // Only consider free seats (not already assigned)
    const freeSeats = availableSeats.filter(seat => !newAssignments.has(seat));
    // Only consider unassigned people
    const assignedIds = new Set(newAssignments.values());
    const unassignedPeople = config.people.filter(p => !assignedIds.has(p.id));
    // Sort by birth date (oldest first)
    const sortedPeople = [...unassignedPeople].sort((a, b) => {
      if (!a.birthDate || !b.birthDate) return 0;
      return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
    });
    const assignCount = Math.min(sortedPeople.length, freeSeats.length);
    for (let i = 0; i < assignCount; i++) {
      newAssignments.set(freeSeats[i], sortedPeople[i].id);
    }
    setConfig(prev => ({ ...prev, seatAssignments: newAssignments }));
    toast(`Assigned ${assignCount} people to seats`);
  };

  const handleUnassignToPeople = (personId: string, seatId: string) => {
    // Remove from seat assignments
    const newAssignments = new Map(config.seatAssignments);
    newAssignments.delete(seatId);
    
    setConfig(prev => ({ 
      ...prev, 
      seatAssignments: newAssignments
    }));
    
    const person = config.people.find(p => p.id === personId);
    toast.success(`${person ? person.name : 'Passenger'} moved back to people list`);
  };

  const getAvailableSeats = (): string[] => {
    const allSeats: string[] = [];
    
    // Main deck seats
    for (let row = 1; row <= config.mainDeckRows; row++) {
      const seatsInRow = row === config.mainDeckRows ? config.lastRowSeats : 4;
      for (let seatIndex = 0; seatIndex < seatsInRow; seatIndex++) {
        const seatLetter = String.fromCharCode(65 + seatIndex); // A, B, C, D, E
        const seatId = `${row}${seatLetter}`;
        if (!config.emptySpaces.has(seatId) && !config.tourGuideSeats.includes(seatId)) {
          allSeats.push(seatId);
        }
      }
    }
    
    // Upper deck seats
    if (config.hasUpperDeck) {
      for (let row = 1; row <= config.upperDeckRows; row++) {
        for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
          const seatLetter = String.fromCharCode(65 + seatIndex);
          const seatId = `U${row}${seatLetter}`;
          if (!config.emptySpaces.has(seatId) && !config.tourGuideSeats.includes(seatId)) {
            allSeats.push(seatId);
          }
        }
      }
    }
    
    return allSeats;
  };

  const saveConfiguration = async () => {
    if (!config.busName.trim()) {
      toast.error("Please enter a bus name");
      return;
    }
    if (!config.licensePlates.trim()) {
      toast.error("Please enter license plates");
      return;
    }

    try {
      const configData = {
        busName: config.busName,
        licensePlates: config.licensePlates,
        mainDeckRows: config.mainDeckRows,
        upperDeckRows: config.upperDeckRows,
        hasUpperDeck: config.hasUpperDeck,
        lastRowSeats: config.lastRowSeats,
        tourGuideSeats: config.tourGuideSeats,
        emptySpaces: Array.from(config.emptySpaces),
        seatNumbers: Object.fromEntries(config.seatNumbers),
        people: config.people,
        seatAssignments: Object.fromEntries(config.seatAssignments),
      };

      let data, error;
      
      if (savedConfigId) {
        // Update existing configuration
        const result = await supabase
          .from('bus_configurations')
          .update({
            bus_name: config.busName,
            license_plates: config.licensePlates,
            main_deck_rows: config.mainDeckRows,
            upper_deck_rows: config.upperDeckRows,
            has_upper_deck: config.hasUpperDeck,
            last_row_seats: config.lastRowSeats,
            tour_guide_seats: config.tourGuideSeats,
            empty_spaces: Array.from(config.emptySpaces),
            seat_numbers: Object.fromEntries(config.seatNumbers),
            people: config.people as any,
            config_data: configData as any,
          })
          .eq('id', savedConfigId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new configuration
        const result = await supabase
          .from('bus_configurations')
          .insert({
            bus_name: config.busName,
            license_plates: config.licensePlates,
            main_deck_rows: config.mainDeckRows,
            upper_deck_rows: config.upperDeckRows,
            has_upper_deck: config.hasUpperDeck,
            last_row_seats: config.lastRowSeats,
            tour_guide_seats: config.tourGuideSeats,
            empty_spaces: Array.from(config.emptySpaces),
            seat_numbers: Object.fromEntries(config.seatNumbers),
            people: config.people as any,
            config_data: configData as any,
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      setSavedConfigId(data.id);
      toast.success("Bus configuration saved successfully!");
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error("Failed to save configuration");
    }
  };

  const shareConfiguration = async () => {
    if (!savedConfigId) {
      await saveConfiguration();
      if (!savedConfigId) return;
    }

    try {
      const { data, error } = await supabase
        .from('bus_configurations')
        .select('share_token')
        .eq('id', savedConfigId)
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/${data.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      console.error('Error sharing configuration:', error);
      toast.error("Failed to create share link");
    }
  };

  const downloadConfiguration = () => {
    const configData = {
      busName: config.busName,
      licensePlates: config.licensePlates,
      mainDeckRows: config.mainDeckRows,
      upperDeckRows: config.upperDeckRows,
      hasUpperDeck: config.hasUpperDeck,
      lastRowSeats: config.lastRowSeats,
      tourGuideSeats: config.tourGuideSeats,
      emptySpaces: Array.from(config.emptySpaces),
      seatNumbers: Object.fromEntries(config.seatNumbers),
      people: config.people,
      seatAssignments: Object.fromEntries(config.seatAssignments),
    };

    const dataStr = JSON.stringify(configData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = config.busName ? `${config.busName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_bus_config.json` : 'bus_config.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Configuration downloaded!");
  };

  const printConfiguration = async () => {
    const busLayoutElement = document.getElementById('bus-layout-print');
    if (!busLayoutElement) {
      toast.error("Bus layout not found for printing");
      return;
    }

    try {
      const canvas = await html2canvas(busLayoutElement);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = config.busName ? `${config.busName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_layout.pdf` : 'bus_layout.pdf';
      pdf.save(fileName);
      
      toast.success("Bus layout exported to PDF!");
    } catch (error) {
      console.error('Error printing configuration:', error);
      toast.error("Failed to export PDF");
    }
  };

  const getTotalSeats = () => {
    const regularRows = config.mainDeckRows - 1;
    const regularSeats = regularRows * 4;
    const lastRowSeats = config.lastRowSeats;
    const upperDeckSeats = config.hasUpperDeck ? config.upperDeckRows * 4 : 0;
    return regularSeats + lastRowSeats + upperDeckSeats - config.emptySpaces.size;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const data: any = active.data.current;
    if (!data || data.type !== 'person') return;

    const personId: string = data.personId;
    const fromSeatId: string | undefined = data.fromSeatId;
    const overId = String(over.id);

    // Drop to people panel
    if (overId === 'people-drop') {
      if (fromSeatId) {
        handleUnassignToPeople(personId, fromSeatId);
      }
      return;
    }

    // Drop to a seat
    const targetSeatId = overId;

    // Validate seat is available (not empty space, not tour guide)
    if (config.emptySpaces.has(targetSeatId) || config.tourGuideSeats.includes(targetSeatId)) {
      return;
    }

    setConfig(prev => {
      const newAssignments = new Map(prev.seatAssignments);
      if (fromSeatId) {
        // Seat to seat: swap if occupied
        const targetOccupant = newAssignments.get(targetSeatId);
        newAssignments.set(targetSeatId, personId);
        newAssignments.delete(fromSeatId);
        if (targetOccupant && targetOccupant !== personId) {
          newAssignments.set(fromSeatId, targetOccupant);
        }
      } else {
        // From people list: ensure uniqueness then assign
        for (const [s, p] of newAssignments.entries()) {
          if (p === personId) newAssignments.delete(s);
        }
        newAssignments.set(targetSeatId, personId);
      }
      return { ...prev, seatAssignments: newAssignments };
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Bus Information */}
            <Card className="shadow-lg border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-bus-secondary">
                  <Bus className="h-5 w-5" />
                  Bus Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bus Name</Label>
                  <Input
                    placeholder="Enter bus name"
                    value={config.busName}
                    onChange={(e) => setConfig(prev => ({ ...prev, busName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">License Plates</Label>
                  <Input
                    placeholder="Enter license plates"
                    value={config.licensePlates}
                    onChange={(e) => setConfig(prev => ({ ...prev, licensePlates: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
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

            {/* Tour Guide Configuration */}
            <TourGuideConfig
              tourGuideSeats={config.tourGuideSeats}
              onTourGuideSeatsChange={(seats) => setConfig(prev => ({ ...prev, tourGuideSeats: seats }))}
              totalSeats={getTotalSeats()}
            />

            {/* Action Buttons */}
            <Card className="shadow-lg border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-bus-secondary">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={saveConfiguration} className="w-full" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
                <div className="grid grid-cols-3 gap-1">
                  <Button onClick={shareConfiguration} variant="outline" size="sm">
                    <Share className="h-3 w-3" />
                  </Button>
                  <Button onClick={downloadConfiguration} variant="outline" size="sm">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button onClick={printConfiguration} variant="outline" size="sm">
                    <Printer className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-bus-secondary">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>• Click seats to mark as empty spaces</p>
                <p>• Ctrl+Click seats for tour guide positions</p>
                <p>• Double-click seat numbers to edit them</p>
                <p>• Drag people from right panel to assign seats</p>
                <p>• Import CSV/Excel with name and birth columns</p>
              </CardContent>
            </Card>
          </div>

          {/* Bus Layout and People Manager */}
          <div className="lg:col-span-3">
            <div id="bus-layout-print">
              <BusLayout
                config={config}
                onToggleEmptySpace={toggleEmptySpace}
                onUpdateSeatNumber={updateSeatNumber}
                onToggleTourGuideSeat={(seatId) => {
                  const newTourGuideSeats = config.tourGuideSeats.includes(seatId)
                    ? config.tourGuideSeats.filter(seat => seat !== seatId)
                    : [...config.tourGuideSeats, seatId];
                  setConfig(prev => ({ ...prev, tourGuideSeats: newTourGuideSeats }));
                }}
                onSeatAssignment={(seatId, personId, fromSeatId) => {
                  setConfig(prev => {
                    const newAssignments = new Map(prev.seatAssignments);

                    if (personId) {
                      if (fromSeatId) {
                        // Dragging from another seat: move or swap
                        const targetOccupant = newAssignments.get(seatId);
                        // Move dragged person to target
                        newAssignments.set(seatId, personId);
                        // Clear source seat
                        newAssignments.delete(fromSeatId);
                        // If target had occupant, move them to source (swap)
                        if (targetOccupant && targetOccupant !== personId) {
                          newAssignments.set(fromSeatId, targetOccupant);
                        }
                      } else {
                        // Dragging from the list: ensure uniqueness, then assign
                        for (const [s, p] of newAssignments.entries()) {
                          if (p === personId) newAssignments.delete(s);
                        }
                        newAssignments.set(seatId, personId);
                        return { ...prev, seatAssignments: newAssignments };
                      }
                    } else {
                      newAssignments.delete(seatId);
                    }

                    return { ...prev, seatAssignments: newAssignments };
                  });
                }}
              />
            </div>
          </div>

          {/* People Manager - Right Side */}
          <div className="lg:col-span-1">
            <PeopleManager
              people={config.people}
              assignedIds={new Set(config.seatAssignments.values())}
              onPeopleChange={(people) => setConfig(prev => ({ ...prev, people }))}
              onAutoAssign={autoAssignPeople}
              onUnassignToPeople={handleUnassignToPeople}
            />
          </div>
        </div>
      </div>
    </div>
    </DndContext>
  );
};

export default BusConfigurator;