import * as React from "react";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useVelocity, useSpring } from "framer-motion";
import backgroundImg from "../assets/background.png";

// Custom hook for mouse position tracking
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return mousePosition;
};

// Custom cursor component
const CustomCursor = () => {
  const mousePosition = useMousePosition();
  const [cursorType, setCursorType] = React.useState('default');
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);
    
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Add event listeners to change cursor on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"]');
    
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => setCursorType('pointer'));
      el.addEventListener('mouseleave', () => setCursorType('default'));
    });
    
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', () => setCursorType('pointer'));
        el.removeEventListener('mouseleave', () => setCursorType('default'));
      });
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <>
      {/* Outer circle - follows with delay */}
      <motion.div 
        className="fixed pointer-events-none z-50 rounded-full mix-blend-difference"
        animate={{
          x: mousePosition.x - 24,
          y: mousePosition.y - 24,
          scale: cursorType === 'pointer' ? 1.5 : 1
        }}
        transition={{
          type: 'spring',
          mass: 0.5,
          damping: 20,
          stiffness: 200
        }}
        style={{
          width: '48px',
          height: '48px',
          backgroundColor: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}
      />
      
      {/* Inner dot - follows cursor exactly */}
      <motion.div 
        className="fixed pointer-events-none z-50 rounded-full bg-white mix-blend-difference"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4
        }}
        style={{
          width: '8px',
          height: '8px'
        }}
      />
    </>
  );
};

// Magnetic button component
const MagneticButton = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Scale down the movement (adjust the divisor to control the magnetic effect strength)
    setPosition({ x: distanceX / 5, y: distanceY / 5 });
  };
  
  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };
  
  return (
    <motion.button
      ref={buttonRef}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: position.x,
        y: position.y
      }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.1
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
};

// Interactive particles canvas component
const ParticlesCanvas = ({ scrollProgress }: { scrollProgress: number }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mousePosition = useMousePosition();
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const particlesRef = React.useRef<any[]>([]);
  const animationRef = React.useRef<number>(0);

  // Handle resize
  React.useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize particles
  React.useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const particleCount = Math.floor(dimensions.width * dimensions.height / 20000);
    particlesRef.current = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      hue: Math.random() > 0.7 ? 0 : Math.random() > 0.5 ? 350 : 220,
    }));
  }, [dimensions]);

  // Animation loop
  React.useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Mouse influence variables
      const mouseRadius = 100;
      const mouseStrength = 1;
      const scrollEffect = scrollProgress * 5;

      particlesRef.current.forEach(p => {
        // Calculate distance to mouse
        const dx = mousePosition.x - p.x;
        const dy = mousePosition.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Apply mouse influence
        if (distance < mouseRadius) {
          const influence = 1 - distance / mouseRadius;
          p.x -= dx * influence * mouseStrength * 0.05;
          p.y -= dy * influence * mouseStrength * 0.05;
        }

        // Apply scrolling effect
        p.y += scrollEffect * 0.1;

        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Handle boundaries
        if (p.x < 0) p.x = dimensions.width;
        if (p.x > dimensions.width) p.x = 0;
        if (p.y < 0) p.y = dimensions.height;
        if (p.y > dimensions.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        const lightness = 70 + scrollProgress * 10;
        ctx.fillStyle = `hsla(${p.hue}, 100%, ${lightness}%, ${p.opacity})`;
        ctx.fill();

        // Draw connecting lines
        particlesRef.current.forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${p.hue}, 100%, ${lightness}%, ${(1 - distance / 100) * 0.1})`;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, mousePosition, scrollProgress]);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-10 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

// Services section with 3D rotating cards
function ServiceCard({ service, index }: { service: any, index: number }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Calculate rotation based on mouse position relative to card center
    const rotateY = ((e.clientX - centerX) / width) * 20; // 20 degrees max rotation
    const rotateX = ((centerY - e.clientY) / height) * 20;
    
    setRotation({ x: rotateX, y: rotateY });
  };
  
  const resetRotation = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };
  
  return (
    <motion.div
      ref={cardRef}
      className="relative h-[400px] bg-white rounded-xl p-8 shadow-lg cursor-pointer perspective-1000 overflow-hidden group"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      style={{
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={resetRotation}
    >
      {/* Glossy overlay */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
          transform: 'translateZ(1px)'
        }}
      />
      
      {/* Card content with 3D effect */}
      <div className="h-full flex flex-col" style={{ transform: 'translateZ(40px)' }}>
        <div className="text-6xl font-light text-red-500 mb-6">
          {service.icon}
        </div>
        <h3 className="text-3xl font-bold mb-6 text-black group-hover:text-red-500 transition-colors">
          {service.title}
        </h3>
        <p className="text-lg text-gray-600 mb-8 flex-grow">
          {service.description}
        </p>
        
        <motion.div 
          className="mt-auto w-12 h-12 rounded-full bg-black flex items-center justify-center"
          animate={{ 
            backgroundColor: isHovered ? '#ef4444' : '#000000',
            rotate: isHovered ? 90 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1L13 7L7 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}

// 3D Parallax Text component
const ParallaxText = ({ children, baseVelocity = 100 }: { children: React.ReactNode, baseVelocity?: number }) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false
  });
  
  const x = useTransform(baseX, (v) => `${v}px`);
  
  const directionFactor = React.useRef<number>(1);
  
  React.useEffect(() => {
    let prevT = 0;
    const rotate = (t: number) => {
      if (prevT === 0) {
        prevT = t;
        requestAnimationFrame(rotate);
        return;
      }
      
      const timeDelta = t - prevT;
      let moveBy = directionFactor.current * baseVelocity * (timeDelta / 1000);
      
      // Add the scroll velocity to the base velocity
      moveBy += directionFactor.current * moveBy * velocityFactor.get();
      
      baseX.set(baseX.get() + moveBy);
      
      // Check if we need to wrap
      if (baseX.get() < -10000) {
        baseX.set(0);
      }
      if (baseX.get() > 10000) {
        baseX.set(0);
      }
      
      prevT = t;
      requestAnimationFrame(rotate);
    };
    
    requestAnimationFrame(rotate);
  }, [baseVelocity, baseX, velocityFactor]);
  
  return (
    <div className="parallax flex flex-nowrap overflow-hidden whitespace-nowrap">
      <motion.div className="scroller" style={{ x }}>
        <span className="mr-12">{children}</span>
        <span className="mr-12">{children}</span>
        <span className="mr-12">{children}</span>
        <span className="mr-12">{children}</span>
      </motion.div>
    </div>
  );
};

// TiltImage component for 3D image effects
const TiltImage = ({ className, style }: { className?: string, style?: React.CSSProperties }) => {
  const tiltRef = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState({ x: 0, y: 0, scale: 1 });
  const [glowPosition, setGlowPosition] = React.useState({ x: 50, y: 50 });
  const mousePosition = useMousePosition();
  
  React.useEffect(() => {
    if (!tiltRef.current) return;
    
    const element = tiltRef.current;
    const { left, top, width, height } = element.getBoundingClientRect();
    
    // Check if mouse is over the element
    if (
      mousePosition.x >= left &&
      mousePosition.x <= left + width &&
      mousePosition.y >= top &&
      mousePosition.y <= top + height
    ) {
      // Calculate tilt
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      const percentX = (mousePosition.x - centerX) / (width / 2);
      const percentY = (mousePosition.y - centerY) / (height / 2);
      
      const tiltX = percentY * 10; // 10 degree max rotation
      const tiltY = percentX * -10;
      
      // Calculate glow position (0-100%)
      const glowX = ((mousePosition.x - left) / width) * 100;
      const glowY = ((mousePosition.y - top) / height) * 100;
      
      setTilt({ x: tiltX, y: tiltY, scale: 1.05 });
      setGlowPosition({ x: glowX, y: glowY });
    } else {
      // Reset when mouse leaves
      setTilt({ x: 0, y: 0, scale: 1 });
    }
  }, [mousePosition]);
  
  return (
    <div 
      ref={tiltRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        perspective: '1000px'
      }}
    >
      <motion.div
        animate={tilt}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.scale})`,
          height: '100%',
          width: '100%',
        }}
      >
        {/* Content of the tilt container */}
        <div className="h-full w-full bg-black rounded-xl overflow-hidden">
          <div 
            className="h-full w-full flex items-center justify-center relative"
            style={{
              backgroundImage: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(239, 68, 68, 0.15) 0%, rgba(0, 0, 0, 0) 60%)`,
            }}
          >
            <div className="text-white text-center p-8">
              <h3 className="text-3xl font-bold mb-6">BIRTEDI</h3>
              <p className="text-lg mb-8">Crafting exceptional brand experiences</p>
              <div className="mx-auto h-0.5 w-12 bg-red-500" />
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Glow effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0) 25%)`,
          mixBlendMode: 'screen'
        }}
      />
    </div>
  );
};

// Interactive glowing particles effect for dark sections
const GlowingParticlesEffect = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mousePosition = useMousePosition();
  const [particles, setParticles] = React.useState<Array<{x: number, y: number, size: number, life: number, color: string}>>([]);
  
  // Add particles when mouse moves
  React.useEffect(() => {
    if (!containerRef.current || (mousePosition.x === 0 && mousePosition.y === 0)) return;
    
    const container = containerRef.current;
    const { left, top, width, height } = container.getBoundingClientRect();
    
    // Only add particles if mouse is over the container
    if (
      mousePosition.x >= left &&
      mousePosition.x <= left + width &&
      mousePosition.y >= top &&
      mousePosition.y <= top + height
    ) {
      const relativeX = mousePosition.x - left;
      const relativeY = mousePosition.y - top;
      
      // Add 1-3 particles
      const newParticles = Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => ({
        x: relativeX + (Math.random() - 0.5) * 20, // Slight random offset
        y: relativeY + (Math.random() - 0.5) * 20,
        size: Math.random() * 8 + 2,
        life: 1, // Life value from 0 to 1
        color: Math.random() > 0.7 ? '#ef4444' : '#ffffff'
      }));
      
      setParticles(prev => [...prev, ...newParticles]);
    }
  }, [mousePosition]);
  
  // Update particle life and remove dead particles
  React.useEffect(() => {
    if (particles.length === 0) return;
    
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({ ...p, life: p.life - 0.02, size: p.size * 0.97 }))
          .filter(p => p.life > 0)
      );
    }, 50);
    
    return () => clearInterval(interval);
  }, [particles]);
  
  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          initial={{ opacity: 0.8, scale: 0.8 }}
          animate={{ 
            opacity: particle.life, 
            scale: 1,
            x: particle.x,
            y: particle.y
          }}
          style={{
            left: 0,
            top: 0,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            filter: 'blur(1px)',
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transform: `translate(-50%, -50%) translate(${particle.x}px, ${particle.y}px)`,
          }}
        />
      ))}
    </div>
  );
};

// WebGL shader for 3D audio-reactive grid
const vertexShaderSource = `
  attribute vec3 position;
  attribute vec2 uv;
  
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float time;
  uniform float audioLevel;
  uniform float scrollIntensity;
  uniform vec2 mousePosition;
  
  varying vec2 vUv;
  varying float vElevation;
  
  #define PI 3.1415926535897932384626433832795
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    vUv = uv;
    
    // Base grid deformation based on time
    vec3 pos = position;
    float elevation = sin(pos.x * 4.0 + time * 0.5) * cos(pos.z * 4.0 + time * 0.3) * 0.2;
    
    // Audio-reactive displacement
    elevation += audioLevel * sin(pos.x * 8.0 + pos.z * 8.0 + time) * 0.5;
    
    // Mouse influence creating waves
    float dist = distance(vec2(pos.x, pos.z) * 5.0 + 0.5, mousePosition);
    float influence = smoothstep(2.0, 0.0, dist) * scrollIntensity * 2.0;
    elevation += influence * sin(dist * 8.0 - time * 2.0) * 0.5;
    
    // Apply elevation
    pos.y += elevation;
    vElevation = elevation;
    
    // Projection
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  
  varying vec2 vUv;
  varying float vElevation;
  
  uniform float time;
  uniform float audioLevel;
  uniform vec3 baseColor;
  uniform vec3 accentColor;
  uniform float scrollIntensity;
  
  void main() {
    // Dynamic color based on elevation and audio level
    vec3 color = mix(
      baseColor,
      accentColor,
      (vElevation + 0.2) * 0.5 + audioLevel * 0.3
    );
    
    // Add glow effect intensified by audio
    float glow = smoothstep(0.4, 0.6, abs(vElevation)) * (1.0 + audioLevel);
    color += glow * accentColor * 0.6;
    
    // Add subtle grid lines
    float gridLine = smoothstep(0.03, 0.02, abs(fract(vUv.x * 20.0) - 0.5)) * 0.2 * scrollIntensity;
    gridLine += smoothstep(0.03, 0.02, abs(fract(vUv.y * 20.0) - 0.5)) * 0.2 * scrollIntensity;
    color = mix(color, accentColor, gridLine);
    
    // Apply final color with a slight fade at the edges
    float fade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x) * 
                 smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
    
    gl_FragColor = vec4(color, fade * 0.9);
  }
`;

// Audio-reactive WebGL background component
const AudioReactiveGrid = ({ scrollProgress }: { scrollProgress: number }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mousePosition = useMousePosition();
  const [audioData, setAudioData] = React.useState<{ level: number }>({ level: 0 });
  const animationRef = React.useRef<number>(0);
  const glContextRef = React.useRef<{
    gl: WebGLRenderingContext | null,
    program: WebGLProgram | null,
    startTime: number,
    uniforms: Record<string, WebGLUniformLocation | null>,
    buffers: Record<string, WebGLBuffer | null>,
    attributes: Record<string, number>,
    vao: any,
  }>({
    gl: null,
    program: null,
    startTime: Date.now(),
    uniforms: {},
    buffers: {},
    attributes: {},
    vao: null,
  });
  
  // Setup simulated audio data
  React.useEffect(() => {
    let animationFrameId: number;
    
    const simulateAudio = () => {
      const time = Date.now() / 1000;
      // Create a more complex waveform by combining multiple sine waves
      const primaryWave = Math.sin(time * 0.5) * 0.3;
      const secondaryWave = Math.sin(time * 1.3) * 0.15;
      const fastWave = Math.sin(time * 3.7) * 0.05;
      
      // Add randomness to simulate audio reactivity
      const noise = Math.random() * 0.1;
      
      // Combine all components for a natural feeling audio level
      const simulatedLevel = (primaryWave + secondaryWave + fastWave + 0.5) * 0.5 + noise * 0.2;
      
      // Ensure the level stays within 0-1 range
      const normalizedLevel = Math.max(0, Math.min(1, simulatedLevel));
      
      setAudioData({ level: normalizedLevel });
      animationFrameId = requestAnimationFrame(simulateAudio);
    };
    
    simulateAudio();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  // Initialize WebGL context
  React.useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    // Explicitly cast to WebGLRenderingContext to fix TypeScript errors
    const gl = canvas.getContext('webgl') as WebGLRenderingContext || 
               canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    
    // Enable transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Create shader program
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Could not create shaders');
      return;
    }
    
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader));
      return;
    }
    
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader));
      return;
    }
    
    // Create program and link shaders
    const program = gl.createProgram();
    if (!program) {
      console.error('Could not create program');
      return;
    }
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking failed:', gl.getProgramInfoLog(program));
      return;
    }
    
    // Use program
    gl.useProgram(program);
    
    // Get locations of attributes and uniforms
    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const uvAttributeLocation = gl.getAttribLocation(program, 'uv');
    
    const uniforms: Record<string, WebGLUniformLocation | null> = {
      modelViewMatrix: gl.getUniformLocation(program, 'modelViewMatrix'),
      projectionMatrix: gl.getUniformLocation(program, 'projectionMatrix'),
      time: gl.getUniformLocation(program, 'time'),
      audioLevel: gl.getUniformLocation(program, 'audioLevel'),
      mousePosition: gl.getUniformLocation(program, 'mousePosition'),
      baseColor: gl.getUniformLocation(program, 'baseColor'),
      accentColor: gl.getUniformLocation(program, 'accentColor'),
      scrollIntensity: gl.getUniformLocation(program, 'scrollIntensity'),
    };
    
    // Create geometry (a grid)
    const gridSize = 20;
    const gridDivisions = 30;
    const positions = [];
    const uvs = [];
    const indices = [];
    
    for (let i = 0; i <= gridDivisions; i++) {
      const x = (i / gridDivisions) * gridSize - gridSize / 2;
      for (let j = 0; j <= gridDivisions; j++) {
        const z = (j / gridDivisions) * gridSize - gridSize / 2;
        positions.push(x, 0, z);
        uvs.push(i / gridDivisions, j / gridDivisions);
      }
    }
    
    for (let i = 0; i < gridDivisions; i++) {
      for (let j = 0; j < gridDivisions; j++) {
        const a = i * (gridDivisions + 1) + j;
        const b = a + 1;
        const c = a + (gridDivisions + 1);
        const d = c + 1;
        
        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }
    
    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    // Store references
    glContextRef.current = {
      gl,
      program,
      startTime: Date.now(),
      uniforms,
      buffers: {
        position: positionBuffer,
        uv: uvBuffer,
        index: indexBuffer,
      },
      attributes: {
        position: positionAttributeLocation,
        uv: uvAttributeLocation,
      },
      vao: null,
    };
    
    // Initial resize
    handleResize();
    
    return () => {
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(uvBuffer);
        gl.deleteBuffer(indexBuffer);
      }
    };
  }, []);
  
  // Handle canvas resize
  const handleResize = React.useCallback(() => {
    if (!canvasRef.current || !glContextRef.current.gl) return;
    
    const { gl } = glContextRef.current;
    const canvas = canvasRef.current;
    const { width, height } = canvas.getBoundingClientRect();
    
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    
    gl.viewport(0, 0, canvas.width, canvas.height);
  }, []);
  
  React.useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);
  
  // Animation loop
  React.useEffect(() => {
    if (!glContextRef.current.gl || !glContextRef.current.program) return;
    
    const { gl, program, startTime, uniforms, buffers, attributes } = glContextRef.current;
    
    const animate = () => {
      if (!gl || !canvasRef.current) return;
      
      // Clear canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      // Calculate time
      const currentTime = (Date.now() - startTime) / 1000;
      
      // Set attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(attributes.position);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
      gl.vertexAttribPointer(attributes.uv, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(attributes.uv);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
      
      // Calculate matrices (simplified for this example)
      const aspect = canvasRef.current.width / canvasRef.current.height;
      const fov = Math.PI / 4;
      const near = 0.1;
      const far = 100;
      
      // Perspective projection matrix
      const f = 1.0 / Math.tan(fov / 2);
      const projectionMatrix = [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0
      ];
      
      // Model-view matrix (simplified)
      const modelViewMatrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, -10, 1 // Position the camera back 10 units
      ];
      
      // Rotate based on scroll progress
      const rotationX = scrollProgress * Math.PI * 0.1;
      const rotationY = scrollProgress * Math.PI * 0.1;
      
      // Apply rotation
      const rotatedModelViewMatrix = rotateMatrix(modelViewMatrix, rotationX, rotationY, 0);
      
      // Convert normalized mouse coordinates to grid space
      const { width, height } = canvasRef.current.getBoundingClientRect();
      const normalizedMouseX = (mousePosition.x / width) * 2 - 1;
      const normalizedMouseY = (1 - mousePosition.y / height) * 2 - 1;
      
      // Set uniforms
      gl.uniformMatrix4fv(uniforms.projectionMatrix, false, new Float32Array(projectionMatrix));
      gl.uniformMatrix4fv(uniforms.modelViewMatrix, false, new Float32Array(rotatedModelViewMatrix));
      gl.uniform1f(uniforms.time, currentTime);
      gl.uniform1f(uniforms.audioLevel, audioData.level);
      gl.uniform2f(uniforms.mousePosition, normalizedMouseX, normalizedMouseY);
      gl.uniform3f(uniforms.baseColor, 0.1, 0.1, 0.15); // Dark blue-grey
      gl.uniform3f(uniforms.accentColor, 0.9, 0.2, 0.2); // Red accent (matches the site theme)
      gl.uniform1f(uniforms.scrollIntensity, scrollProgress);
      
      // Draw grid
      const vertexCount = (30 * 30) * 6; // gridDivisions * gridDivisions * vertices per quad
      gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [mousePosition, audioData, scrollProgress]);
  
  // Utility function to apply rotation to a matrix
  const rotateMatrix = (matrix: number[], rotX: number, rotY: number, rotZ: number) => {
    // Create rotation matrices
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosZ = Math.cos(rotZ);
    const sinZ = Math.sin(rotZ);
    
    // Rotation around X axis
    const rotationX = [
      1, 0, 0, 0,
      0, cosX, sinX, 0,
      0, -sinX, cosX, 0,
      0, 0, 0, 1
    ];
    
    // Rotation around Y axis
    const rotationY = [
      cosY, 0, -sinY, 0,
      0, 1, 0, 0,
      sinY, 0, cosY, 0,
      0, 0, 0, 1
    ];
    
    // Rotation around Z axis
    const rotationZ = [
      cosZ, sinZ, 0, 0,
      -sinZ, cosZ, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    
    // Multiply matrices (very simplified implementation)
    let result = [...matrix];
    result = multiplyMatrices(result, rotationX);
    result = multiplyMatrices(result, rotationY);
    result = multiplyMatrices(result, rotationZ);
    
    return result;
  };
  
  // Simplified matrix multiplication
  const multiplyMatrices = (a: number[], b: number[]) => {
    const result = new Array(16).fill(0);
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
        }
      }
    }
    
    return result;
  };
  
  return (
    <canvas 
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-5"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

// Ambient Sound Toggle Button with updated functionality
const AmbientSoundButton = () => {
  const [isActive, setIsActive] = React.useState(false);
  
  const toggleSound = () => {
    setIsActive(!isActive);
    
    // Dispatch a custom event that other components can listen for
    window.dispatchEvent(new CustomEvent('ambient-sound-toggle', { 
      detail: { isActive: !isActive } 
    }));
  };
  
  return (
    <motion.button
      onClick={toggleSound}
      className={`fixed bottom-8 right-8 z-[100] w-12 h-12 rounded-full ${isActive ? 'bg-red-500' : 'bg-black'} flex items-center justify-center`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={isActive ? { opacity: 1 } : { opacity: 0.5 }}
      >
        {isActive ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 9L17 15M17 9L23 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
};

// VR Mode Toggle Button
const VRModeButton = () => {
  const [isVRMode, setIsVRMode] = React.useState(false);
  const [isVRSupported, setIsVRSupported] = React.useState(false);
  const [deviceOrientationPermissionState, setDeviceOrientationPermissionState] = React.useState<string | null>(null);
  
  // Check if device supports orientation events
  React.useEffect(() => {
    // Check if DeviceOrientationEvent exists in window
    const isOrientationSupported = Boolean(
      window.DeviceOrientationEvent && 
      typeof window.DeviceOrientationEvent === 'function'
    );
    
    setIsVRSupported(isOrientationSupported);
    
    // Initial permission state check (iOS 13+ requires permission)
    if (isOrientationSupported && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      setDeviceOrientationPermissionState('need-permission');
    } else if (isOrientationSupported) {
      setDeviceOrientationPermissionState('granted');
    } else {
      setDeviceOrientationPermissionState('not-supported');
    }
  }, []);
  
  // Request permission for device orientation if needed
  const requestOrientationPermission = async () => {
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        setDeviceOrientationPermissionState(permission);
        if (permission === 'granted') {
          setIsVRMode(true);
        }
      } else {
        // Permission not needed, just enable VR mode
        setIsVRMode(true);
      }
    } catch (err) {
      console.error('Error requesting device orientation permission:', err);
      setDeviceOrientationPermissionState('denied');
    }
  };
  
  const toggleVRMode = () => {
    if (!isVRMode) {
      if (deviceOrientationPermissionState === 'need-permission') {
        requestOrientationPermission();
      } else {
        setIsVRMode(true);
      }
    } else {
      setIsVRMode(false);
    }
    
    // Dispatch an event to notify other components
    window.dispatchEvent(new CustomEvent('vr-mode-toggle', { detail: { isVRMode: !isVRMode } }));
    
    // If entering VR mode, request fullscreen
    if (!isVRMode) {
      try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen();
        } else if ((docEl as any).webkitRequestFullscreen) {
          (docEl as any).webkitRequestFullscreen();
        } else if ((docEl as any).msRequestFullscreen) {
          (docEl as any).msRequestFullscreen();
        }
      } catch (err) {
        console.error('Could not enter fullscreen mode:', err);
      }
    }
  };
  
  // Return null if VR is not supported
  if (!isVRSupported) return null;
  
  return (
    <motion.button
      onClick={toggleVRMode}
      className={`fixed z-[100] bottom-8 left-8 w-12 h-12 rounded-full flex items-center justify-center ${isVRMode ? 'bg-red-500' : 'bg-black'}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        animate={{ rotateY: isVRMode ? 180 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2"/>
          <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="white" strokeWidth="2"/>
          <path d="M16 8L21 3" stroke="white" strokeWidth="2"/>
          <path d="M8 16L3 21" stroke="white" strokeWidth="2"/>
          <path d="M16 16L21 21" stroke="white" strokeWidth="2"/>
          <path d="M8 8L3 3" stroke="white" strokeWidth="2"/>
        </svg>
      </motion.div>
    </motion.button>
  );
};

// Enhanced Audio-reactive grid that supports VR mode
const EnhancedAudioReactiveGrid = ({ scrollProgress }: { scrollProgress: number }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isVRMode, setIsVRMode] = React.useState(false);
  const [deviceOrientation, setDeviceOrientation] = React.useState({ alpha: 0, beta: 0, gamma: 0 });
  
  // Listen for VR mode toggle
  React.useEffect(() => {
    const handleVRModeToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsVRMode(customEvent.detail.isVRMode);
    };
    
    window.addEventListener('vr-mode-toggle', handleVRModeToggle);
    
    return () => {
      window.removeEventListener('vr-mode-toggle', handleVRModeToggle);
    };
  }, []);
  
  // Listen for device orientation events when in VR mode
  React.useEffect(() => {
    if (!isVRMode) return;
    
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      setDeviceOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0
      });
    };
    
    window.addEventListener('deviceorientation', handleDeviceOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [isVRMode]);
  
  // Apply VR-specific styles when in VR mode
  React.useEffect(() => {
    if (!canvasRef.current) return;
    
    if (isVRMode) {
      // Make canvas fullscreen with high z-index
      canvasRef.current.style.zIndex = '1000';
      canvasRef.current.style.mixBlendMode = 'normal';
      
      // Add stereoscopic view if needed
      // ...
      
      // Add subtle head tracking effect
      const applyHeadTracking = () => {
        if (!canvasRef.current) return;
        
        const { beta, gamma } = deviceOrientation;
        const maxTilt = 15; // Maximum degrees to map
        
        // Normalize beta (forward/backward tilt) to -1 to 1 range
        const normalizedBeta = Math.max(-maxTilt, Math.min(maxTilt, beta)) / maxTilt;
        
        // Normalize gamma (left/right tilt) to -1 to 1 range
        const normalizedGamma = Math.max(-maxTilt, Math.min(maxTilt, gamma)) / maxTilt;
        
        // Apply subtle parallax effect based on device orientation
        canvasRef.current.style.transform = `translateX(${normalizedGamma * -10}px) translateY(${normalizedBeta * -10}px)`;
      };
      
      const animationFrame = requestAnimationFrame(function animate() {
        applyHeadTracking();
        requestAnimationFrame(animate);
      });
      
      return () => {
        cancelAnimationFrame(animationFrame);
        if (canvasRef.current) {
          canvasRef.current.style.zIndex = '5';
          canvasRef.current.style.mixBlendMode = 'screen';
          canvasRef.current.style.transform = '';
        }
      };
    }
  }, [isVRMode, deviceOrientation]);
  
  // Use the original AudioReactiveGrid implementation
  return (
    <AudioReactiveGrid scrollProgress={scrollProgress} />
  );
};

// Digital Portal - revolutionary "window to another dimension" effect
const DigitalPortal = () => {
  const [isPortalOpen, setIsPortalOpen] = React.useState(false);
  const [portalPosition, setPortalPosition] = React.useState({ x: 0, y: 0 });
  const [portalSize, setPortalSize] = React.useState({ width: 300, height: 400 });
  const [isDragging, setIsDragging] = React.useState(false);
  const portalRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mousePosition = useMousePosition();
  const animationRef = React.useRef<number>(0);
  
  // Function to position the portal initially
  React.useEffect(() => {
    if (!portalRef.current) return;
    
    // Position in the center of the screen initially
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    setPortalPosition({
      x: (viewportWidth - portalSize.width) / 2,
      y: (viewportHeight - portalSize.height) / 2
    });
  }, [portalSize.width, portalSize.height]);
  
  // Start the visual simulation when portal is opened
  React.useEffect(() => {
    if (!isPortalOpen || !canvasRef.current) return;
    
    // Start simulation
    startSimulation();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPortalOpen]);
  
  // Simulate portal with visual effects
  const startSimulation = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvasRef.current.width = portalSize.width;
    canvasRef.current.height = portalSize.height - 30; // Account for the header
    
    const animate = () => {
      if (!canvasRef.current) return;
      
      const time = Date.now() / 1000;
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Create a surreal background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `hsl(${(time * 20) % 360}, 70%, 20%)`);
      gradient.addColorStop(1, `hsl(${((time * 20) + 180) % 360}, 70%, 20%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add noise texture
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
        ctx.fillRect(x, y, 1, 1);
      }
      
      // Add floating objects
      for (let i = 0; i < 20; i++) {
        const x = Math.sin(time + i * 0.3) * width * 0.4 + width * 0.5;
        const y = Math.cos(time + i * 0.5) * height * 0.4 + height * 0.5;
        const size = Math.sin(time * 0.5 + i) * 10 + 15;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(i * 20 + time * 50) % 360}, 80%, 60%, 0.7)`;
        ctx.fill();
        
        // Connect with lines
        if (i > 0) {
          const prevX = Math.sin(time + (i-1) * 0.3) * width * 0.4 + width * 0.5;
          const prevY = Math.cos(time + (i-1) * 0.5) * height * 0.4 + height * 0.5;
          
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `hsla(${(i * 20 + time * 50) % 360}, 80%, 70%, 0.3)`;
          ctx.stroke();
        }
      }
      
      // Add a mouse-influenced distortion
      if (portalRef.current) {
        const portalRect = portalRef.current.getBoundingClientRect();
        const relativeX = mousePosition.x - portalRect.left;
        const relativeY = mousePosition.y - portalRect.top - 30; // Adjust for header
        
        if (
          relativeX >= 0 && relativeX <= width &&
          relativeY >= 0 && relativeY <= height
        ) {
          // Create a ripple effect
          const radius = (Math.sin(time * 3) * 20 + 50) * 0.5;
          const gradient = ctx.createRadialGradient(
            relativeX, relativeY, 0,
            relativeX, relativeY, radius
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          gradient.addColorStop(0.5, 'rgba(255, 0, 80, 0.2)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.beginPath();
          ctx.arc(relativeX, relativeY, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }
      
      // Add "cosmic dust" particles
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 0.5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`;
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // Make portal draggable
  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
  };
  
  const stopDrag = () => {
    setIsDragging(false);
  };
  
  // Update portal position when dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleMouseMove = () => {
        const offsetX = portalSize.width / 2;
        const offsetY = portalSize.height / 2;
        
        setPortalPosition({
          x: mousePosition.x - offsetX,
          y: mousePosition.y - offsetY
        });
      };
      
      handleMouseMove();
      window.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isDragging, mousePosition, portalSize]);
  
  // Toggle portal - this function will be called from the main menu
  const togglePortal = () => {
    setIsPortalOpen(!isPortalOpen);
  };
  
  const portalStyle: React.CSSProperties = {
    position: 'fixed',
    top: portalPosition.y,
    left: portalPosition.x,
    width: portalSize.width,
    height: portalSize.height,
    zIndex: 1000,
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '15px',
    boxShadow: isPortalOpen ? 
      '0 0 100px rgba(255, 0, 80, 0.5), 0 0 30px rgba(255, 0, 80, 0.8) inset' : 
      'none',
    overflow: 'hidden',
    transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
    transform: isPortalOpen ? 'scale(1)' : 'scale(0)',
    opacity: isPortalOpen ? 1 : 0,
    cursor: isDragging ? 'grabbing' : 'grab'
  };
  
  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: '15px',
    borderTopRightRadius: '15px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '12px',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  };
  
  // Expose the toggle function for the MainMenu component to use
  React.useEffect(() => {
    portalController.toggle = togglePortal;
  }, []);
  
  return (
    <>
      {/* Digital Portal */}
      <div
        ref={portalRef}
        style={portalStyle}
        onMouseDown={startDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <div style={handleStyle}>
          <span>Dimensional Portal</span>
        </div>
        
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'calc(100% - 30px)',
            marginTop: '30px'
          }}
        />
        
        {/* Portal border glow animation */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: '15px',
            boxShadow: '0 0 10px rgba(255, 0, 80, 0.8) inset',
            opacity: isPortalOpen ? 1 : 0,
            transition: 'opacity 0.5s'
          }}
        />
      </div>
    </>
  );
};

// Expose the DigitalPortal toggle function for the MainMenu component to use
export const portalController = {
  toggle: () => {}
};

// Cinematic Journey Mode Component
const CinematicJourneyMode = () => {
  const [isActive, setIsActive] = React.useState(false);
  const [currentScene, setCurrentScene] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [cameraPosition, setCameraPosition] = React.useState({ x: 0, y: 0, zoom: 1 });
  const [viewportDimensions, setViewportDimensions] = React.useState({ width: 0, height: 0 });
  const [isIntroComplete, setIsIntroComplete] = React.useState(false);
  const [narrativeText, setNarrativeText] = React.useState("");
  const [showNarrative, setShowNarrative] = React.useState(false);
  const journeyRef = React.useRef<HTMLDivElement>(null);
  
  // Journey scenes definition - includes camera positions, narrative text, and targets
  const journeyScenes = [
    {
      name: "intro",
      target: null,
      camera: { x: 0, y: 0, zoom: 1 },
      narrative: "Begin your journey through the creative universe of BIRTEDI...",
      duration: 4000
    },
    {
      name: "logo",
      target: "div[class*='fixed top-0 w-full']", // Fixed selector to target the logo container div
      camera: { x: 0, y: -100, zoom: 1.5 },
      narrative: "Every masterpiece begins with a vision. BIRTEDI crafts experiences that move people.",
      duration: 5000
    },
    {
      name: "services",
      target: "#services",
      camera: { x: 0, y: 0, zoom: 1.2 },
      narrative: "Discover how we transform ideas into compelling brand stories...",
      duration: 5000
    },
    {
      name: "artistry",
      target: "div.overflow-hidden h2.text-7xl, div.overflow-hidden h2.md\\:text-9xl",
      camera: { x: -50, y: 0, zoom: 1.8 },
      narrative: "Where artistry meets strategy, magic happens. This is our philosophy.",
      duration: 4000
    },
    {
      name: "method",
      target: "#method",
      camera: { x: 30, y: 20, zoom: 1.3 },
      narrative: "Our methodology combines precision with creativity, expertise with innovation.",
      duration: 5000
    },
    {
      name: "contact",
      target: "#contact",
      camera: { x: 0, y: 0, zoom: 1.1 },
      narrative: "Ready to transform your brand's story? Join us on a journey of discovery.",
      duration: 4000
    }
  ];
  
  // Initialize viewport dimensions
  React.useEffect(() => {
    const updateDimensions = () => {
      setViewportDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  // Handle intro sequence
  React.useEffect(() => {
    if (isActive && !isIntroComplete) {
      // Initial cinematic intro sequence
      document.body.style.overflow = "hidden"; // Prevent scrolling during journey
      
      // Dramatic fade in
      setTimeout(() => {
        setNarrativeText("Welcome to BIRTEDI");
        setShowNarrative(true);
      }, 800);
      
      // Zoom effect
      setTimeout(() => {
        setCameraPosition({ x: 0, y: 0, zoom: 1.2 });
        setNarrativeText("Prepare to experience creativity like never before");
      }, 3000);
      
      // Ready to start the journey
      setTimeout(() => {
        setNarrativeText("Click the focus points to navigate through our story");
        setCameraPosition({ x: 0, y: 0, zoom: 1 });
        setIsIntroComplete(true);
      }, 6000);
      
      setTimeout(() => {
        setShowNarrative(false);
      }, 8000);
    }
    
    return () => {
      // Reset when deactivated
      if (!isActive) {
        document.body.style.overflow = "";
      }
    };
  }, [isActive, isIntroComplete]);
  
  // Function to transition to a specific scene
  const transitionToScene = (index: number) => {
    if (isTransitioning || index === currentScene) return;
    
    const scene = journeyScenes[index];
    if (!scene) return;
    
    setIsTransitioning(true);
    setNarrativeText(scene.narrative);
    setShowNarrative(true);
    
    // Find the target element if specified
    let targetElement = null;
    if (scene.target) {
      // Use querySelectorAll and take the first element if there are multiple matches
      const elements = document.querySelectorAll(scene.target);
      targetElement = elements.length > 0 ? elements[0] : null;
    }
    
    // Calculate position based on target element or use predefined coordinates
    let newPosition = { ...scene.camera };
    
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - viewportDimensions.width / 2;
      const centerY = rect.top + rect.height / 2 - viewportDimensions.height / 2;
      
      // Adjust position by the scene's offset values
      newPosition.x = -centerX + scene.camera.x;
      newPosition.y = -centerY + scene.camera.y;
    }
    
    // Apply transition
    setCameraPosition(newPosition);
    setCurrentScene(index);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      
      // Hide narrative text after a delay
      setTimeout(() => {
        setShowNarrative(false);
      }, scene.duration - 1000);
      
      // Auto advance to next scene if not the last one
      if (index < journeyScenes.length - 1 && isActive && isIntroComplete) {
        setTimeout(() => {
          transitionToScene(index + 1);
        }, scene.duration);
      }
    }, 1500); // Transition duration
  };
  
  // Begin journey when activated
  React.useEffect(() => {
    if (isActive && isIntroComplete && !isTransitioning && currentScene === 0) {
      // Start the journey with the first scene after intro
      setTimeout(() => {
        transitionToScene(1);
      }, 1000);
    }
  }, [isActive, isIntroComplete, isTransitioning, currentScene]);
  
  // Toggle journey mode - this function will be accessed from the main menu
  const toggleJourneyMode = () => {
    if (isActive) {
      // Deactivate - reset everything
      setIsActive(false);
      setCurrentScene(0);
      setIsIntroComplete(false);
      setCameraPosition({ x: 0, y: 0, zoom: 1 });
      document.body.style.overflow = "";
    } else {
      // Activate
      setIsActive(true);
      window.scrollTo(0, 0);
    }
  };
  
  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || isTransitioning) return;
      
      if (e.key === 'Escape') {
        toggleJourneyMode();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentScene < journeyScenes.length - 1) {
          transitionToScene(currentScene + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentScene > 1) {
          transitionToScene(currentScene - 1);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, currentScene, isTransitioning]);
  
  // The rest of the component's return statement (for active state)
  if (!isActive) {
    // Return null instead of rendering a separate button - this will be triggered from the menu
    return null;
  }
  
  // Focus point indicators for interactive navigation when in manual mode
  const FocusPoints = () => {
    if (!isIntroComplete || isTransitioning) return null;
    
    return (
      <>
        {journeyScenes.slice(1).map((scene, index) => {
          if (!scene.target) return null;
          
          // Use querySelectorAll and take the first element if there are multiple matches
          const elements = document.querySelectorAll(scene.target);
          const targetElement = elements.length > 0 ? elements[0] : null;
          
          if (!targetElement) return null;
          
          const rect = targetElement.getBoundingClientRect();
          const realIndex = index + 1;
          
          return (
            <motion.div
              key={scene.name}
              className="absolute w-12 h-12 pointer-events-auto cursor-pointer"
              style={{
                left: rect.left + rect.width / 2 - 24,
                top: rect.top + rect.height / 2 - 24,
                zIndex: 2000
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: currentScene === realIndex ? 1.2 : 1, 
                opacity: 1,
                boxShadow: currentScene === realIndex ? '0 0 30px rgba(239, 68, 68, 0.8)' : '0 0 15px rgba(239, 68, 68, 0.5)'
              }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              onClick={() => transitionToScene(realIndex)}
            >
              <div className="w-full h-full rounded-full bg-black border-2 border-white flex items-center justify-center">
                <span className="text-white font-bold">{realIndex}</span>
              </div>
              <div 
                className={`absolute inset-0 rounded-full animate-ping ${currentScene === realIndex ? 'bg-red-500' : 'bg-white'} opacity-75`} 
                style={{ animationDuration: '2s' }}
              ></div>
            </motion.div>
          );
        })}
      </>
    );
  };
  
  return (
    <>
      {/* Main journey view with camera transformations */}
      <motion.div
        ref={journeyRef}
        className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          backgroundColor: isIntroComplete ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.85)'
        }}
        transition={{ duration: 1 }}
      >
        {/* Camera "lens" frame */}
        <motion.div
          className="absolute inset-2 rounded-3xl overflow-hidden pointer-events-auto"
          initial={{ opacity: 0, boxShadow: '0 0 0 rgba(0, 0, 0, 0)' }}
          animate={{
            opacity: 1,
            boxShadow: '0 0 100px rgba(0, 0, 0, 0.7) inset, 0 0 30px rgba(239, 68, 68, 0.5)'
          }}
          transition={{ duration: 0.8 }}
        >
          {/* Camera vignette overlay */}
          <div 
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.8) 100%)'
            }}
          ></div>
          
          {/* Scan lines effect for cinematic feel */}
          <div 
            className="absolute inset-0 z-10 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
              backgroundSize: '100% 4px'
            }}
          ></div>
          
          {/* Camera view with transformation */}
          <motion.div
            className="w-full h-full"
            animate={{
              x: cameraPosition.x,
              y: cameraPosition.y,
              scale: cameraPosition.zoom
            }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 30,
              mass: 1
            }}
          >
            {/* This is an empty div that will show the page content underneath through the "lens" */}
          </motion.div>
        </motion.div>
        
        {/* Narrative text overlay */}
        <motion.div
          className="absolute left-0 right-0 bottom-20 flex justify-center items-center z-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ 
            opacity: showNarrative ? 1 : 0,
            y: showNarrative ? 0 : 50
          }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-black bg-opacity-70 text-white px-12 py-6 rounded-full max-w-3xl text-center">
            <p className="text-xl font-light">{narrativeText}</p>
          </div>
        </motion.div>
        
        {/* Focus points for interactive navigation */}
        <FocusPoints />
        
        {/* Journey controls */}
        <div className="absolute bottom-8 right-8 z-30">
          <motion.button
            className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center"
            onClick={toggleJourneyMode}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </div>
        
        {/* Scene progress indicator */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex space-x-2">
            {journeyScenes.slice(1).map((_, index) => (
              <motion.div
                key={index}
                className="w-2 h-2 rounded-full bg-white opacity-40"
                animate={{
                  opacity: currentScene === index + 1 ? 1 : 0.4,
                  scale: currentScene === index + 1 ? 1.5 : 1
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Create a new MainMenu component that includes all controls
const MainMenu = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  
  // Toggle menu open/closed
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <>
      {/* Menu button */}
      <motion.button
        className="fixed top-8 right-8 z-[110] w-12 h-12 rounded-full bg-black flex items-center justify-center"
        onClick={toggleMenu}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </motion.button>
      
      {/* Expanded menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            className="fixed top-8 right-8 mt-16 z-[105] bg-black bg-opacity-90 rounded-xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: -20, width: 0, height: 0 }}
            animate={{ opacity: 1, y: 0, width: 280, height: 'auto' }}
            exit={{ opacity: 0, y: -20, width: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="py-6 px-4">
              {/* Navigation links */}
              <div className="mb-6">
                <h3 className="text-white text-sm uppercase tracking-wider mb-2 opacity-60">Navigation</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#about" className="flex items-center text-white hover:text-red-500 transition-colors" onClick={() => setIsOpen(false)}>
                      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#services" className="flex items-center text-white hover:text-red-500 transition-colors" onClick={() => setIsOpen(false)}>
                      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Services
                    </a>
                  </li>
                  <li>
                    <a href="#method" className="flex items-center text-white hover:text-red-500 transition-colors" onClick={() => setIsOpen(false)}>
                      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Method
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="flex items-center text-white hover:text-red-500 transition-colors" onClick={() => setIsOpen(false)}>
                      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Interactive Experiences section */}
              <div className="mb-6">
                <h3 className="text-white text-sm uppercase tracking-wider mb-2 opacity-60">Experiences</h3>
                <ul className="space-y-3">
                  <li>
                    <button 
                      className="w-full flex items-center text-white hover:text-red-500 transition-colors"
                      onClick={() => {
                        cinematicJourneyController.toggle();
                        setIsOpen(false);
                      }}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Cinematic Journey
                    </button>
                  </li>
                  <li>
                    <button 
                      className="w-full flex items-center text-white hover:text-red-500 transition-colors"
                      onClick={() => {
                        // Use the portal controller instead
                        portalController.toggle();
                        setIsOpen(false);
                      }}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      Digital Portal
                    </button>
                  </li>
                  <li>
                    <button 
                      className="w-full flex items-center text-white hover:text-red-500 transition-colors"
                      onClick={() => {
                        // Access the VR Mode toggle
                        const vrButton = document.querySelector('.fixed.z-\\[100\\].bottom-8.left-8') as HTMLElement;
                        if (vrButton) vrButton.click();
                        setIsOpen(false);
                      }}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      VR Mode
                    </button>
                  </li>
                  <li>
                    <button 
                      className="w-full flex items-center text-white hover:text-red-500 transition-colors"
                      onClick={() => {
                        // Access the Ambient Sound toggle
                        const soundButton = document.querySelector('.fixed.bottom-8.right-8.z-\\[100\\]') as HTMLElement;
                        if (soundButton) soundButton.click();
                        setIsOpen(false);
                      }}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      Ambient Sound
                    </button>
                  </li>
                </ul>
              </div>
              
              {/* Social links */}
              <div>
                <h3 className="text-white text-sm uppercase tracking-wider mb-2 opacity-60">Connect</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-white hover:text-red-500 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white hover:text-red-500 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white hover:text-red-500 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Expose the CinematicJourneyMode toggle function for the MainMenu component to use
export const cinematicJourneyController = {
  toggle: () => {}
};

// Card Roulette - scrolling animation of random cards
const CardRoulette = () => {
  const [cards, setCards] = React.useState<Array<{
    id: number;
    color: string;
    title: string;
    icon: string;
  }>>([]);
  const rouletteRef = React.useRef<HTMLDivElement>(null);
  const animationRef = React.useRef<number>(0);
  const scrollSpeed = React.useRef(2);
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Generate random cards on component mount
  React.useEffect(() => {
    // Create an array of random card data
    const cardColors = [
      'bg-gradient-to-br from-red-500 to-pink-600',
      'bg-gradient-to-br from-blue-500 to-indigo-600',
      'bg-gradient-to-br from-green-400 to-emerald-600',
      'bg-gradient-to-br from-yellow-400 to-amber-600',
      'bg-gradient-to-br from-purple-500 to-violet-600',
      'bg-gradient-to-br from-cyan-400 to-blue-500',
      'bg-gradient-to-br from-fuchsia-500 to-pink-600',
      'bg-gradient-to-br from-orange-400 to-red-600',
    ];
    
    const cardTitles = [
      'Creative Design',
      'Web Development',
      'UI/UX Design',
      'Brand Strategy',
      'Digital Marketing',
      'Motion Graphics',
      'Content Creation',
      'Social Media',
      'SEO Optimization',
      'Video Production',
      'App Development',
      'Photography',
    ];
    
    const cardIcons = [
      'M12 6v6m0 0v6m0-6h6m-6 0H6',
      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
      'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      'M13 10V3L4 14h7v7l9-11h-7z',
      'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
      'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
    ];
    
    // Generate 30 cards (duplicates are fine for a continuous scroll effect)
    const generatedCards = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      color: cardColors[Math.floor(Math.random() * cardColors.length)],
      title: cardTitles[Math.floor(Math.random() * cardTitles.length)],
      icon: cardIcons[Math.floor(Math.random() * cardIcons.length)],
    }));
    
    setCards(generatedCards);
    
    // Start the animation
    animateRoulette();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);
  
  // Animation function for continuous scrolling
  const animateRoulette = () => {
    if (!rouletteRef.current) return;
    
    const animate = () => {
      if (!rouletteRef.current) return;
      
      // Get all card elements
      const cardElements = rouletteRef.current.querySelectorAll('.card-item');
      const containerWidth = rouletteRef.current.offsetWidth;
      
      cardElements.forEach((card) => {
        const cardElement = card as HTMLElement;
        // Move card to the left
        cardElement.style.transform = `translateX(${parseFloat(cardElement.style.transform.replace('translateX(', '').replace('px)', '') || '0') - scrollSpeed.current}px)`;
        
        // If card is out of view on the left, move it to the far right
        if (parseFloat(cardElement.style.transform.replace('translateX(', '').replace('px)', '')) < -cardElement.offsetWidth) {
          cardElement.style.transform = `translateX(${containerWidth}px)`;
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // Speed up on hover, slow down when not hovering
  React.useEffect(() => {
    scrollSpeed.current = isHovered ? 4 : 2;
  }, [isHovered]);
  
  return (
    <div className="py-20 relative overflow-hidden bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Our Expertise</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Scroll through our capabilities and discover the perfect match for your project needs.
          </p>
        </div>
      </div>
      
      <div 
        ref={rouletteRef} 
        className="relative h-[400px] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {cards.map((card) => (
          <motion.div
            key={card.id}
            className={`card-item absolute ${card.color} rounded-xl shadow-lg p-6 w-[280px] h-[180px] flex flex-col justify-between`}
            style={{
              transform: `translateX(${Math.random() * window.innerWidth}px)`,
              top: `${Math.random() * 220}px`,
            }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div>
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">{card.title}</h3>
            </div>
            <div className="flex justify-end">
              <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Gradient overlays to create fade effect on sides */}
      <div className="absolute top-0 left-0 h-full w-64 bg-gradient-to-r from-black to-transparent z-10"></div>
      <div className="absolute top-0 right-0 h-full w-64 bg-gradient-to-l from-black to-transparent z-10"></div>
    </div>
  );
};

export default function Home() {
  const [scale, setScale] = React.useState(1);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const requestRef = React.useRef<number>();
  const previousScrollY = React.useRef<number>(0);

  // References for scroll-based animations
  const targetRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  });

  // Function to handle animation frame updates
  const animateScroll = React.useCallback(() => {
    const scrollPosition = window.scrollY;
    
    // Only update if scroll position has changed significantly
    if (Math.abs(scrollPosition - previousScrollY.current) > 1) {
      const maxScroll = 400; // Reduced for more responsive shrinking
      const minScale = 0.15; // Minimum scale factor remains the same
      
      // Improved scale calculation with a smoother easing function
      const scrollRatio = Math.min(1, scrollPosition / maxScroll);
      const easedProgress = easeOutCubic(scrollRatio);
      const newScale = Math.max(minScale, 1 - (easedProgress * (1 - minScale)));
      
      setScale(newScale);
      setScrollProgress(scrollRatio);
      previousScrollY.current = scrollPosition;
    }

    requestRef.current = requestAnimationFrame(animateScroll);
  }, []);

  // Easing function for smoother animations
  const easeOutCubic = (x: number): number => {
    return 1 - Math.pow(1 - x, 3);
  };

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animateScroll);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animateScroll]);

  // Smoother position calculation
  const startPosition = -550;
  const endPosition = -490;
  const yPosition = startPosition + (1 - scale) * (startPosition - endPosition);

  // Background styles
  const backgroundStyle = {
    backgroundColor: "#f5f5f5",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0
  } as React.CSSProperties;

  // Card data for 3D scrolling section
  const cards = [
    {
      title: "Brand Strategy",
      description: "Developing cohesive brand identities that resonate with your audience.",
      color: "from-red-500 to-pink-600"
    },
    {
      title: "Visual Design",
      description: "Creating stunning visuals that capture attention and communicate clearly.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Digital Marketing",
      description: "Crafting strategies that deliver your message to the right audiences.",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Motion Graphics",
      description: "Bringing ideas to life through captivating animation and movement.",
      color: "from-purple-500 to-violet-600"
    },
    {
      title: "Content Creation",
      description: "Developing compelling content that tells your unique story.",
      color: "from-amber-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen font-galvij bg-white" ref={targetRef}>
      {/* Fixed background */}
      <div style={backgroundStyle}></div>
      
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Hero section with shrinking logo */}
      <div 
        className={`fixed top-0 w-full z-[60] transition-all duration-300 ease-out flex justify-center will-change-transform`} 
        style={{
          transform: `scale(${scale}) translateY(${yPosition}px)`,
          transformOrigin: 'center top'
        }}>
        <div 
          className="text-center mt-[-200px]"
          style={{
            position: 'relative'
          }}>
          <img 
            src="/src/assets/birtedi-logo.png" 
            alt="BIRTEDI" 
            className="w-[111vw] max-w-none h-auto transform scale-110"
          />
        </div>
      </div>

      <main className="relative z-10 mt-[75vh]">
        {/* Parallax scrolling text */}
        <div className="bg-white py-12 overflow-hidden relative">
          <ParallaxText baseVelocity={-5}>
            <span className="text-8xl font-bold tracking-tighter">VISION · STRATEGY · CREATIVITY · IMPACT · </span>
          </ParallaxText>
        </div>
        
        {/* About Section with large typography */}
        <section id="about" className="py-32 relative overflow-hidden bg-white">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
              <div className="md:col-span-5">
                <motion.h2 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-6xl md:text-8xl font-light tracking-tighter text-black mb-16"
                >
                  We create<br /><span className="font-bold">brands that<br />matter</span>
                </motion.h2>
              </div>
              
              <div className="md:col-span-7">
                <motion.p 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-xl md:text-2xl leading-relaxed text-gray-800 mb-12"
                >
                  BIRTEDI is a creative agency that specializes in cinematic advertising, visual identity design, branding, and account management. We go beyond traditional marketing by infusing storytelling, creativity, and strategic thinking into every project.
                </motion.p>
                
                <motion.p 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl md:text-2xl leading-relaxed text-gray-800"
                >
                  Our mission is to encourage the world to be more productive, creative, and passionate about their goals. Everything we produce mirrors our core values of innovation, discipline, and artistic excellence.
                </motion.p>
              </div>
            </div>
          </div>
        </section>

        {/* 3D Card Scrolling Animation Section */}
        <section className="py-16 md:py-32 relative overflow-hidden bg-black">
          <div className="container mx-auto px-6 mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-light tracking-tighter text-white mb-6 text-center"
            >
              Our <span className="font-bold text-red-500">Expertise</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto text-center"
            >
              Scroll horizontally to explore our services
            </motion.p>
          </div>
          
          <HorizontalScrollCards cards={cards} />
        </section>

        {/* Process Section - Added after card scrolling */}
        <section className="py-24 relative bg-gradient-to-b from-black to-gray-900">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-full h-full bg-black opacity-30"></div>
            <div 
              className="absolute inset-0 opacity-10"
              style={{ 
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                backgroundSize: '60px 60px'
              }}
            ></div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-6xl font-light tracking-tighter text-white mb-8"
              >
                Our <span className="font-bold text-blue-400">Process</span>
              </motion.h2>
              
              <motion.div 
                className="w-24 h-1 bg-blue-400 mb-12"
                initial={{ width: 0 }}
                whileInView={{ width: 96 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              ></motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-gray-300 max-w-3xl"
              >
                We believe in a collaborative approach that combines strategy, creativity, and technology to deliver exceptional results for our clients.
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
              {[
                {
                  title: 'Discovery',
                  description: 'We start by understanding your goals, audience, and challenges through thorough research and analysis.',
                  icon: (
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )
                },
                {
                  title: 'Strategy',
                  description: 'We develop a comprehensive strategy that aligns with your business objectives and resonates with your target audience.',
                  icon: (
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                },
                {
                  title: 'Execution',
                  description: 'We bring your vision to life through expert design, development, and implementation, with ongoing refinement.',
                  icon: (
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  )
                }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl p-8 flex flex-col items-center text-center hover:bg-gray-700 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-900 bg-opacity-40 flex items-center justify-center mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-10 md:p-16 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                <div className="mb-8 md:mb-0 md:mr-8 text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to transform your digital presence?</h3>
                  <p className="text-lg text-white text-opacity-90">Let's discuss how we can help you achieve your business goals.</p>
                </div>
                
                <MagneticButton className="bg-white text-blue-600 hover:bg-blue-50 py-4 px-8 rounded-full font-bold text-lg shadow-lg">
                  Contact Us
                </MagneticButton>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

// 3D Card Component for Scrolling Animation
const Card = ({ card, index, offsetX }: { card: any, index: number, offsetX: number }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = React.useState({ x: 0, y: 0 });
  const mousePosition = useMousePosition();
  
  // 3D tilt effect based on mouse position
  React.useEffect(() => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Only calculate rotation if mouse is near the card
    const proximity = 300; // Distance threshold in pixels
    const dx = mousePosition.x - centerX;
    const dy = mousePosition.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < proximity) {
      // Calculate rotation proportional to mouse distance from center
      const rotateY = (mousePosition.x - centerX) / 20;
      const rotateX = (centerY - mousePosition.y) / 20;
      
      // Apply with a dampening factor for smoother effect
      setRotation({
        x: rotateX * 0.5,
        y: rotateY * 0.5
      });
    } else {
      // Gradually return to neutral position
      setRotation({
        x: rotation.x * 0.9,
        y: rotation.y * 0.9
      });
    }
  }, [mousePosition, rotation]);
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative w-[300px] md:w-[350px] h-[400px] md:h-[450px] flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br ${card.color} shadow-xl cursor-pointer mx-5`}
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
      whileHover={{ scale: 1.05, z: 20 }}
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
    >
      {/* Card content with 3D effect */}
      <div className="p-8 h-full flex flex-col" style={{ transform: 'translateZ(20px)' }}>
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">{card.title}</h3>
          <p className="text-white text-opacity-80">{card.description}</p>
        </div>
        
        <div className="mt-auto flex justify-end">
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" 
           style={{ transform: 'translateZ(5px)' }} />
      
      {/* Bottom highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-30" 
           style={{ transform: 'translateZ(15px)' }} />
    </motion.div>
  );
};

// Horizontal scrolling container with wheel-based scrolling
const HorizontalScrollCards = ({ cards }: { cards: any[] }): JSX.Element => {
  const [scrollX, setScrollX] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);
  const velocityX = React.useRef(0);
  const lastScrollX = React.useRef(0);
  const lastScrollTime = React.useRef(Date.now());
  const momentumRef = React.useRef<number | null>(null);
  const isAtStart = React.useRef(true);
  const isAtEnd = React.useRef(false);
  const [isSectionActive, setIsSectionActive] = React.useState(false);
  const [showScrollBarrier, setShowScrollBarrier] = React.useState(false);
  const [allowScroll, setAllowScroll] = React.useState(false);
  
  // Find current active card index
  const getCurrentCardIndex = () => {
    if (!containerRef.current) return 0;
    const containerWidth = containerRef.current.clientWidth;
    return Math.floor((scrollX + containerWidth / 2) / 350);
  };
  
  // Calculate max scroll distance with precise card positioning
  const getMaxScroll = () => {
    if (!containerRef.current || !scrollContainerRef.current) return 0;
    const containerWidth = containerRef.current.clientWidth;
    
    // Calculate the position that puts the last card exactly in the center
    // We need the total cards width + left padding, minus the offset needed to center the last card
    const cardWidth = 360; // Approximate width of card + margin
    const leftPadding = window.innerWidth * 0.4; // 40vw converted to pixels
    
    // Position to center the last card
    const lastCardCenteredPosition = leftPadding + (cards.length - 1) * cardWidth;
    
    // Calculate the offset needed to center the last card
    const centeringOffset = (containerWidth - cardWidth) / 2;
    
    // Add an extra left shift to move the last card a bit more to the left
    // Adjust this value to control how much more left the card should be
    const extraLeftShift = 150; // pixels to shift left - increased from 100 to 250
    
    // The max scroll is the position that places the last card in the center, plus extra shift left
    return Math.max(0, lastCardCenteredPosition - centeringOffset + extraLeftShift);
  };

  // Update isAtStart and isAtEnd based on current scroll position
  React.useEffect(() => {
    const threshold = 10; // Small threshold to account for floating point imprecision
    isAtStart.current = scrollX <= threshold;
    
    // Check if we've reached the position where the last card is centered
    const maxScroll = getMaxScroll();
    isAtEnd.current = Math.abs(scrollX - maxScroll) <= threshold;
    
    // If we're at the end, make sure we're exactly at maxScroll
    if (isAtEnd.current && Math.abs(scrollX - maxScroll) > 0) {
      setScrollX(maxScroll);
    }
    
    // Show scroll barrier when at the end
    setShowScrollBarrier(isAtEnd.current);
  }, [scrollX, cards.length]);

  // Check if section is in view and should capture scroll events
  const checkSectionVisibility = React.useCallback(() => {
    if (!sectionRef.current) return false;
    
    const rect = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Make the section more demanding of attention - section must be at least 100% in view
    const visibilityThreshold = 1; 
    
    // Calculate how much of the section is visible in the viewport
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const percentVisible = visibleHeight / rect.height;
    
    // Check if the section is also within a reasonable view range
    // Tightened threshold - section must be more centered in viewport
    const sectionTop = rect.top;
    const sectionCenter = rect.top + (rect.height / 2);
    const viewportCenter = windowHeight / 2;
    
    // Consider the section "active" when:
    // 1. It's at least 100% visible AND 
    // 2. Either the top of section is visible and not too far below center,
    //    OR the section's center is reasonably close to viewport center
    const isActive = 
      (percentVisible >= visibilityThreshold) && 
      ((sectionTop >= 0 && sectionTop < windowHeight * 0.7) || 
       (Math.abs(sectionCenter - viewportCenter) <= windowHeight * 0.4));
    
    // Set state if it changed
    if (isActive !== isSectionActive) {
      setIsSectionActive(isActive);
      
      // When section becomes active, lock page scroll
      if (isActive && !allowScroll) {
        document.body.style.overflow = 'hidden';
      } else if (!isActive) {
        document.body.style.overflow = '';
      }
      
      // Optional visual indicator when section becomes active
      if (isActive && sectionRef.current) {
        const element = sectionRef.current;
        element.style.transition = 'box-shadow 0.3s ease-in-out';
        element.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.2)';
        setTimeout(() => {
          if (element) element.style.boxShadow = 'none';
        }, 300);
      }
    }
    
    return isActive;
  }, [isSectionActive, allowScroll]);
  
  // Determine if the scroll wheel event should be intercepted
  const shouldInterceptWheel = (e: WheelEvent | React.WheelEvent) => {
    // If the section is not active in the viewport, don't intercept
    if (!isSectionActive) return false;
    
    const delta = e.deltaY;
    
    // If scrolling down and user hasn't reached the last card yet, intercept all scrolling
    if (delta > 0 && !isAtEnd.current) {
      return true;
    }
    
    // If scrolling down and user has reached the last card, let the page scroll
    if (delta > 0 && isAtEnd.current) {
      return false;
    }
    
    // If scrolling up or horizontal scroll, intercept when section is active
    if (delta < 0 || e.deltaX !== 0) {
      // If scrolling up and not at start, intercept
      if (delta < 0 && !isAtStart.current) return true;
    }
    
    // If scrolling up and at start, don't intercept (let page scroll)
    return false;
  };

  // Add a global wheel event listener to catch events even outside our container
  React.useEffect(() => {
    // Lock body scroll when component mounts if section is active and scroll is not allowed
    if (isSectionActive && !allowScroll) {
      document.body.style.overflow = 'hidden';
    }
    
    // Need to use a raw event listener to catch all wheel events on the page
    const handleGlobalWheel = (e: WheelEvent) => {
      // Always check if section is visible in viewport
      checkSectionVisibility();
      
      // Force intercept all page scroll events when section is visible and user hasn't finished viewing cards
      if (isSectionActive && !allowScroll) {
        e.preventDefault();
        
        const delta = e.deltaY || e.deltaX;
        
        // If trying to scroll down but haven't reached the last card,
        // intercept and redirect to horizontal scrolling
        if (delta > 0 && !isAtEnd.current) {
          // Calculate new scroll position with smooth scrolling effect
          const newScrollX = Math.max(0, Math.min(getMaxScroll(), scrollX + delta));
          
          // Calculate velocity for momentum
          const now = Date.now();
          const dt = now - lastScrollTime.current;
          velocityX.current = (newScrollX - lastScrollX.current) / Math.max(1, dt) * 1000;
          lastScrollX.current = scrollX;
          lastScrollTime.current = now;
          
          setScrollX(newScrollX);
          
          // Cancel any ongoing momentum scrolling
          if (momentumRef.current !== null) {
            cancelAnimationFrame(momentumRef.current);
            momentumRef.current = null;
          }
        }
        
        // For scrolling up
        if (delta < 0) {
          // If not at the start of horizontal scrolling, prevent page scroll and handle horizontally
          if (!isAtStart.current) {
            // Calculate new scroll position
            const newScrollX = Math.max(0, Math.min(getMaxScroll(), scrollX + delta));
            
            // Calculate velocity
            const now = Date.now();
            const dt = now - lastScrollTime.current;
            velocityX.current = (newScrollX - lastScrollX.current) / Math.max(1, dt) * 1000;
            lastScrollX.current = scrollX;
            lastScrollTime.current = now;
            
            setScrollX(newScrollX);
            
            // Cancel any ongoing momentum scrolling
            if (momentumRef.current !== null) {
              cancelAnimationFrame(momentumRef.current);
              momentumRef.current = null;
            }
          }
        }
        return false;
      }
    };
    
    // Add scroll and visibility listeners
    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    window.addEventListener('scroll', checkSectionVisibility);
    window.addEventListener('resize', checkSectionVisibility);
    
    // To handle touch devices more aggressively
    const preventTouchMove = (e: TouchEvent) => {
      if (isSectionActive && !allowScroll) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('touchmove', preventTouchMove, { passive: false });
    
    // Initial check
    checkSectionVisibility();
    
    return () => {
      // Clean up all event listeners
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('scroll', checkSectionVisibility);
      window.removeEventListener('resize', checkSectionVisibility);
      window.removeEventListener('touchmove', preventTouchMove);
      
      // Restore body scroll when component unmounts
      document.body.style.overflow = '';
    };
  }, [isSectionActive, scrollX, checkSectionVisibility, allowScroll]);

  // Handle wheel events for direct interactions with the component
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY || e.deltaX;
    
    // Always prevent default behavior when section is active and user hasn't viewed all cards
    if (isSectionActive && delta > 0 && !isAtEnd.current) {
      e.preventDefault();
    } else if (isSectionActive && delta < 0 && !isAtStart.current) {
      e.preventDefault();
    } else if (isSectionActive && delta > 0 && isAtEnd.current) {
      // Allow page to scroll naturally if user has seen all cards
      return;
    } else {
      // Don't intercept - let page scroll naturally for other cases
      return;
    }
    
    if (!containerRef.current) return;
    
    // Calculate new scroll position with smooth scrolling effect
    const newScrollX = Math.max(0, Math.min(getMaxScroll(), scrollX + delta));
    
    // Calculate velocity
    const now = Date.now();
    const dt = now - lastScrollTime.current;
    velocityX.current = (newScrollX - lastScrollX.current) / Math.max(1, dt) * 1000;
    lastScrollX.current = scrollX;
    lastScrollTime.current = now;
    
    setScrollX(newScrollX);
    
    // Cancel any ongoing momentum scrolling
    if (momentumRef.current !== null) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
  };

  // Scroll to a specific card with perfect centering
  const scrollToCard = (index: number) => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const cardWidth = 360; // Approximate width of card plus margin
    
    // Calculate position with left padding
    const leftPadding = window.innerWidth * 0.4; // 40vw converted to pixels
    const rawPosition = leftPadding + (index * cardWidth);
    
    // Center the card in the viewport
    const centeringOffset = (containerWidth - cardWidth) / 2;
    const targetPosition = rawPosition - centeringOffset;
    
    // Make sure we don't exceed bounds
    const maxScroll = getMaxScroll();
    const finalPosition = Math.max(0, Math.min(maxScroll, targetPosition));
    
    // Smooth scroll to that position
    setScrollX(finalPosition);
  };

  // Add keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys if section is active in viewport
      if (!isSectionActive) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // Find current centered card index and go to previous
        const currentIndex = getCurrentCardIndex();
        if (currentIndex > 0) {
          scrollToCard(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Find current centered card index and go to next
        const currentIndex = getCurrentCardIndex();
        if (currentIndex < cards.length - 1) {
          scrollToCard(currentIndex + 1);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cards.length, scrollX, isSectionActive]);
  
  // Helper to check if element is visible in viewport
  const isElementInViewport = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  // Mouse down handler for drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (containerRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollX;
    
    // Cancel any ongoing momentum scrolling
    if (momentumRef.current !== null) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
  };

  // Mouse move handler for drag scrolling
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    // Calculate how far the mouse has moved
    const x = e.pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startX.current) * 2; // Adjust scrolling speed
    
    // Calculate new scroll position
    const newScrollX = Math.max(0, Math.min(getMaxScroll(), scrollLeft.current - walk));
    
    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - lastScrollTime.current;
    velocityX.current = (newScrollX - lastScrollX.current) / Math.max(1, dt) * 1000;
    lastScrollX.current = scrollX;
    lastScrollTime.current = now;
    
    setScrollX(newScrollX);
  };

  // Mouse up handler to stop dragging
  const handleMouseUp = () => {
    isDragging.current = false;
    // Start momentum scrolling
    startMomentumScroll();
  };

  // Mouse leave handler to stop dragging
  const handleMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false;
      startMomentumScroll();
    }
  };

  // Touch start handler for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      startX.current = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
      scrollLeft.current = scrollX;
      
      // Cancel any ongoing momentum scrolling
      if (momentumRef.current !== null) {
        cancelAnimationFrame(momentumRef.current);
        momentumRef.current = null;
      }
    }
  };

  // Touch move handler for mobile
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    
    // Calculate how far the touch has moved
    const x = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startX.current) * 2; // Adjust scrolling speed
    
    // Calculate new scroll position
    const newScrollX = Math.max(0, Math.min(getMaxScroll(), scrollLeft.current - walk));
    
    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - lastScrollTime.current;
    velocityX.current = (newScrollX - lastScrollX.current) / Math.max(1, dt) * 1000;
    lastScrollX.current = newScrollX;
    lastScrollTime.current = now;
    
    setScrollX(newScrollX);
    
    // Prevent page scrolling
    e.preventDefault();
  };

  // Touch end handler for mobile
  const handleTouchEnd = () => {
    isDragging.current = false;
    startMomentumScroll();
  };

  // Momentum scrolling animation
  const startMomentumScroll = () => {
    const friction = 0.95; // Adjust for more or less momentum
    const minVelocity = 0.5; // Minimum velocity to continue momentum
    
    const animateMomentum = () => {
      velocityX.current *= friction;
      
      if (Math.abs(velocityX.current) < minVelocity) {
        if (momentumRef.current !== null) {
          cancelAnimationFrame(momentumRef.current);
          momentumRef.current = null;
        }
        return;
      }
      
      const delta = velocityX.current / 60; // Adjust for frame rate
      const newScrollX = Math.max(0, Math.min(getMaxScroll(), scrollX + delta));
      
      // Check if we're at the bounds and stop momentum immediately
      if (newScrollX === 0 || newScrollX >= getMaxScroll()) {
        velocityX.current = 0;
        
        // Ensure we snap exactly to the max scroll if we're near the end
        if (Math.abs(newScrollX - getMaxScroll()) < 5) {
          setScrollX(getMaxScroll());
          
          // Important: Force the isAtEnd state to update immediately
          isAtEnd.current = true;
          
          // Stop the momentum animation
          if (momentumRef.current !== null) {
            cancelAnimationFrame(momentumRef.current);
            momentumRef.current = null;
          }
          return;
        }
      }
      
      setScrollX(newScrollX);
      momentumRef.current = requestAnimationFrame(animateMomentum);
    };
    
    // Only start momentum if there's significant velocity and we're not at the end
    if (Math.abs(velocityX.current) > minVelocity) {
      // If we're already very close to the end, don't allow momentum to continue
      const maxScroll = getMaxScroll();
      if (Math.abs(scrollX - maxScroll) < 10) {
        // Just snap to the end immediately
        setScrollX(maxScroll);
        isAtEnd.current = true;
        return;
      }
      
      momentumRef.current = requestAnimationFrame(animateMomentum);
    }
  };

  // Clean up any animations when component unmounts
  React.useEffect(() => {
    return () => {
      if (momentumRef.current !== null) {
        cancelAnimationFrame(momentumRef.current);
        momentumRef.current = null;
      }
    };
  }, []);

  // Update the max scroll distance when window is resized
  React.useEffect(() => {
    const handleResize = () => {
      setScrollX(prevScrollX => Math.min(prevScrollX, getMaxScroll()));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={sectionRef}
      className={`relative h-[500px] md:h-[600px] w-full overflow-hidden ${isSectionActive ? 'section-active' : ''}`}
    >
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: isDragging.current ? 'grabbing' : 'grab'
        }}
      >
        <motion.div
          ref={scrollContainerRef}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 flex items-center"
          style={{ 
            transform: `translateX(${-scrollX}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.05s ease-out'
          }}
        >
          <div className="flex items-center">
            {/* Left padding to ensure first card can be centered */}
            <div className="w-[40vw] flex-shrink-0"></div>
            
            {cards.map((card, index) => (
              <Card key={index} card={card} index={index} offsetX={scrollX} />
            ))}
            
            {/* No extra padding needed on right since we explicitly calculate end position */}
          </div>
        </motion.div>
        
        {/* Gradient overlays for fading effect */}
        <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
        
        {/* Scroll indicator - showing active card position */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {cards.map((_, index) => {
            const isActive = getCurrentCardIndex() === index;
            return (
              <motion.div 
                key={index}
                className={`h-2.5 rounded-full cursor-pointer ${isActive ? 'bg-white' : 'bg-white/30'}`}
                initial={false}
                animate={{ 
                  width: isActive ? 20 : 8,
                  opacity: isActive ? 1 : 0.5
                }}
                transition={{ duration: 0.3 }}
                onClick={() => scrollToCard(index)}
              />
            );
          })}
        </div>
        
        {/* Scroll Barrier - appears when user reaches the last card */}
        {showScrollBarrier && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-[200px] z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.8))',
            }}
          >
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-auto flex flex-col items-center">
              <motion.div
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 pointer-events-auto cursor-pointer"
                initial={{ y: 10 }}
                animate={{ y: [0, 10, 0] }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                onClick={() => {
                  // Allow vertical scrolling to continue when clicked
                  setAllowScroll(true);
                  document.body.style.overflow = '';
                  window.scrollBy({
                    top: 100,
                    behavior: 'smooth'
                  });
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
              <div 
                className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white font-semibold pointer-events-auto cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => {
                  // Allow vertical scrolling to continue when clicked
                  setAllowScroll(true);
                  document.body.style.overflow = '';
                  window.scrollBy({
                    top: 100,
                    behavior: 'smooth'
                  });
                }}
              >
                Continue Scrolling
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Debugging indicator for section active state */}
      {isSectionActive && (
        <div className="absolute inset-0 pointer-events-none" style={{ 
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.1)', 
            boxSizing: 'border-box'
          }} />
      )}
    </div>
  );
};