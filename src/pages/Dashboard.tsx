// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/analysis/FileUpload";
import { ArrowLeft, BarChart3, Download, Plus, Trash2, LogOut } from "lucide-react";
import { DatasetInfo } from "@/pages/Analysis";
import { supabase } from "@/lib/supabaseClient"; // Importar supabase
import { Session, User } from '@supabase/supabase-js'; // Importar tipos

// ... (interfaces Model y Project sin cambios)
interface Model {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  createdAt: string;
  framework?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  datasetName: string;
  models: Model[];
  createdAt: string;
  user_id?: string; // IMPORTANTE: Añadir user_id para asociar proyectos
}


const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null); // Usar el tipo User de Supabase
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Estado de carga inicial

  useEffect(() => {
    const fetchSessionAndProjects = async () => {
      setIsLoading(true);
      // 1. Obtener la sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError);
        navigate("/login"); // Si hay error, redirigir a login
        return;
      }

      if (!session) {
        navigate("/login"); // Si no hay sesión, redirigir a login
        return;
      }

      // Guardar sesión y usuario
      setSession(session);
      setUser(session.user);

      // 2. Obtener los proyectos del usuario actual desde la base de datos
      //    (¡Necesitas crear una tabla 'projects' en Supabase!)
      //    Asumiendo que tienes una tabla 'projects' con una columna 'user_id'
      //    que es una foreign key a auth.users.id

      /*
      // --- EJEMPLO CON TABLA 'projects' ---
      const { data: userProjects, error: projectsError } = await supabase
        .from('projects') // Nombre de tu tabla de proyectos
        .select('*') // Selecciona todas las columnas
        .eq('user_id', session.user.id); // Filtra por el ID del usuario actual

      if (projectsError) {
        console.error("Error obteniendo proyectos:", projectsError);
        toast({ title: "Error", description: "No se pudieron cargar los proyectos.", variant: "destructive" });
      } else {
        setProjects(userProjects || []);
      }
      */

      // --- MIENTRAS NO HAY TABLA 'projects' EN SUPABASE (Usando LocalStorage temporalmente) ---
      // ¡Recuerda migrar esto a Supabase!
      // Asociar proyectos de LocalStorage al usuario actual podría ser complejo
      // si varios usuarios usan la misma máquina. Es mejor empezar a guardarlos
      // en Supabase asociados al user_id.
      // Por ahora, solo cargamos los del LocalStorage como antes, pero esto
      // NO está filtrado por usuario.
       const savedProjects = JSON.parse(localStorage.getItem("projects") || "[]");
       setProjects(savedProjects);
      // --- FIN DEL CÓDIGO TEMPORAL ---


      setIsLoading(false);
    };

    fetchSessionAndProjects();

    // Escuchar cambios en la autenticación (login, logout en otra pestaña, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/login'); // Si la sesión expira o se cierra, redirige a login
      }
    });

    // Limpiar la suscripción al desmontar el componente
    return () => subscription.unsubscribe();

  }, [navigate, toast]); // Añadimos toast a las dependencias

  const handleLogout = async () => {
    setIsLoading(true); // Opcional: mostrar indicador de carga
    const { error } = await supabase.auth.signOut();
    setIsLoading(false);

    if (error) {
      console.error("Error al cerrar sesión:", error);
      toast({ title: "Error", description: "No se pudo cerrar sesión.", variant: "destructive" });
    } else {
      // No necesitas eliminar nada de LocalStorage, Supabase lo maneja
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      // La redirección a /login la manejará onAuthStateChange
    }
  };

  const handleDeleteProject = async (projectId: string) => {
      // --- Lógica con Supabase ---
      /*
      if (!user) return;
      const { error } = await supabase
          .from('projects')
          .delete()
          .match({ id: projectId, user_id: user.id }); // Asegura que solo borre sus propios proyectos

      if (error) {
          console.error("Error eliminando proyecto:", error);
          toast({ title: "Error", description: "No se pudo eliminar el proyecto.", variant: "destructive" });
      } else {
          setProjects(projects.filter(p => p.id !== projectId));
          toast({ title: "Proyecto eliminado", description: "El proyecto ha sido eliminado." });
      }
      */

      // --- Lógica temporal con LocalStorage (NO FILTRA POR USUARIO) ---
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      localStorage.setItem("projects", JSON.stringify(updatedProjects));
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado correctamente (LocalStorage)",
      });
      // --- Fin lógica temporal ---
  };


  // handleDownloadProject no necesita cambios por ahora

  const handleDatasetLoaded = async (dataset: DatasetInfo) => {
    if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión para crear un proyecto.", variant: "destructive" });
        return;
    }

    const newProjectData = {
      // id: Date.now().toString(), // Supabase generará un ID (si es primary key tipo UUID)
      name: projectName || "Proyecto sin nombre",
      description: projectDescription || "",
      datasetName: dataset.name,
      // models: [], // Esto se manejará de otra forma, quizás en otra tabla
      createdAt: new Date().toISOString(),
      user_id: user.id // ¡Asociar con el usuario actual!
    };


    // --- Lógica con Supabase ---
    /*
    const { data: insertedProject, error } = await supabase
        .from('projects')
        .insert(newProjectData)
        .select() // Devuelve el proyecto insertado
        .single(); // Esperamos solo un resultado

    if (error) {
        console.error("Error creando proyecto:", error);
        toast({ title: "Error", description: "No se pudo crear el proyecto.", variant: "destructive" });
        return;
    }

    if (!insertedProject) {
        toast({ title: "Error", description: "No se pudo obtener el proyecto creado.", variant: "destructive" });
        return;
    }

    // Actualiza el estado local de proyectos
    setProjects([...projects, insertedProject]);

    setIsNewProjectOpen(false);
    navigate("/cleaning", {
      state: {
        dataset,
        projectId: insertedProject.id, // Usar el ID de Supabase
        projectName: insertedProject.name,
        projectDescription: insertedProject.description
      }
    });
    setProjectName("");
    setProjectDescription("");
    */

    // --- Lógica temporal con LocalStorage (NO FILTRA POR USUARIO) ---
     const newProjectWithId: Project = {
       ...newProjectData,
       id: Date.now().toString(), // Generar ID temporal
       models: [] // Añadir array de modelos vacío
     };
     const savedProjects = JSON.parse(localStorage.getItem("projects") || "[]");
     savedProjects.push(newProjectWithId);
     localStorage.setItem("projects", JSON.stringify(savedProjects));
     // localStorage.setItem("currentProject", JSON.stringify(newProjectWithId)); // Quizás ya no necesites esto

     setProjects(savedProjects); // Actualiza estado local

     setIsNewProjectOpen(false);
     navigate("/cleaning", {
       state: {
         dataset,
         projectId: newProjectWithId.id,
         projectName: newProjectWithId.name,
         projectDescription: newProjectWithId.description
       }
     });
     setProjectName("");
     setProjectDescription("");
     toast({ title: "Proyecto creado", description: "Proyecto guardado en LocalStorage (temporal)." });
    // --- Fin lógica temporal ---
  };


  // Muestra un indicador de carga mientras se obtiene la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  // Si después de cargar no hay usuario (aunque no debería llegar aquí por la redirección)
  if (!user) return null;


  // Extraer el nombre del usuario. Supabase Auth puede almacenarlo en diferentes lugares.
  // 1. Desde user_metadata (si lo pasaste en signUp options.data)
  // 2. Podrías obtenerlo de tu tabla 'profiles' si la creaste.
  const userName = user.user_metadata?.name || user.email; // Usar email como fallback

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
       <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              {/* Usar userName extraído */}
              <p className="text-sm text-muted-foreground">Bienvenido, {userName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

       {/* Resto del JSX del Dashboard... (la lógica de mostrar proyectos necesita ajustarse si usas Supabase) */}
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* ... Botón "Crear nuevo proyecto" ... */}
             <div className="mb-8">
               <Button onClick={() => setIsNewProjectOpen(true)} size="lg" className="w-full sm:w-auto">
                   <Plus className="mr-2 h-5 w-5" />
                   Crear un nuevo proyecto
               </Button>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Mis Proyectos</h2>
              {/* Lógica para mostrar proyectos (ajustada para usar 'projects' del estado) */}
               {projects.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                      <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                          Aún no tienes proyectos guardados.<br />
                          ¡Comienza creando tu primer proyecto!
                      </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    // ... (Mapeo de projectos como antes, usando la variable 'projects' del estado)
                     <Card
                       key={project.id}
                       className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                       onClick={() => navigate(`/project/${project.id}`)} // Navegar a la vista de detalles/predicciones
                     >
                        <CardHeader>
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            <CardDescription>
                            {project.description || "Sin descripción"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Dataset:</span>
                            <Badge variant="secondary">{project.datasetName}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Modelos:</span>
                            {/* Ajustar si los modelos se guardan diferente con Supabase */}
                            <span className="font-semibold">{project.models?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Creado:</span>
                            <span className="text-sm">{new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    // onClick={() => handleDownloadProject(project)} // La descarga puede seguir igual por ahora
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Descargar
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteProject(project.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                     </Card>
                  ))}
                </div>
              )}
            </div>
        </div>

      {/* ... (Dialog para nuevo proyecto, FileUpload no cambia) ... */}
       <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
         <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Crear nuevo proyecto</DialogTitle>
           </DialogHeader>
           <div className="space-y-6">
             {/* Formulario para nombre/descripción del proyecto */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="projectName">Nombre del proyecto</Label>
                    <Input
                      id="projectName"
                      placeholder="Ej: Análisis de ventas 2024"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectDescription">Descripción</Label>
                    <Textarea
                      id="projectDescription"
                      placeholder="Describe brevemente tu proyecto..."
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>
             {/* Componente para subir archivo */}
             <FileUpload onDatasetLoaded={handleDatasetLoaded} />
           </div>
         </DialogContent>
       </Dialog>
    </div>
  );
};

export default Dashboard;