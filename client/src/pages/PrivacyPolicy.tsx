import React from 'react';
import { Shield, Lock, Eye, Server, UserCheck, FileText, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
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
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-10 h-10 text-indigo-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
          </div>
          <p className="text-gray-600">Last Updated: January 28, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl space-y-8">
          <div>
            <p className="text-gray-700 mb-4">
              At CareerLab AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our resume optimization platform.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Information We Collect
            </h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                <p>When you use CareerLab AI, we may collect:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Name and email address (for account creation)</li>
                  <li>Resume content (when you upload files)</li>
                  <li>Job descriptions (when you paste them for analysis)</li>
                  <li>Usage data and preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Automatically Collected Information</h3>
                <p>We automatically collect certain information when you visit our platform:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>IP address and browser type</li>
                  <li>Device information and operating system</li>
                  <li>Usage patterns and interaction data</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-indigo-600" />
              How We Use Your Information
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Provide and improve our resume optimization services</li>
                <li>Analyze your resume against job descriptions using AI</li>
                <li>Generate optimized resume versions</li>
                <li>Communicate with you about your account and our services</li>
                <li>Improve our platform and develop new features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Server className="w-6 h-6 text-indigo-600" />
              Data Storage and Retention
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                <strong>Current Implementation:</strong> Currently, CareerLab AI processes your resume data in real-time without permanent storage in a database. Your resume content is used only for the immediate analysis you request and is not retained after your session ends.
              </p>
              <p>
                <strong>Future Updates:</strong> As we scale and add features, we may implement database storage for user accounts and resume versions. If this occurs, we will update this policy and notify users accordingly.
              </p>
              <p>
                We retain account information (email, name) for as long as your account is active or as needed to provide you services. You can request deletion of your account and data at any time.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-indigo-600" />
              Data Security
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Encrypted data transmission using SSL/TLS protocols</li>
                <li>Secure server infrastructure with regular security updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Regular security audits and monitoring</li>
              </ul>
              <p className="mt-3">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-600" />
              Your Rights and Choices
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate personal information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at privacy@mycareerlab.ai
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Third-Party Services</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                CareerLab AI may use third-party services for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>AI and machine learning processing (OpenAI, Anthropic, etc.)</li>
                <li>Analytics and performance monitoring</li>
                <li>Payment processing (for paid plans)</li>
                <li>Email communications</li>
              </ul>
              <p className="mt-3">
                These third parties have their own privacy policies. We carefully select partners who maintain high privacy and security standards.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Cookies and Tracking</h2>
            <div className="text-gray-700 space-y-2">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Maintain your session and preferences</li>
                <li>Analyze usage patterns and improve our service</li>
                <li>Provide personalized experiences</li>
              </ul>
              <p className="mt-3">
                You can control cookies through your browser settings, but disabling them may limit your ability to use certain features.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Children's Privacy</h2>
            <p className="text-gray-700">
              CareerLab AI is not intended for users under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child without parental consent, we will take steps to delete that information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">International Data Transfers</h2>
            <p className="text-gray-700">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
            <div className="text-gray-700 space-y-2">
              <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p><strong>Email:</strong> privacy@mycareerlab.ai</p>
                <p><strong>Support:</strong> support@mycareerlab.ai</p>
                <p><strong>Website:</strong> www.mycareerlab.ai</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Development Team</h2>
            <p className="text-gray-700">
              CareerLab AI is developed and maintained by Isaac Narteh, Kyle Drummonds, and Alejandro Ramos. We are committed to protecting your privacy and providing a secure, valuable service to help you succeed in your career journey.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
