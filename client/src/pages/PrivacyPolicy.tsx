import React from 'react';
import { Shield, Lock, Eye, Server, UserCheck, FileText, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-10 sm:py-16 max-w-4xl">
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
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
          </div>
          <p className="text-gray-600">Last Updated: January 28, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-12 shadow-xl space-y-8">
          <div>
            <p className="text-gray-700 mb-4">
              At CareerDev AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our resume optimization platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              Information We Collect
            </h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">What we process</h3>
                <p>The platform does not require users to create accounts — most functionality is session-based. During an analysis session we only process the inputs you provide for that session:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Resume content you upload (used solely for immediate analysis and optimization)</li>
                  <li>Job descriptions or role text you paste for matching and scoring</li>
                  <li>User selections such as chosen job-relevant keywords or terms</li>
                </ul>
                <p className="mt-2">These inputs are used to generate the optimized resume and suggestions; they are not permanently stored by CareerDev AI in our database as part of normal operation (see "Data Storage and Retention").</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Automatically collected information</h3>
                <p>We do not collect technical telemetry (such as IP addresses, device/browser identifiers, or usage analytics) as part of normal operation. The platform only processes the inputs you explicitly provide during an analysis session (see "What we process").</p>
                <p className="mt-2">If our practices change in the future and we begin collecting technical or usage data, we will update this policy and notify users.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              How We Use Your Information
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>We use only the inputs you provide during an analysis session to deliver the service you request. Specifically:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Perform resume analysis and scoring against the supplied job description.</li>
                <li>Generate optimized resume text, keyword suggestions, and formatting recommendations returned to you.</li>
                <li>Enable optional session features you explicitly trigger (for example, saving a generated version) only when you choose to do so.</li>
                <li>Take actions necessary to comply with legal requirements or respond to abuse or security incidents.</li>
              </ul>
              <p className="mt-2">We do not use uploaded content for marketing, profiling, or training internal models beyond the third-party processing described elsewhere; we do not sell or share your resume with employers. If you voluntarily provide contact information (for support or to enable optional account features), we will use it only to respond to your request and as described elsewhere in this policy.</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              Data Storage and Retention
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                <strong>Current Implementation:</strong> Currently, CareerDev AI processes your resume data in real-time without permanent storage in a database. Your resume content is used only for the immediate analysis you request and is not retained by our systems after your session ends.
              </p>
              <p>
                <strong>Important note about AI processing:</strong> To provide resume optimization, we send resume content and job descriptions to third-party AI service providers (for example, OpenAI) for processing. While we do not store the full resumes in our own databases, the third-party providers we use may process, temporarily retain, or use the data according to their own terms and privacy policies. This means that, in some circumstances, information you submit could be used by those providers to improve or train their models or otherwise be subject to their data handling practices. We recommend that you avoid submitting highly sensitive information (such as social security numbers, financial account numbers, or other confidential data) in your resume or job description text.
              </p>
              <p>
                <strong>Future Updates:</strong> As we scale and add features, we may implement database storage for optional user accounts and resume versions. If this occurs, we will update this policy and notify users accordingly.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              Data Security
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                We use industry-standard measures to protect data in transit and to limit internal access where needed to operate the service.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Encrypted transmission (HTTPS/TLS) when uploading or sending resume content to our service and third‑party processors.</li>
                <li>Access to processing systems and environments is restricted to authorized personnel only and protected by authentication and role-based access controls.</li>
                <li>We rely on reputable third‑party AI providers for model processing; those providers maintain their own security and compliance measures which govern how data is handled on their platforms.</li>
              </ul>
              <p className="mt-3">
                Important: CareerDev AI does not permanently store full resume files as part of normal operation — resumes are processed in real time for the analysis you request. Because we transmit data to third‑party processors, please avoid submitting highly sensitive personal information (such as social security numbers or financial account numbers).
              </p>
              <p className="mt-1">
                While we take reasonable steps to protect data, no system is perfectly secure. If you have specific security or compliance questions, contact us at <a href="mailto:mycareerlabai@gmail.com" className="text-indigo-600">mycareerlabai@gmail.com</a> and we will provide additional details.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              Your Rights and Choices
            </h2>
            {/*
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
            */}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Third-Party Services</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                CareerDev AI may use third-party services for:
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Cookies and Tracking</h2>
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Children's Privacy</h2>
            <p className="text-gray-700">
              CareerDev AI is not intended for users under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child without parental consent, we will take steps to delete that information.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">International Data Transfers</h2>
            <p className="text-gray-700">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
            <div className="text-gray-700 space-y-2">
              <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p><strong>Email:</strong> mycareerlabai@gmail.com</p>
                <p><strong>Support:</strong> mycareerlabai@gmail.com</p>
                <p><strong>Website:</strong> www.careerdev.io</p>
              </div>
            </div>
          </div>
          {/*
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Development Team</h2>
            <p className="text-gray-700">
              CareerDev AI is developed and maintained by Isaac Narteh, Kyle Drummonds, and Alejandro Ramos. We are committed to protecting your privacy and providing a secure, valuable service to help you succeed in your career journey.
            </p>
          </div>
          */}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
