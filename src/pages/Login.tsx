// src/pages/Login.tsx
import { useState, useEffect } from "react"; // Añadir useEffect
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; // Importa el cliente Supabase

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirigir si ya hay sesión al montar el componente
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error; // Lanza el error para capturarlo abajo
      }

      // Si llegamos aquí, el inicio de sesión fue exitoso
      // Supabase maneja la sesión automáticamente (usualmente en LocalStorage seguro)
      // console.log("Inicio de sesión exitoso:", data);

      toast({
        title: "¡Bienvenido de nuevo!",
        description: "Has iniciado sesión correctamente",
      });
      navigate("/dashboard"); // Redirige al dashboard

    } catch (error: any) {
      console.error("Error en el inicio de sesión:", error);
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Email o contraseña incorrectos. Verifica tus credenciales.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          {/* ... (resto del CardHeader sin cambios) */}
          <div className="flex items-center justify-center mb-4">
             <LogIn className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
             Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
           {/* ... (resto del CardContent sin cambios) */}
           <div className="mt-4 text-center text-sm">
             <span className="text-muted-foreground">¿No tienes cuenta? </span>
             <Link to="/register" className="text-primary hover:underline font-medium">
                 Crear cuenta
             </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;