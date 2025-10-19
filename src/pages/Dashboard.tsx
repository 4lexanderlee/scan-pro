import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LogOut, Plus, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import FileUpload from "@/components/analysis/FileUpload";
import { DatasetInfo } from "@/pages/Analysis";
// [AÑADIR] Importar cliente Supabase
import { supabase } from "@/lib/supabaseClient"; 

// --- INTERFACES (Ajustadas a la DB) ---
interface Model {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  createdAt: string;
  framework?: string;
}

interface ProjectDB {
  id_projects: string; // ID real en la DB (PK)
  user_id: string;     // FK al usuario autenticado
  name: string;
  description: string;
  datasetName: string;
  models: Model[];
  createdAt: string;
}

interface Project extends Omit<ProjectDB, 'id_projects'> {
  id: string; // El frontend usará 'id' como alias de id_projects
}

interface SupabaseUser {
  id: string;
  email: string;
  name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- [REEMPLAZAR] Lógica de Autenticación y Carga de Proyectos (ROBUSTO) ---
  useEffect(() => {
    const checkAuthAndLoadProjects = async () => {
      setIsLoading(true);

      try {
        // 1. Obtener usuario de Supabase
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!supabaseUser) {
          navigate("/login");
          return;
        }
          
        // 2. Obtener perfil (name) - RLS OFF debería funcionar, pero manejamos errores.
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', supabaseUser.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found (perfil no creado aún)
            console.warn("Error loading profile:", profileError);
        }
        
        const userName = profile?.name || 'Usuario';
        // Mantener localStorage para el flujo de la aplicación que espera el usuario
        localStorage.setItem("currentUser", JSON.stringify({ email: supabaseUser.email, name: userName }));
        
        setUser({ id: supabaseUser.id, email: supabaseUser.email || '', name: userName });
        

        // 3. Cargar proyectos
        const { data: fetchedProjects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', supabaseUser.id) 
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error("Projects load error (RLS?):", projectsError);
          toast({
            title: "Error al cargar proyectos (RLS)",
            description: projectsError.message,
            variant: "destructive",
          });
        } else {
          // Mapear id_projects a 'id' para uso en el frontend
          const mappedProjects = (fetchedProjects as ProjectDB[]).map(p => ({
              ...p,
              id: p.id_projects, 
              models: p.models || []
          }));
          setProjects(mappedProjects);
        }

      } catch (e: any) {
        // Captura errores críticos de conexión o autenticación
        console.error("Critical error in Dashboard load:", e);
        toast({
          title: "Error crítico de conexión",
          description: e.message || "Revisa las claves de Supabase o la conexión de red.",
          variant: "destructive",
        });
      } finally {
        // [CLAVE] Aseguramos que la carga termine para que el contenido se muestre (o el error)
        setIsLoading(false);
      }
    };

    checkAuthAndLoadProjects();
  }, [navigate, toast]);


  // --- [REEMPLAZAR] Lógica de Logout ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error al cerrar sesión",
        description: "Inténtalo de nuevo.",
        variant: "destructive",
      });
      return;
    }
    localStorage.removeItem("currentUser");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate("/login");
  };

  // --- [REEMPLAZAR] Lógica de Borrado de Proyectos ---
  const handleDeleteProject = async (projectId: string) => {
    // RLS y FK CASCADE en projects se encargarán de borrar el proyecto y sus datasets.
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id_projects', projectId); 

    if (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto.",
        variant: "destructive",
      });
      return;
    }

    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    
    toast({
      title: "Proyecto eliminado",
      description: "El proyecto ha sido eliminado correctamente",
    });
  };
  
  const handleDownloadProject = (project: Project) => {
    // Lógica de descarga JSON se mantiene
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  

  // --- [MODIFICAR] Lógica de Carga de Dataset (solo recibe el ID del proyecto CREADO) ---
  const handleDatasetLoaded = (dataset: DatasetInfo, projectId: string) => {
    
    // Crear objeto temporal para actualizar la UI sin recargar
    const newProject: Project = {
        id: projectId, // ID del proyecto recién creado
        user_id: user?.id || '',
        name: projectName || "Proyecto sin nombre",
        description: projectDescription || "",
        datasetName: dataset.name,
        models: [],
        createdAt: new Date().toISOString(),
    };
    
    // Añadir el nuevo proyecto al inicio de la lista
    setProjects(prev => [newProject, ...prev]);
    setIsNewProjectOpen(false);

    // Navegar a la limpieza con los datos necesarios
    navigate("/cleaning", { 
      state: { 
        dataset,
        projectId: projectId, 
        projectName: newProject.name,
        projectDescription: newProject.description
      } 
    });

    setProjectName("");
    setProjectDescription("");
  };

  if (isLoading || !user) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <span className="text-xl font-semibold text-primary">Cargando Dashboard...</span>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Bienvenido, {user.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button onClick={() => setIsNewProjectOpen(true)} size="lg" className="w-full sm:w-auto">
            <Plus className="mr-2 h-5 w-5" />
            Crear un nuevo proyecto
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Mis Proyectos</h2>
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
                <Card 
                  key={project.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                  onClick={() => navigate(`/project/${project.id}`)}
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
                      <span className="font-semibold">{project.models.length}</span>
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
                        onClick={() => handleDownloadProject(project)}
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

      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear nuevo proyecto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
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

            {/* --- [MODIFICAR PROPS DE FILEUPLOAD] --- */}
            {user?.id && (
              <FileUpload 
                onDatasetLoaded={handleDatasetLoaded as any} 
                userId={user.id} 
                projectName={projectName} 
                projectDescription={projectDescription}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;