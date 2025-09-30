import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X, UserPlus, Shuffle, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { DraggablePerson } from "./DraggablePerson";

export interface Person {
  id: string;
  name: string;
  birthDate?: string;
}

interface PeopleManagerProps {
  people: Person[];
  onPeopleChange: (people: Person[]) => void;
  onAutoAssign: () => void;
}

export const PeopleManager = ({ people, onPeopleChange, onAutoAssign }: PeopleManagerProps) => {
  const [newPersonName, setNewPersonName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPerson = () => {
    if (newPersonName.trim()) {
      const newPerson: Person = {
        id: Date.now().toString(),
        name: newPersonName.trim()
      };
      onPeopleChange([...people, newPerson]);
      setNewPersonName("");
      toast(`${newPerson.name} added to the list`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const importedPeople: Person[] = [];
        
        results.data.forEach((row: any) => {
          // Normalize headers to support variants like "Name and Lastname" and "Date of Birth"
          const rawName = row.name || row.Name || row["Name and Lastname"] || row["Full Name"] || row["Full name"];
          const rawBirth = row.birth || row.Birth || row["Date of Birth"] || row["DOB"] || row["Birthdate"] || row["Birth Date"];

          if (rawName && String(rawName).trim()) {
            const name = String(rawName).trim();
            const birthDate = rawBirth ? String(rawBirth).trim() : undefined;
            importedPeople.push({
              id: Date.now().toString() + Math.random(),
              name,
              birthDate,
            });
          }
        });

        // Sort by birth date (oldest first)
        importedPeople.sort((a, b) => {
          if (!a.birthDate || !b.birthDate) return 0;
          return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
        });

        onPeopleChange([...people, ...importedPeople]);
        toast.success(`Imported ${importedPeople.length} people`);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error("Failed to parse file");
      }
    });
  };

  const removePerson = (id: string) => {
    const person = people.find(p => p.id === id);
    onPeopleChange(people.filter(p => p.id !== id));
    if (person) {
      toast(`${person.name} removed from the list`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPerson();
    }
  };

  const sortPeopleByBirth = () => {
    const sorted = [...people].sort((a, b) => {
      if (!a.birthDate || !b.birthDate) return 0;
      return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
    });
    onPeopleChange(sorted);
    toast.success("People sorted by birth date (oldest first)");
  };

  return (
    <Card className="shadow-lg border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-bus-secondary">
          <Users className="h-5 w-5" />
          People ({people.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Person Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter person name"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={addPerson}
            disabled={!newPersonName.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Import CSV/Excel */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV/Excel
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Supported headers: name/birth or "Name and Lastname"/"Date of Birth"
          </p>
        </div>

        {/* Action Buttons */}
        {people.length > 0 && (
          <div className="flex gap-2">
            <Button 
              onClick={onAutoAssign}
              variant="outline" 
              className="flex-1"
              size="sm"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Auto Assign
            </Button>
            <Button 
              onClick={sortPeopleByBirth}
              variant="outline"
              size="sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* People List - Draggable */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {people.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No people added yet</p>
            </div>
          ) : (
            people.map((person) => (
              <DraggablePerson
                key={person.id}
                person={person}
                onRemove={removePerson}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};