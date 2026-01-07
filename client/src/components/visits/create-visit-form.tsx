import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Building, MapPin, Calendar, Loader2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Client, Project } from "@shared/schema";

const createVisitSchema = z.object({
  visitType: z.enum(["SALES_MEETING", "SITE_VISIT"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  purpose: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  locationAddressText: z.string().min(5, "Address is required"),
  locationLat: z.string().refine((v) => !isNaN(parseFloat(v)), "Invalid latitude"),
  locationLng: z.string().refine((v) => !isNaN(parseFloat(v)), "Invalid longitude"),
  plannedStartAt: z.string().optional(),
  geofenceRadiusM: z.number().min(50).max(500).default(150),
});

type CreateVisitFormData = z.infer<typeof createVisitSchema>;

interface CreateVisitFormProps {
  clients: Client[];
  projects: Project[];
  isSubmitting: boolean;
  onSubmit: (data: CreateVisitFormData) => void;
  onCancel: () => void;
  defaultLocation?: { lat: number; lng: number; address?: string };
}

export function CreateVisitForm({
  clients,
  projects,
  isSubmitting,
  onSubmit,
  onCancel,
  defaultLocation,
}: CreateVisitFormProps) {
  const form = useForm<CreateVisitFormData>({
    resolver: zodResolver(createVisitSchema),
    defaultValues: {
      visitType: "SALES_MEETING",
      title: "",
      purpose: "",
      clientId: "",
      projectId: "",
      locationAddressText: defaultLocation?.address || "",
      locationLat: defaultLocation?.lat?.toString() || "",
      locationLng: defaultLocation?.lng?.toString() || "",
      plannedStartAt: "",
      geofenceRadiusM: 150,
    },
  });

  const visitType = form.watch("visitType");

  const handleUseCurrentLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });
      form.setValue("locationLat", position.coords.latitude.toString());
      form.setValue("locationLng", position.coords.longitude.toString());
    } catch (error) {
      console.error("Failed to get location:", error);
    }
  };

  return (
    <Card data-testid="card-create-visit">
      <CardHeader>
        <CardTitle>Create New Visit</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors",
                        field.value === "SALES_MEETING"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      )}
                      onClick={() => field.onChange("SALES_MEETING")}
                      data-testid="button-type-sales"
                    >
                      <Briefcase className={cn(
                        "w-6 h-6",
                        field.value === "SALES_MEETING" ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        field.value === "SALES_MEETING" ? "text-primary" : "text-muted-foreground"
                      )}>Sales Meeting</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors",
                        field.value === "SITE_VISIT"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      )}
                      onClick={() => field.onChange("SITE_VISIT")}
                      data-testid="button-type-site"
                    >
                      <Building className={cn(
                        "w-6 h-6",
                        field.value === "SITE_VISIT" ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        field.value === "SITE_VISIT" ? "text-primary" : "text-muted-foreground"
                      )}>Site Visit</span>
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
                      placeholder="e.g., Meeting with ABC Corp" 
                      {...field} 
                      data-testid="input-visit-title"
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
                  <FormLabel>Client (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-client">
                        <SelectValue placeholder="Select a client" />
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
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project">
                          <SelectValue placeholder="Select a project" />
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
                      className="min-h-[80px]"
                      data-testid="input-visit-address"
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
                        data-testid="input-visit-lat"
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
                        data-testid="input-visit-lng"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleUseCurrentLocation}
              data-testid="button-use-current-location"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>

            <FormField
              control={form.control}
              name="plannedStartAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Time (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      {...field}
                      data-testid="input-visit-scheduled"
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
                      data-testid="input-visit-purpose"
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
                onClick={onCancel}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-submit-visit"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Visit"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
