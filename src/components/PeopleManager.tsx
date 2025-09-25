import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X, UserPlus, Shuffle } from "lucide-react";
import { toast } from "sonner";

export interface Person {
  id: string;
  name: string;
}

interface PeopleManagerProps {
  people: Person[];
  onPeopleChange: (people: Person[]) => void;
  onAutoAssign: () => void;
}

export const PeopleManager = ({ people, onPeopleChange, onAutoAssign }: PeopleManagerProps) => {
  const [newPersonName, setNewPersonName] = useState("");

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

        {/* Auto Assign Button */}
        {people.length > 0 && (
          <Button 
            onClick={onAutoAssign}
            variant="outline" 
            className="w-full"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Auto Assign to Seats
          </Button>
        )}

        {/* People List */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {people.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No people added yet</p>
            </div>
          ) : (
            people.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <Badge variant="secondary" className="flex-1 justify-start">
                  {person.name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePerson(person.id)}
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};