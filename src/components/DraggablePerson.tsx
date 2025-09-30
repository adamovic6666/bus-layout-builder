import { useDrag } from 'react-dnd';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Person } from "./PeopleManager";
import { cn } from "@/lib/utils";

interface DraggablePersonProps {
  person: Person;
  onRemove: (id: string) => void;
}

export const DraggablePerson = ({ person, onRemove }: DraggablePersonProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'person',
    item: { id: person.id, name: person.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag}
      className={cn(
        "flex items-center justify-between p-2 bg-muted/50 rounded-md cursor-move transition-opacity hover:bg-muted",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex-1 flex flex-col gap-0.5">
        <Badge variant="secondary" className="w-fit">
          {person.name}
        </Badge>
        {person.birthDate && (
          <span className="text-xs text-muted-foreground ml-1">
            {new Date(person.birthDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(person.id)}
        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
