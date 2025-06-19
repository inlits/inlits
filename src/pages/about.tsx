import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Headphones, 
  FileText, 
  Users, 
  Zap, 
  Shield, 
  Globe, 
  BookMarked,
  ArrowRight,
  Star,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

export function AboutPage() {
  // Refs for animation elements
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const handleIntersect = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    
    // Observe all section refs
    [heroRef, featuresRef, statsRef, testimonialsRef, pricingRef].forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    // Observe all elements with animation classes
    document.querySelectorAll('.fade-in-element').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section 
        ref={heroRef} 
        className="relative py-20 md:py-32 opacity-0 transition-all duration-1000 translate-y-8"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 -z-10"></div>
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-[60%] -left-[5%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Discover a new way to learn
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Stories, Ideas, and <span className="text-primary">Communities</span> Unite
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Inlits is a platform designed to connect readers, writers, and thinkers in a shared space of stories and ideas. Discover, create, and discuss content that matters to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-medium"
            >
              Get Started Free
            </Link>
            <Link 
              to="/library" 
              className="px-8 py-3 rounded-lg border border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all font-medium"
            >
              Explore Library
            </Link>
          </div>

          {/* Floating devices mockup */}
          <div className="relative mt-16 md:mt-24 max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent h-20 bottom-0 z-10"></div>
            <img 
              src="https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg" 
              alt="Inlits Platform" 
              className="rounded-t-xl shadow-2xl border border-primary/10"
            />
            <div className="absolute -bottom-10 -left-10 md:-left-20 w-40 md:w-64 rotate-6 shadow-xl rounded-lg border border-primary/20 transition-transform hover:rotate-3 hover:scale-105">
              <img 
                src="https://images.pexels.com/photos/4050421/pexels-photo-4050421.jpeg" 
                alt="Mobile App" 
                className="rounded-lg"
              />
            </div>
            <div className="absolute -bottom-5 -right-5 md:-right-16 w-32 md:w-48 -rotate-3 shadow-xl rounded-lg border border-primary/20 transition-transform hover:rotate-0 hover:scale-105">
              <img 
                src="https://images.pexels.com/photos/4050326/pexels-photo-4050326.jpeg" 
                alt="Tablet App" 
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 md:py-16 border-y">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground mb-8">Trusted by readers and creators worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {['Harvard University', 'Stanford', 'MIT Press', 'Oxford Learning', 'Cambridge Press', 'Princeton'].map((partner, index) => (
              <div 
                key={index} 
                className="text-xl font-semibold text-muted-foreground/70 fade-in-element opacity-0 transition-all duration-700"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="py-20 md:py-32 opacity-0 transition-all duration-1000 translate-y-8"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Learn and Grow</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover a comprehensive platform designed to enhance your learning journey with powerful features and tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="w-10 h-10 text-primary" />,
                title: "Content Discovery",
                description: "Explore a wide range of articles, e-books, audiobooks, and podcasts across various categories.",
                delay: 0.1
              },
              {
                icon: <FileText className="w-10 h-10 text-primary" />,
                title: "Creator Tools",
                description: "Empower writers and creators with tools to publish and manage their content.",
                delay: 0.2
              },
              {
                icon: <Users className="w-10 h-10 text-primary" />,
                title: "Community Engagement",
                description: "Connect with like-minded individuals through book clubs, discussions, and learning challenges.",
                delay: 0.3
              },
              {
                icon: <BookMarked className="w-10 h-10 text-primary" />,
                title: "Personalized Experience",
                description: "Customize your reading preferences, track your learning goals, and build your personal library.",
                delay: 0.4
              },
              {
                icon: <Headphones className="w-10 h-10 text-primary" />,
                title: "Audio Content",
                description: "Listen to audiobooks and podcasts with our advanced audio player with customizable playback options.",
                delay: 0.5
              },
              {
                icon: <Zap className="w-10 h-10 text-primary" />,
                title: "Offline Access",
                description: "Access cached content even without an internet connection, thanks to Service Worker implementation.",
                delay: 0.6
              },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-card border rounded-xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 fade-in-element opacity-0"
                style={{ animationDelay: `${feature.delay}s` }}
              >
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Inlits Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A simple, intuitive process designed to enhance your learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                number: "01",
                title: "Discover Content",
                description: "Browse through our extensive library of books, articles, podcasts, and audiobooks tailored to your interests.",
                delay: 0.1
              },
              {
                number: "02",
                title: "Engage & Learn",
                description: "Read, listen, and engage with content. Take notes, highlight important passages, and track your progress.",
                delay: 0.3
              },
              {
                number: "03",
                title: "Connect & Grow",
                description: "Join communities, participate in discussions, and connect with like-minded learners and creators.",
                delay: 0.5
              }
            ].map((step, index) => (
              <div 
                key={index} 
                className="text-center fade-in-element opacity-0 transition-all duration-1000"
                style={{ animationDelay: `${step.delay}s` }}
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-20 max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl transform rotate-1"></div>
            <div className="relative bg-card border rounded-2xl p-8 md:p-12 shadow-lg -rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Ready to start your learning journey?</h3>
                  <p className="text-muted-foreground mb-6">
                    Join thousands of learners who are discovering new ideas, expanding their knowledge, and connecting with a community of curious minds.
                  </p>
                  <Link 
                    to="/signup" 
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    Get Started Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="relative">
                  <img 
                    src="https://images.pexels.com/photos/3059748/pexels-photo-3059748.jpeg" 
                    alt="Learning Journey" 
                    className="rounded-lg shadow-lg"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                    Join 50,000+ learners
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        ref={statsRef}
        className="py-20 md:py-32 opacity-0 transition-all duration-1000 translate-y-8"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
            {[
              { number: "500K+", label: "Active Users" },
              { number: "1.2M+", label: "Content Items" },
              { number: "50K+", label: "Creators" },
              { number: "120+", label: "Countries" }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="text-center fade-in-element opacity-0 transition-all duration-700"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Categories Section */}
      <section className="py-20 md:py-32 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Our Content Categories</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover content across a wide range of topics and formats to suit your learning style
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: <BookOpen />, name: "Business" },
              { icon: <Shield />, name: "Technology" },
              { icon: <Globe />, name: "Science" },
              { icon: <FileText />, name: "Arts" },
              { icon: <BookMarked />, name: "History" },
              { icon: <Headphones />, name: "Philosophy" },
              { icon: <Users />, name: "Psychology" },
              { icon: <Zap />, name: "Self-Development" },
              { icon: <Star />, name: "Mathematics" },
              { icon: <CheckCircle />, name: "Languages" },
              { icon: <BookOpen />, name: "Literature" },
              { icon: <Globe />, name: "Politics" }
            ].map((category, index) => (
              <div 
                key={index} 
                className="bg-card border rounded-xl p-6 text-center hover:shadow-md hover:border-primary/30 transition-all hover:-translate-y-1 fade-in-element opacity-0"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {React.cloneElement(category.icon, { className: "w-6 h-6 text-primary" })}
                </div>
                <h3 className="font-medium">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        ref={testimonialsRef}
        className="py-20 md:py-32 opacity-0 transition-all duration-1000 translate-y-8"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Hear from our community of learners and creators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Inlits has transformed how I consume educational content. The personalized recommendations are spot-on!",
                author: "Sarah Johnson",
                role: "Software Engineer",
                avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
                delay: 0.1
              },
              {
                quote: "As a creator, I've found an engaged audience who truly appreciates in-depth content. The platform tools make publishing a breeze.",
                author: "Michael Chen",
                role: "Content Creator",
                avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
                delay: 0.3
              },
              {
                quote: "The book clubs and discussion features have connected me with like-minded people from around the world. It's more than just a reading platform.",
                author: "Aisha Patel",
                role: "Book Enthusiast",
                avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
                delay: 0.5
              }
            ].map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-card border rounded-xl p-8 shadow-sm hover:shadow-md transition-all fade-in-element opacity-0"
                style={{ animationDelay: `${testimonial.delay}s` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-lg mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{testimonial.author}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        ref={pricingRef}
        className="py-20 md:py-32 bg-primary/5 opacity-0 transition-all duration-1000 translate-y-8"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                description: "Perfect for casual readers",
                features: [
                  "Access to free content",
                  "Basic reading tools",
                  "Join up to 3 communities",
                  "Standard support"
                ],
                cta: "Get Started",
                highlighted: false,
                delay: 0.1
              },
              {
                name: "Pro",
                price: "$9.99",
                period: "per month",
                description: "For serious learners",
                features: [
                  "Everything in Free",
                  "Unlimited premium content",
                  "Advanced reading tools",
                  "Unlimited communities",
                  "Priority support",
                  "Offline access"
                ],
                cta: "Try Free for 7 Days",
                highlighted: true,
                delay: 0.2
              },
              {
                name: "Creator",
                price: "$19.99",
                period: "per month",
                description: "For content creators",
                features: [
                  "Everything in Pro",
                  "Publishing tools",
                  "Analytics dashboard",
                  "Monetization options",
                  "Creator community",
                  "Dedicated support"
                ],
                cta: "Start Creating",
                highlighted: false,
                delay: 0.3
              }
            ].map((plan, index) => (
              <div 
                key={index} 
                className={`bg-card rounded-xl overflow-hidden transition-all fade-in-element opacity-0 ${
                  plan.highlighted 
                    ? 'border-primary shadow-lg shadow-primary/10 scale-105 relative z-10' 
                    : 'border shadow-sm'
                }`}
                style={{ animationDelay: `${plan.delay}s` }}
              >
                {plan.highlighted && (
                  <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    to="/signup" 
                    className={`block w-full py-3 rounded-lg text-center font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Find answers to common questions about Inlits
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "What is Inlits?",
                answer: "Inlits is a platform designed to connect readers, writers, and thinkers in a shared space of stories and ideas. We offer a wide range of content including articles, e-books, audiobooks, and podcasts across various categories."
              },
              {
                question: "How do I get started?",
                answer: "Getting started is easy! Simply sign up for a free account, set your reading preferences, and start exploring content. You can save items to your library, join communities, and track your learning progress."
              },
              {
                question: "Can I access content offline?",
                answer: "Yes, with our Pro plan, you can download content for offline access. This feature allows you to continue learning even when you don't have an internet connection."
              },
              {
                question: "How do I become a creator?",
                answer: "To become a creator, sign up for a Creator account. You'll get access to our publishing tools, analytics dashboard, and monetization options. You can create articles, books, audiobooks, and podcasts."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and Apple Pay. All payments are processed securely through our payment providers."
              },
              {
                question: "Can I cancel my subscription anytime?",
                answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period."
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className="bg-card border rounded-xl p-6 hover:border-primary/30 transition-all fade-in-element opacity-0"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Learning Journey?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of learners who are discovering new ideas, expanding their knowledge, and connecting with a community of curious minds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/signup" 
                className="px-8 py-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-medium text-lg"
              >
                Get Started Free
              </Link>
              <Link 
                to="/contact" 
                className="px-8 py-4 rounded-lg border border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all font-medium text-lg"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* App Features Showcase */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 fade-in-element opacity-0 transition-all duration-1000">
              <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Personalized Experience
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Tailored to Your Learning Style</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform adapts to how you learn best. Whether you prefer reading, listening, or interactive content, Inlits provides a personalized experience that evolves with your interests and goals.
              </p>
              
              <div className="space-y-4">
                {[
                  "Smart content recommendations based on your interests",
                  "Customizable reading interface with font and theme options",
                  "Progress tracking across all your learning goals",
                  "Seamless synchronization across all your devices"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-primary" />
                    </div>
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
              
              <Link 
                to="/library" 
                className="inline-flex items-center gap-2 mt-8 text-primary hover:underline font-medium"
              >
                Explore personalization features
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="order-1 lg:order-2 relative fade-in-element opacity-0 transition-all duration-1000">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl transform rotate-3"></div>
              <img 
                src="https://images.pexels.com/photos/5077047/pexels-photo-5077047.jpeg" 
                alt="Personalized Learning" 
                className="relative rounded-2xl shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-500"
              />
              <div className="absolute -bottom-6 -right-6 bg-card border shadow-lg rounded-lg p-4 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-medium">Learning Streak: 28 Days</p>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 md:py-32 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative fade-in-element opacity-0 transition-all duration-1000">
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src="https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg" 
                  alt="Community Discussion" 
                  className="rounded-lg shadow-md transform hover:scale-105 transition-transform"
                />
                <img 
                  src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg" 
                  alt="Book Club" 
                  className="rounded-lg shadow-md transform hover:scale-105 transition-transform mt-8"
                />
                <img 
                  src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg" 
                  alt="Learning Together" 
                  className="rounded-lg shadow-md transform hover:scale-105 transition-transform"
                />
                <img 
                  src="https://images.pexels.com/photos/3182781/pexels-photo-3182781.jpeg" 
                  alt="Group Study" 
                  className="rounded-lg shadow-md transform hover:scale-105 transition-transform mt-8"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card border shadow-lg rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <img 
                        key={i}
                        src={`https://images.pexels.com/photos/22${i}453/pexels-photo-22${i}453.jpeg?auto=compress&cs=tinysrgb&w=50`} 
                        alt="Community Member" 
                        className="w-8 h-8 rounded-full border-2 border-background object-cover"
                      />
                    ))}
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs border-2 border-background">
                      +42
                    </div>
                  </div>
                  <p className="text-sm font-medium">Active in this community</p>
                </div>
              </div>
            </div>
            
            <div className="fade-in-element opacity-0 transition-all duration-1000">
              <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Community-Driven
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Learn Together, Grow Together</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Learning is better with others. Join vibrant communities of readers and learners who share your interests, participate in discussions, and collaborate on learning projects.
              </p>
              
              <div className="space-y-6">
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Book Clubs</h3>
                  <p className="text-muted-foreground mb-4">
                    Join virtual book clubs focused on specific topics or genres. Discuss chapters, share insights, and deepen your understanding through collective wisdom.
                  </p>
                  <Link 
                    to="/community" 
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    Browse book clubs
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Learning Challenges</h3>
                  <p className="text-muted-foreground mb-4">
                    Participate in structured learning challenges with clear goals and timelines. Stay motivated and accountable with fellow learners.
                  </p>
                  <Link 
                    to="/community" 
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    Explore challenges
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="fade-in-element opacity-0 transition-all duration-1000">
              <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                For Creators
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Share Your Knowledge</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Inlits provides powerful tools for creators to publish, distribute, and monetize their content. Reach an engaged audience hungry for quality educational material.
              </p>
              
              <div className="space-y-4">
                {[
                  "Intuitive publishing tools for articles, books, and audio content",
                  "Detailed analytics to understand your audience",
                  "Multiple monetization options including subscriptions and one-time purchases",
                  "Built-in community features to engage directly with your readers"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-primary" />
                    </div>
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
              
              <Link 
                to="/signup" 
                className="inline-flex items-center gap-2 px-6 py-3 mt-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Become a Creator
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="relative fade-in-element opacity-0 transition-all duration-1000">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-2xl transform -rotate-3"></div>
              <img 
                src="https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg" 
                alt="Content Creator" 
                className="relative rounded-2xl shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500"
              />
              <div className="absolute -top-6 -left-6 bg-card border shadow-lg rounded-lg p-4 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-medium">Creator Earnings</p>
                </div>
                <p className="text-2xl font-bold text-primary">$12,450</p>
                <p className="text-sm text-muted-foreground">Last month's earnings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
            Start Your Learning Journey Today
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join our community of learners and creators. Discover, learn, and grow with Inlits.
          </p>
          <Link 
            to="/signup" 
            className="inline-flex items-center gap-2 px-10 py-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-medium text-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-muted-foreground">No credit card required</p>
        </div>
      </section>

      {/* Custom CSS for animations */}
      <style jsx>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}

export default AboutPage;