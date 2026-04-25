import React from 'react';
import { Mail, MessageCircle, Clock, Send, ArrowLeft, CheckCircle, XCircle, X } from 'lucide-react';
import Footer from '../components/Footer';
import { Link, useLocation } from 'react-router-dom';
import { sendContactMessage } from '../services/api';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [banner, setBanner] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Read incoming navigation state (e.g., from FAQ link)
  const location = useLocation();
  const navState = (location.state || {}) as { subject?: string; message?: string };

  const messageRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    // If the route provided subject/message, prefill the form and focus the message field
    if (navState?.subject || navState?.message) {
      setFormData(prev => ({
        ...prev,
        subject: navState.subject ?? prev.subject,
        message: navState.message ?? prev.message,
      }));

      // Delay focus slightly to ensure DOM is ready
      setTimeout(() => {
        messageRef.current?.focus();
      }, 50);
    }
  }, [navState?.subject, navState?.message]);

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
    // Auto-dismiss after 6 seconds
    setTimeout(() => setBanner(null), 6000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sendContactMessage(formData);
      showBanner('success', '✅ Message sent successfully! We\'ll get back to you within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      showBanner('error', err?.response?.data?.message || err?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">

      {/* Flash Banner */}
      {banner && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl mx-auto px-4 animate-fadeIn`}>
          <div className={`flex items-center justify-between gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm font-medium
            ${banner.type === 'success'
              ? 'bg-green-50 border-green-300 text-green-800'
              : 'bg-red-50 border-red-300 text-red-800'
            }`}>
            <div className="flex items-center gap-3">
              {banner.type === 'success'
                ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              }
              <span>{banner.message}</span>
            </div>
            <button onClick={() => setBanner(null)} className="flex-shrink-0 hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10 sm:py-16 max-w-6xl">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Contact Us
            </h1>
          </div>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select a subject</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing Question">Billing Question</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Partnership Opportunity">Partnership Opportunity</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  ref={messageRef}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Get in Touch</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Email Support</h3>
                    <p className="text-gray-600 text-sm mb-2">We typically respond within 24 hours</p>
                    <a href="mailto:mycareerlabai@gmail.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
                      mycareerlabai@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Live Chat</h3>
                    <p className="text-gray-600 text-sm mb-2">Available for Pro users</p>
                    <p className="text-purple-600 font-medium">Coming Soon</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Support Hours</h3>
                    <p className="text-gray-600 text-sm">Monday - Friday: 9 AM - 6 PM EST</p>
                    <p className="text-gray-600 text-sm">Saturday - Sunday: 10 AM - 4 PM EST</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 shadow-xl text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Development Team</h3>
              <p className="mb-4 text-indigo-100">
                CareerDev AI is proudly developed by:
              </p>
              <ul className="space-y-2 text-indigo-100">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Isaac Narteh
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Kyle Drummonds
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Alejandro Ramos
                </li>
              </ul>
              <p className="mt-4 text-sm text-indigo-100">
                We're committed to helping job seekers succeed with AI-powered tools.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-3">
                <a
                  href="/help"
                  className="block text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Visit our Help Center
                </a>
                <a
                  href="/faq"
                  className="block text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Browse FAQ
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-white rounded-2xl p-6 sm:p-12 shadow-xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Need Immediate Help?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Most questions can be answered quickly by checking our documentation and FAQ. For urgent technical issues, please include as much detail as possible in your message.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-4">
            <a
              href="/help"
              className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-800 rounded-full font-semibold hover:bg-gray-200 transition-all"
            >
              Help Center
            </a>
            <a
              href="/faq"
              className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-800 rounded-full font-semibold hover:bg-gray-200 transition-all"
            >
              FAQ
            </a>
            <a
              href="/app"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-xl transition-all"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactUs;
