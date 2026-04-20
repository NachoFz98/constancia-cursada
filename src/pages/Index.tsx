import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, FileText, Download } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { generateCertificatePdf } from "@/lib/certificate";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Ingresá el nombre completo").max(120),
    email: z.string().trim().email("Email inválido").max(255),
    gender: z.enum(["masculino", "femenino"], { required_error: "Seleccioná el género" }),
    docType: z.enum(["DNI", "Cédula", "RUT"], { required_error: "Seleccioná el tipo de documento" }),
    docNumber: z.string().trim().min(3, "Ingresá el número").max(30),
    programType: z.enum(["curso", "carrera", "diplomatura"], {
      required_error: "Seleccioná el tipo",
    }),
    programName: z.string().trim().min(2, "Ingresá el nombre").max(150),
    startDate: z.date({ required_error: "Seleccioná la fecha de inicio" }),
    endDate: z.date({ required_error: "Seleccioná la fecha de fin" }),
    days: z.array(z.string()).min(1, "Seleccioná al menos un día"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    issueDate: z.date({ required_error: "Seleccioná la fecha de emisión" }),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "La fecha de fin debe ser posterior al inicio",
    path: ["endDate"],
  })
  .refine(
    (d) => (d.programType === "diplomatura" ? d.days.length >= 1 : d.days.length === 1),
    { message: "Para curso/carrera seleccioná un solo día", path: ["days"] },
  );

type FormValues = z.infer<typeof schema>;

const Index = () => {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      docNumber: "",
      programName: "",
      days: [],
      startTime: "18:00",
      endTime: "21:00",
      issueDate: new Date(),
    },
  });

  const programType = form.watch("programType");
  const isMulti = programType === "diplomatura";

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      generateCertificatePdf(values);
      toast.success("Constancia generada", {
        description: `Se descargó el archivo ${values.email}.pdf`,
      });
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar la constancia");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Generador de Constancias
            </h1>
            <p className="text-sm text-muted-foreground">
              Completá los datos y descargá la constancia en PDF.
            </p>
          </div>
        </header>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Datos de la constancia</CardTitle>
            <CardDescription>
              El archivo se descargará con el nombre del email del estudiante.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Datos personales */}
                <section className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nombre completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: María Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="estudiante@correo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Género</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="femenino">Femenino</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="docType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de documento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DNI">DNI</SelectItem>
                            <SelectItem value="Cédula">Cédula</SelectItem>
                            <SelectItem value="RUT">RUT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="docNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de documento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 30.123.456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                {/* Curso */}
                <section className="grid gap-4 md:grid-cols-2 border-t pt-6">
                  <FormField
                    control={form.control}
                    name="programType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v);
                            // Reset days when switching to/from single-day mode
                            if (v !== "diplomatura") {
                              const current = form.getValues("days");
                              if (current.length > 1) form.setValue("days", current.slice(0, 1));
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="curso">Curso</SelectItem>
                            <SelectItem value="carrera">Carrera</SelectItem>
                            <SelectItem value="diplomatura">Diplomatura</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="programName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del curso/carrera</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Desarrollo Web Full Stack" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DateField name="startDate" label="Fecha de inicio" form={form} />
                  <DateField name="endDate" label="Fecha de fin" form={form} />

                  <FormField
                    control={form.control}
                    name="days"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>
                          {isMulti ? "Días de cursada (varios)" : "Día de cursada"}
                        </FormLabel>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                          {DAYS.map((day) => {
                            const checked = field.value?.includes(day);
                            return (
                              <label
                                key={day}
                                className={cn(
                                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
                                  checked
                                    ? "border-primary bg-primary/5 text-foreground"
                                    : "border-input hover:bg-accent",
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(c) => {
                                    if (isMulti) {
                                      field.onChange(
                                        c
                                          ? [...(field.value || []), day]
                                          : (field.value || []).filter((d) => d !== day),
                                      );
                                    } else {
                                      field.onChange(c ? [day] : []);
                                    }
                                  }}
                                />
                                <span>{day}</span>
                              </label>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de inicio</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de fin</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <section className="border-t pt-6">
                  <DateField name="issueDate" label="Fecha de emisión" form={form} />
                </section>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={submitting} size="lg" className="gap-2">
                    <Download className="h-4 w-4" />
                    {submitting ? "Generando..." : "Generar PDF"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

// Reusable date field
function DateField({
  name,
  label,
  form,
}: {
  name: "startDate" | "endDate" | "issueDate";
  label: string;
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {field.value
                    ? format(field.value, "d 'de' MMMM 'de' yyyy", { locale: es })
                    : "Seleccionar fecha"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default Index;
