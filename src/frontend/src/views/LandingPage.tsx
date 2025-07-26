import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Shield, 
  Globe,
  ArrowRight,
  Wallet,
  Bot,
  Share2,
  Zap,
  Cpu,
  Network,
  Star,
  Heart,
  Sparkles,
  Sun,
  Moon,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const LandingPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Core Social Interaction",
      description: "Publish posts, like, comment, and reshare content with fully on-chain profiles"
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "Built-in Crypto Wallet",
      description: "Native crypto wallet supporting ICRC-1 token standard for seamless transfers"
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Extensible Mini Apps",
      description: "Deploy standalone modules that plug into the main interface with sandboxed interactions"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Monetized Reactions",
      description: "Enable monetized interactions where likes result in token transfers to creators"
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "AI-Powered Chat Agents",
      description: "Invite AI agents into conversations to execute actions through smart contracts"
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Programmable Social Graph",
      description: "Decentralized social graph queryable for discovering content and connections"
    }
  ];

 

  const floatingStats = [
    { number: "100%", label: "On-Chain", position: { left: "15%", top: "25%" } },
    { number: "∞", label: "Scalable", position: { right: "20%", top: "35%" } },
    { number: "0", label: "Censorship", position: { left: "25%", bottom: "30%" } },
    { number: "24/7", label: "Available", position: { right: "15%", bottom: "25%" } },
    { number: "100%", label: "Secure", position: { right: "10%", top: "15%" } },
    { number: "∞", label: "Decentralized", position: { right: "35%", bottom: "40%" } }
  ];

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      // Get the offset position of the features section
      const offsetTop = featuresSection.offsetTop;
      
      // Scroll to the features section with a small offset to account for any fixed elements
      window.scrollTo({
        top: offsetTop - 20, // Small offset to ensure proper positioning
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-accent/20 to-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Secondary gradient orb */}
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-primary/15 to-accent/25 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
        />
        
        {/* Accent gradient orb */}
        <motion.div
          className="absolute top-3/4 left-1/2 w-72 h-72 bg-gradient-to-r from-accent/30 to-secondary/20 rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10,
          }}
        />
      </div>

      {/* Floating Stats in Background */}
      <div className="absolute inset-0">
        {floatingStats.map((stat, index) => (
          <motion.div
            key={`floating-stat-${index}`}
            className="absolute text-center"
            style={stat.position}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: [0.3, 0.7, 0.3],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 4 + index,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.5,
            }}
            whileHover={{
              y: -20,
              scale: 1.1,
              opacity: 1,
            }}
          >
            <div className="text-2xl md:text-3xl font-bold text-accent/60">
              {stat.number}
            </div>
            <div className="text-sm text-text-secondary/60 font-medium">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Geometric Elements */}
      <div className="absolute inset-0">
        {/* Floating circles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute w-2 h-2 bg-accent/30 rounded-full"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${30 + (i * 10)}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
        
        {/* Floating squares */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`square-${i}`}
            className="absolute w-3 h-3 bg-primary/20 rotate-45"
            style={{
              right: `${25 + (i * 20)}%`,
              top: `${20 + (i * 15)}%`,
            }}
            animate={{
              y: [0, 40, 0],
              rotate: [45, 225, 45],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
          />
        ))}
        
        {/* Floating stars */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-accent/20"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${60 + (i * 8)}%`,
            }}
            animate={{
              y: [0, -25, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            <Star className="w-4 h-4" />
          </motion.div>
        ))}
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-4 sm:p-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-1"
          >
            
            <div className="w-8 h-8 sm:w-10 sm:h-10 ">
    <img
  src="/favicon.png"
  alt="ToknTalk Logo"
  className="w-8 h-8 sm:w-10 sm:h-10"
/>
    </div>
            <span className="text-xl sm:text-2xl font-bold gradient-text">
              ToknTalk
            </span>
          </motion.div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-3 rounded-xl bg-background-card/80 backdrop-blur-sm border border-accent/20 hover:border-accent/40 hover:bg-background-card/90 transition-all duration-300"
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-5 h-5 text-accent" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-5 h-5 text-accent" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              disabled={isLoading}
              className="modern-button relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center"
                  >
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Connecting...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center"
                  >
                    <span>Get Started</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Loading animation overlay */}
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </motion.button>
          </div>
        </nav>

        {/* Hero Section - Full Height */}
        <section className="min-h-screen flex flex-col justify-evenly items-center px-4 sm:px-6 max-w-6xl mx-auto py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 sm:mb-11">
              <span className="gradient-text">
                The Future of
              </span>
              <br />
              <span className="text-text">Social Networking</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed px-4">
              Experience the next generation of decentralized social networking.  </p>
              <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed px-4">

              Built on the Internet Computer Protocol with built-in crypto wallets, 
              AI agents, and monetized interactions.
              </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              disabled={isLoading}
              className="modern-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 relative overflow-hidden min-w-[200px] sm:min-w-[220px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center"
                  >
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span>Connecting...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center"
                  >
                    <span>Start Your Journey</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.div>
                )}
              </AnimatePresence>
             
              {/* Loading animation overlay */}
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToFeatures}
              className="border-2 border-accent/30 hover:border-accent text-accent hover:text-accent px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg transition-all duration-300 relative overflow-hidden"
            >
              <Globe className="w-5 h-5 mr-2 inline" />
              <span>Learn More</span>
              {/* Loading animation overlay */}
              <motion.div
                className="absolute inset-0 bg-accent/10"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </motion.button>
          </motion.div>

          {/* Stats */}
          {/* <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="text-center modern-card backdrop-blur-sm bg-background-card/80"
              >
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                  {stat.number}
                </div>
                <div className="text-text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div> */}
        </section>

        {/* Features Section */}
        <section id="features-section" className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              <span className="gradient-text">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Everything you need for modern social networking, 
              enhanced with cutting-edge blockchain technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="modern-card group hover:glow transition-all duration-300 backdrop-blur-sm bg-background-card/90"
              >
                <div className="w-16 h-16 bg-accent-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 glow">
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-text mb-4">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="modern-card glow-lg backdrop-blur-sm bg-background-card/90"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Join the Future?
            </h2>
            <p className="text-lg sm:text-xl text-text-secondary mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Be part of the next evolution in social media. 
              Connect, create, and thrive in a decentralized world.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              disabled={isLoading}
              className="modern-button text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 relative overflow-hidden flex items-center justify-center mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center"
                  >
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    <span>Connecting...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center"
                  >
                    <Sparkles className="w-6 h-6 mr-3" />
                    <span>Get Started Now</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Loading animation overlay */}
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </motion.button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-accent/20">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center items-center space-x-1 mb-6">
             
              <div className="w-8 h-8 sm:w-10 sm:h-10 ">
    <img
  src="/favicon.png"
  alt="ToknTalk Logo"
  className="w-8 h-8 sm:w-10 sm:h-10 "
/>
    </div>
              <span className="text-lg sm:text-xl font-bold gradient-text">
                ToknTalk
              </span>
            </div>
            <p className="text-text-secondary mb-4">
              Built on the Internet Computer Protocol
            </p>
            <div className="flex justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-text-secondary">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Support</span>
              <span>About</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
 