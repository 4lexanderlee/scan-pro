import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, Brain, LineChart, Cpu } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(220_20%_18%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(220_20%_18%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <span className="text-sm text-muted-foreground">Plataforma profesional de manejo de datos</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent leading-tight">
          Scan Pro
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Procesa, analiza y modela datos con las mejores herramientas.
          <br />
          <span className="text-foreground font-semibold">Pandas • NumPy • Scikit-Learn • PyTorch</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/login">
            <Button variant="hero" size="lg" className="text-lg group">
              Comenzar ahora
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>             
          </Link>
        </div>
        
        {/* Tech stack icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Database, label: "Pandas & NumPy", desc: "Procesamiento" },
            { icon: Brain, label: "PyTorch", desc: "Deep Learning" },
            { icon: LineChart, label: "Scikit-Learn", desc: "ML Tradicional" },
            { icon: Cpu, label: "FastAPI", desc: "Backend potente" }
          ].map((item, i) => (
            <div 
              key={i}
              className="p-6 rounded-2xl bg-card/50 border border-border backdrop-blur-sm hover:bg-card/80 hover:border-primary/50 transition-all duration-300 hover:shadow-[var(--shadow-glow)]"
            >
              <item.icon className="h-8 w-8 mb-3 mx-auto text-primary" />
              <h3 className="font-semibold mb-1">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
