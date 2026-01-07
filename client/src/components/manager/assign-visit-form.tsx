import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Building, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Client, Project, User } from "@shared/schema";

const assignVisitSchema = z.object({
  visitType: z.enum(["SALES_MEETING", "SITE_VISIT"]),
  assignedToUserId: z.string().min(1, "User is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  locationAddressText: z.string().min(5, "Address is required"),
  locationLat: z.string().refine((v) => !isNaN(parseFloat(v)), "Invalid latitude"),
  locationLng: z.string().refine((v) => !isNaN(parseFloat(v)), "Invalid longitude"),
  plannedStartAt: z.string().optional(),
  purpose: z.string().optional(),
});

type AssignVisitFormData = z.infer<typeof assignVisitSchema>;

interface AssignVisitFormProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  clients: Client[];
  projects: Project[];
  isSubmitting: boolean;
  onSubmit: (data: AssignVisitFormData) => void;
}

export function AssignVisitForm({
  isOpen,
  onClose,
  users,
  clients,
  projects,
  isSubmitting,
  onSubmit,
}: AssignVisitFormProps) {
  const form = useForm<AssignVisitFormData>({
    resolver: zodResolver(assignVisitSchema),
    defaultValues: {
      visitType: "SALES_MEETING",
      assignedToUserId: "",
      title: "",
      clientId: "",
      projectId: "",
      locationAddressText: "",
      locationLat: "",
      locationLng: "",
      plannedStartAt: "",
      purpose: "",
    },
  });

  const visitType = form.watch("visitType");

  const handleSubmit = (data: AssignVisitFormData) => {
    onSubmit(data);
    form.reset();
  };

  const fieldTeamUsers = users.filter(
    (u) => u.role === "SALES" || u.role === "PROJECTS"
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Assign Visit to Team Member</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assignedToUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-assign-user">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fieldTeamUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Type</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={cn(
                        "p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors",
                        field.value === "SALES_MEETING"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      )}
                      onClick={() => field.onChange("SALES_MEETING")}
                      data-testid="button-assign-type-sales"
                    >
                      <Briefcase className={cn(
                        "w-4 h-4",
                        field.value === "SALES_MEETING" ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        field.value === "SALES_MEETING" ? "text-primary" : "text-muted-foreground"
                      )}>Sales</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors",
                        field.value === "SITE_VISIT"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      )}
                      onClick={() => field.onChange("SITE_VISIT")}
                      data-testid="button-assign-type-site"
                    >
                      <Building className={cn(
                        "w-4 h-4",
                        field.value === "SITE_VISIT" ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        field.value === "SITE_VISIT" ? "text-primary" : "text-muted-foreground"
                      )}>Site</span>
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Client meeting at XYZ" 
                      {...field}
                      data-testid="input-assign-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-assign-client">
                        <SelectValue placeholder="Select client (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {visitType === "SITE_VISIT" && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assign-project">
                          <SelectValue placeholder="Select project (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.projectCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="locationAddressText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the full address"
                      {...field}
                      data-testid="input-assign-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="locationLat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="e.g., 19.0760"
                        {...field}
                        data-testid="input-assign-lat"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="locationLng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="e.g., 72.8777"
                        {...field}
                        data-testid="input-assign-lng"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="plannedStartAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      {...field}
                      data-testid="input-assign-scheduled"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose of this visit"
                      {...field}
                      data-testid="input-assign-purpose"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                data-testid="button-cancel-assign"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-submit-assign"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </span>
                ) : (
                  "Assign Visit"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
