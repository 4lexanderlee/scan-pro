// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// Importar iconos necesarios y Loader2
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils"; // Importar cn

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // Estado para visibilidad de contraseña
    const [showPassword, setShowPassword] = useState(false);
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

    // Función para alternar visibilidad
    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
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
                        {/* Input Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="juancarlos_@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Input Contraseña con Ojo */}
                        <div className="space-y-2 relative"> {/* Añadido relative */}
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"} // Tipo dinámico
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="pr-10" // Padding a la derecha para el icono
                            />
                            <Button
                                type="button" // Evita submit del form
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-[28px] h-7 px-2" // Posicionamiento
                                onClick={togglePasswordVisibility}
                                disabled={isLoading}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>

                        {/* Botón Submit */}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <div className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </div>
                             ) : (
                                "Iniciar Sesión"
                             )}
                        </Button>
                    </form>
                    {/* Enlace a Registro */}
                    <div className="mt-4 text-center text-sm">
                         <span className="text-muted-foreground">¿No tienes cuenta? </span>
                         <Link
                             to="/register"
                             className={cn(
                                "text-primary hover:underline font-medium",
                                isLoading && "pointer-events-none opacity-50"
                             )}
                             aria-disabled={isLoading}
                             tabIndex={isLoading ? -1 : undefined}
                         >
                             Crear cuenta
                         </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;