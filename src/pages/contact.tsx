import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, AlertCircle, Clock, Users } from "lucide-react";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would send this data to your backend
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError("There was an error sending your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Get in Touch</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have questions or feedback? We'd love to hear from you. Our team is always ready to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-card border rounded-xl p-6 text-center hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Email Us</h3>
          <p className="text-muted-foreground mb-4">
            Our friendly team is here to help
          </p>
          <a href="mailto:support@inlits.com" className="text-primary hover:underline font-medium">
            support@inlits.com
          </a>
        </div>

        <div className="bg-card border rounded-xl p-6 text-center hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Call Us</h3>
          <p className="text-muted-foreground mb-4">
            Mon-Fri from 9am to 5pm
          </p>
          <a href="tel:+923284840271" className="text-primary hover:underline font-medium">
            +92 328 4840271
          </a>
        </div>

        <div className="bg-card border rounded-xl p-6 text-center hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
          <p className="text-muted-foreground mb-4">
            Come say hello at our office
          </p>
          <p className="text-primary font-medium">
            69b Block Commercial Area BHS, Lahore
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>

            {success ? (
              <div className="bg-primary/10 text-primary p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                <p>
                  Thank you for reaching out! We've received your message and will get back to you as soon as possible.
                </p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium mb-2"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell us what you need help with..."
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-base font-medium"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-primary/5 p-8">
            <h2 className="text-2xl font-bold mb-6">Additional Information</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Business Hours
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday:</span>
                    <span>9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday:</span>
                    <span>10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday:</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Departments
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Customer Support</p>
                    <a href="mailto:support@inlits.com" className="text-primary hover:underline text-sm">
                      support@inlits.com
                    </a>
                  </div>
                  <div>
                    <p className="font-medium">Creator Relations</p>
                    <a href="mailto:creators@inlits.com" className="text-primary hover:underline text-sm">
                      creators@inlits.com
                    </a>
                  </div>
                  <div>
                    <p className="font-medium">Advertising</p>
                    <a href="mailto:advertising@inlits.com" className="text-primary hover:underline text-sm">
                      advertising@inlits.com
                    </a>
                  </div>
                  <div>
                    <p className="font-medium">Copyright Claims</p>
                    <a href="mailto:copyright@inlits.com" className="text-primary hover:underline text-sm">
                      copyright@inlits.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  For urgent matters, please call us directly at{" "}
                  <a href="tel:+923284840271" className="text-primary hover:underline">
                    +92 328 4840271
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="mt-12 rounded-xl overflow-hidden h-[400px] border">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.5583031589!2d74.2293867!3d31.4825838!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391903d4d940f12b%3A0xdb8c83f6699d5226!2sBahria%20Town%2C%20Lahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1654321234567!5m2!1sen!2s" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}

export default ContactPage;