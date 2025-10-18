// src/pages/Register.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2 } from "lucide-react"; // Asegúrate que Loader2 esté importado
import { supabase } from "@/lib/supabaseClient";
import { AuthError } from '@supabase/supabase-js';
import { cn } from "@/lib/utils"; // Importa cn para deshabilitar el enlace

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        // --- Validaciones Previas ---
        if (!name.trim()) {
            toast({ title: "Error", description: "El nombre es requerido.", variant: "destructive" });
            return;
        }
        if (password !== confirmPassword) {
            toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
            return;
        }
        if (password.length < 6) {
            toast({ title: "Contraseña insegura", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive" });
            return;
        }
        // --- Fin Validaciones ---

        setIsLoading(true);
        let userId = '';

        try {
            // --- 1. Registro en Supabase Auth ---
            console.log("Intentando registrar usuario en Supabase Auth...");
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                 // No pasamos 'name' aquí si lo vamos a guardar en 'profiles'
            });

            // Manejo específico de errores de Auth
            if (authError) {
                console.error("Error en supabase.auth.signUp:", authError);
                if (authError instanceof AuthError && authError.message.includes("rate limit")) {
                    toast({ title: "Límite Excedido", description: "Demasiados intentos. Espera un momento.", variant: "destructive" });
                } else if (authError instanceof AuthError && (authError.message.includes("already registered") || authError.message.includes("unique constraint"))) {
                    toast({ title: "Email ya registrado", description: "Intenta iniciar sesión o usa otro email.", variant: "destructive" });
                } else {
                    throw new Error(`Error de autenticación: ${authError.message}`);
                }
                setIsLoading(false);
                return;
            }

            // Obtener ID de usuario
            if (authData.user) {
                userId = authData.user.id;
                console.log("Usuario registrado directamente. ID:", userId);
            } else {
                console.warn("authData.user es null post-signUp. Intentando getUser...");
                await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa
                const { data: { user }, error: getUserError } = await supabase.auth.getUser();

                if (getUserError || !user) {
                    console.error("Error obteniendo usuario después de signUp:", getUserError);
                    toast({
                        title: "Revisa tu email",
                        description: "Usuario registrado. Puede que necesites confirmar tu correo.",
                    });
                    setIsLoading(false);
                    return; // No podemos crear perfil sin ID
                }
                userId = user.id;
                console.log("Usuario obtenido con getUser. ID:", userId);
            }

            // --- 2. Inserción en la Tabla 'profiles' (UNA SOLA VEZ) ---
            if (!userId) {
                throw new Error("No se pudo determinar el ID del usuario para crear el perfil.");
            }

            console.log(`Intentando insertar perfil para User ID: ${userId} con nombre: ${name}`);
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,        // ID del usuario de Auth
                    name: name.trim(), // Nombre proporcionado
                    // created_at se inserta automáticamente por el default value en la DB
                });

            // Verificación del error de perfil
            if (profileError) {
                console.error(">>> DETALLE DEL ERROR AL CREAR PERFIL:", JSON.stringify(profileError, null, 2));
                // Aquí podrías decidir si eliminar el usuario de auth.users si la creación del perfil es crítica
                // await supabase.auth.admin.deleteUser(userId); // ¡Requiere clave de servicio! No usar en frontend.
                throw new Error(`Error al guardar el perfil: ${profileError.message}`);
            }

            console.log("Perfil insertado correctamente en la base de datos.");

            // --- Éxito Total ---
            toast({
                title: "¡Registro Completado!",
                description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
            });

            navigate("/login"); // Redirigir a la página de inicio de sesión

        } catch (error: any) {
            // Captura cualquier error lanzado
            console.error("Error en el flujo handleRegister:", error);
            // Muestra el error específico que fue lanzado (ya sea de Auth o de Perfil)
            toast({
                title: "Error en el registro",
                description: error.message || "Ocurrió un problema inesperado.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false); // Asegura que el estado de carga termine
        }
    };

    // --- JSX ---
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <UserPlus className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
                    <CardDescription className="text-center">
                        Regístrate para comenzar a analizar datos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <div className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Registrando...
                                </div>
                            ) : (
                                "Crear Cuenta"
                            )}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
                        {/* Deshabilitar enlace durante la carga */}
                        <Link
                          to="/login"
                          className={cn(
                            "text-primary hover:underline font-medium",
                            isLoading && "pointer-events-none opacity-50"
                          )}
                          aria-disabled={isLoading} // Accesibilidad
                          tabIndex={isLoading ? -1 : undefined} // Accesibilidad
                        >
                            Iniciar sesión
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Register;