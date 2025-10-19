// src/pages/Register.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// Importar iconos de ojo y Loader2
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { AuthError } from '@supabase/supabase-js';
import { cn } from "@/lib/utils";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // Estados para visibilidad de contraseñas
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();

    // --- Función handleRegister (SIN CAMBIOS RESPECTO A LA ÚLTIMA VERSIÓN) ---
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
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data: { user }, error: getUserError } = await supabase.auth.getUser();

                if (getUserError || !user) {
                    console.error("Error obteniendo usuario después de signUp:", getUserError);
                    toast({
                        title: "Revisa tu email",
                        description: "Usuario registrado. Puede que necesites confirmar tu correo.",
                    });
                    setIsLoading(false);
                    return;
                }
                userId = user.id;
                console.log("Usuario obtenido con getUser. ID:", userId);
            }

            // --- 2. Inserción en la Tabla 'profiles' ---
            if (!userId) {
                throw new Error("No se pudo determinar el ID del usuario para crear el perfil.");
            }

            console.log(`Intentando insertar perfil para User ID: ${userId} con nombre: ${name}`);
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    name: name.trim(),
                });

            if (profileError) {
                console.error(">>> DETALLE DEL ERROR AL CREAR PERFIL:", JSON.stringify(profileError, null, 2));
                throw new Error(`Error al guardar el perfil: ${profileError.message}`);
            }

            console.log("Perfil insertado correctamente en la base de datos.");

            // --- Éxito Total ---
            toast({
                title: "¡Registro Completado!",
                description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
            });

            navigate("/login");

        } catch (error: any) {
            console.error("Error en el flujo handleRegister:", error);
            toast({
                title: "Error en el registro",
                description: error.message || "Ocurrió un problema inesperado.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };
    // --- Fin Función handleRegister ---

    // Funciones para alternar visibilidad
    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    // --- JSX con iconos de ojo ---
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
                        {/* Input Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
                        </div>
                        {/* Input Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                        </div>

                        {/* Input Contraseña con Ojo */}
                        <div className="space-y-2 relative"> {/* Añadido relative */}
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"} // Tipo dinámico
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
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

                        {/* Input Confirmar Contraseña con Ojo */}
                        <div className="space-y-2 relative"> {/* Añadido relative */}
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"} // Tipo dinámico
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="pr-10" // Padding a la derecha para el icono
                            />
                            <Button
                                type="button" // Evita submit del form
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-[28px] h-7 px-2" // Posicionamiento
                                onClick={toggleConfirmPasswordVisibility}
                                disabled={isLoading}
                                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showConfirmPassword ? (
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
                                    Registrando...
                                </div>
                            ) : (
                                "Crear Cuenta"
                            )}
                        </Button>
                    </form>
                    {/* Enlace a Login */}
                    <div className="mt-4 text-center text-sm">
                        <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
                        <Link
                          to="/login"
                          className={cn(
                            "text-primary hover:underline font-medium",
                            isLoading && "pointer-events-none opacity-50"
                          )}
                          aria-disabled={isLoading}
                          tabIndex={isLoading ? -1 : undefined}
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