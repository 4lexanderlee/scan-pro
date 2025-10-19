import { useCallback } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import Papa from "papaparse";
import { toast } from "@/hooks/use-toast";
import { DatasetInfo } from "@/pages/Analysis";
// [AÑADIR] Importar cliente Supabase
import { supabase } from "@/lib/supabaseClient"; 

interface FileUploadProps {
  userId: string;
  projectName: string;
  projectDescription: string;
  onDatasetLoaded: (dataset: DatasetInfo, projectId: string) => void;
}

const FileUpload = ({ userId, projectName, projectDescription, onDatasetLoaded }: FileUploadProps) => {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Formato incorrecto",
        description: "Por favor, sube un archivo CSV",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async (results) => { // Hacer la función `complete` asíncrona
        if (results.errors.length > 0) {
          toast({
            title: "Error al procesar CSV",
            description: "Revisa el formato de tu archivo",
            variant: "destructive",
          });
          return;
        }

        const data = results.data as any[];
        const columns = results.meta.fields || [];

        if (data.length === 0 || columns.length === 0) {
          toast({
            title: "Archivo vacío",
            description: "El CSV no contiene datos válidos",
            variant: "destructive",
          });
          return;
        }

        // --- [1] CREAR EL REGISTRO DEL PROYECTO (projects) ---
        // Generar un ID temporal para usarlo en la ruta de Storage
        const { data: projectInsert, error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: userId,
            name: projectName || file.name.replace('.csv', ''),
            description: projectDescription || "Dataset inicial cargado",
            datasetName: file.name, 
            models: [],
          })
          .select('id_projects') // Obtener el ID generado por la DB
          .single();

        if (projectError) {
          console.error("Supabase Project Insert Error:", projectError);
          toast({
            title: "Error en el Proyecto",
            description: projectError.message,
            variant: "destructive",
          });
          return;
        }
        
        const newProjectId = projectInsert.id_projects;

        // --- [2] SUBIR EL ARCHIVO A SUPABASE STORAGE ---
        // Ruta: [user_id]/[project_id]/[file_name.csv]
        const storagePath = `${userId}/${newProjectId}/${file.name}`; 

        const { error: uploadError } = await supabase.storage
          .from('project_files') // Nombre del bucket
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase Storage Upload Error:", uploadError);
          toast({
            title: "Error de Subida de Archivo",
            description: uploadError.message,
            variant: "destructive",
          });
          return;
        }

        // --- [3] INSERTAR METADATOS DEL DATASET (datasets) ---
        const { error: datasetError } = await supabase
          .from('datasets')
          .insert({
            project_id: newProjectId,
            file_name: file.name,
            storage_path: storagePath,
            rows_count: data.length,
            columns_info: columns,
          });

        if (datasetError) {
          console.error("Supabase Dataset Insert Error:", datasetError);
          // Si esto falla, el archivo y el proyecto quedan en la DB/Storage, pero sin metadatos completos.
          toast({
            title: "Error al registrar metadatos",
            description: "El proyecto y archivo se crearon, pero falló el registro del dataset. Revísalo.",
            variant: "destructive",
          });
          return;
        }
        
        // Preparar el objeto para la navegación
        const newDatasetInfo: DatasetInfo = {
          name: file.name,
          rows: data.length,
          columns,
          data,
          uploadedAt: new Date(),
        };

        toast({
          title: "Dataset cargado",
          description: `${data.length} filas y ${columns.length} columnas procesadas. Proyecto creado.`,
        });

        // --- [4] CONTINUAR EL FLUJO ---
        onDatasetLoaded(newDatasetInfo, newProjectId);
      },
      error: (error) => {
        toast({
          title: "Error al leer archivo",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }, [userId, projectName, projectDescription, onDatasetLoaded, toast]); 

  return (
    <Card className="p-12 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
          <FileSpreadsheet className="h-10 w-10 text-primary-foreground" />
        </div>
        
        <h3 className="text-2xl font-semibold mb-2">Importa tu dataset</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Sube un archivo CSV para comenzar el análisis. Soportamos archivos con encabezados.
        </p>
        
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--gradient-primary)] text-primary-foreground font-semibold hover:shadow-[var(--shadow-glow)] transition-all">
            <Upload className="h-5 w-5" />
            Seleccionar archivo CSV
          </div>
        </label>
        
        <p className="text-xs text-muted-foreground mt-4">
          Máximo 20MB • Formato CSV con encabezados
        </p>
      </div>
    </Card>
  );
};

export default FileUpload;