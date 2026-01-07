import { Camera, FileText, Plus, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useState, useRef } from "react";
import type { VisitEvent } from "@shared/schema";
import { format } from "date-fns";

interface ProofSectionProps {
  events: VisitEvent[];
  canAddProof: boolean;
  isAddingPhoto: boolean;
  isAddingNote: boolean;
  onAddPhoto: (file: File) => void;
  onAddNote: (note: string) => void;
}

export function ProofSection({
  events,
  canAddProof,
  isAddingPhoto,
  isAddingNote,
  onAddPhoto,
  onAddNote,
}: ProofSectionProps) {
  const [noteText, setNoteText] = useState("");
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photos = events.filter((e) => e.eventType === "PHOTO" && e.photoUrl);
  const notes = events.filter((e) => e.eventType === "NOTE" && e.note);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddPhoto(file);
      e.target.value = "";
    }
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText("");
      setIsNoteDialogOpen(false);
    }
  };

  return (
    <Card data-testid="card-proof-section">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Visit Proof</CardTitle>
          {canAddProof && (
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                data-testid="input-photo-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handlePhotoClick}
                disabled={isAddingPhoto}
                data-testid="button-add-photo"
              >
                {isAddingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>

              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isAddingNote}
                    data-testid="button-add-note"
                  >
                    {isAddingNote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Note</DialogTitle>
                  </DialogHeader>
                  <Textarea
                    placeholder="Enter your note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="min-h-[120px]"
                    data-testid="input-note-text"
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleAddNote}
                      disabled={!noteText.trim() || isAddingNote}
                      data-testid="button-submit-note"
                    >
                      {isAddingNote ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Add Note
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Photos ({photos.length})</p>
            <div className="grid grid-cols-2 gap-2" data-testid="container-photos">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                  data-testid={`photo-${photo.id}`}
                >
                  <img
                    src={photo.photoUrl!}
                    alt="Visit proof"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                    <p className="text-xs text-white">
                      {format(new Date(photo.eventAt), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Notes ({notes.length})</p>
            <div className="space-y-2" data-testid="container-notes">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-muted rounded-lg"
                  data-testid={`note-${note.id}`}
                >
                  <p className="text-sm">{note.note}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(note.eventAt), "h:mm a")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {photos.length === 0 && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-no-proof">
              No photos or notes added yet
            </p>
            {canAddProof && (
              <p className="text-xs text-muted-foreground mt-1">
                Add at least 1 photo and 1 note to complete the visit
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
