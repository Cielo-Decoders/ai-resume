import React from 'react';
import { Scale, FileText, Shield, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
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
            <Scale className="w-10 h-10 text-indigo-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Terms of Service
            </h1>
          </div>
          <p className="text-gray-600">Last Updated: March 11, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl space-y-8">
          <div>
            <p className="text-gray-700 mb-4">
              Welcome to CareerDev AI. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Acceptance of Terms
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                By accessing or using CareerDev AI — including uploading resume content, running analyses, or using any of the tools on this site — you agree to comply with and be bound by these Terms of Service and our Privacy Policy. CareerDev AI is primarily available without mandatory user accounts; most functionality is session-based and can be used anonymously unless provide contact information for optional features.
              </p>
              <p>
                We may update these terms from time to time. We will make the latest version available on this page and update the "Last Updated" date. Your continued use of CareerDev AI after changes constitutes acceptance of the updated terms. If you have provided an email, we may also notify you of material changes via those channels where appropriate.
              </p>
            </div>
          </div>

          {/*
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              User Accounts and Eligibility
            </h2>
            <div className="text-gray-700 space-y-2">
              <p><strong>Accounts are optional:</strong></p>
              <p>
                CareerDev AI is designed to work for most users without creating an account. Core functionality (uploading resumes, running analyses, and receiving optimized output) is session-based. Creating an account is optional and is only required if you want to save resume versions, access a history of analyses, or use certain paid features.
              </p>
              <p className="mt-2"><strong>If you create an account:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>You must be at least 16 years old to create an account and use account features.</li>
                <li>Provide accurate and complete registration information when requested.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
              </ul>
              <p className="mt-3"><strong>Account Security:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>If you have an account, notify us immediately of any unauthorized use.</li>
                <li>We are not liable for loss or damage resulting from your failure to maintain account security.</li>
                <li>Do not share your account or credentials with others.</li>
              </ul>
            </div>
          </div>
          */}

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Description</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                CareerDev AI provides AI-powered resume optimization services, including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>ATS (Applicant Tracking System) score analysis</li>
                <li>Resume and job description matching</li>
                <li>Keyword identification and integration</li>
                <li>Resume optimization suggestions</li>
                <li>Automated resume generation based on job requirements</li>
              </ul>
              <p className="mt-3">
                Our service is provided "as is" and we make no guarantees about job placement, interview invitations, or employment outcomes. CareerDev AI is a tool to assist in resume preparation, not a guarantee of employment success.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">User Responsibilities and Acceptable Use</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>You agree to:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Use the service only for lawful purposes</li>
                <li>Provide accurate information in your resume</li>
                <li>Not misrepresent your qualifications or experience</li>
                <li>Not use the service to create fraudulent documents</li>
                <li>Respect intellectual property rights</li>
                <li>Not attempt to hack, disrupt, or compromise the platform's security</li>
              </ul>
              <p className="mt-3"><strong>You agree NOT to:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Upload malicious files or code</li>
                <li>Use automated systems (bots) to access the service without permission</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Resell or redistribute our service without authorization</li>
                <li>Use the platform to harass, abuse, or harm others</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Intellectual Property Rights</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>Your Content:</strong></p>
              <p>
                You retain all rights to the content you upload (your resume). By using our service, you grant CareerDev AI a limited license to process, analyze, and optimize your content solely for the purpose of providing our services to you.
              </p>
              <p className="mt-3"><strong>Our Platform:</strong></p>
              <p>
                All rights, title, and interest in CareerDev AI (including software, algorithms, design, trademarks, and content) are owned by the development team and are protected by copyright and other intellectual property laws.
              </p>
              <p className="mt-3"><strong>AI-Generated Content:</strong></p>
              <p>
                The optimized resumes generated by our AI are provided to you for your use. You are responsible for reviewing and ensuring the accuracy of all AI-generated content before using it in job applications.
              </p>
            </div>
          </div>

          {/*
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Subscription and Payment Terms</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>Free Plan:</strong></p>
              <p>Our free plan includes limited features as described on our pricing page. We reserve the right to modify free plan limitations at any time.</p>

              <p className="mt-3"><strong>Paid Plans:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Subscription fees are charged in advance on a recurring basis</li>
                <li>All fees are non-refundable except as required by law or stated in our refund policy</li>
                <li>You can cancel your subscription at any time</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
              </ul>

              <p className="mt-3"><strong>Refund Policy:</strong></p>
              <p>
                We offer a 14-day money-back guarantee for new paid subscriptions. To request a refund, contact mycareerlabai@gmail.com within 14 days of your initial purchase.
              </p>
            </div>
          </div>
          */}

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" />
              Limitation of Liability
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAREERDEV AI AND ITS DEVELOPERS SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Employment outcomes or lack thereof</li>
                <li>Errors or inaccuracies in AI-generated content</li>
                <li>Service interruptions or technical issues</li>
                <li>Unauthorized access to your account due to your failure to maintain security</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Disclaimer of Warranties</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                CAREERDEV AI IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Warranties that the service will be uninterrupted or error-free</li>
                <li>Warranties regarding the accuracy or reliability of AI-generated content</li>
                <li>Warranties that the service will result in employment or interviews</li>
              </ul>
              <p className="mt-3">
                You acknowledge that AI technology has limitations and may produce errors. You are solely responsible for reviewing and verifying all content before use.
              </p>
            </div>
          </div>

          {/*
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Termination</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>By You:</strong></p>
              <p>If you have an account, you may terminate it at any time by contacting <a href="mailto:mycareerlabai@gmail.com" className="text-indigo-600">mycareerlabai@gmail.com</a> or by using any account self-service options available in your settings.</p>

              <p className="mt-3"><strong>By Us:</strong></p>
              <p>We reserve the right to suspend or terminate accounts or access to features if:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>You materially violate these Terms of Service.</li>
                <li>You engage in fraudulent or illegal activities.</li>
                <li>Your account poses a security risk.</li>
                <li>You fail to pay applicable fees for paid services.</li>
              </ul>
              <p className="mt-3">
                Upon termination of an account, your right to use account-specific features ceases immediately. We may delete associated account data in accordance with our data retention policies; session-based analyses or transient processing performed by third-party providers may not be reversible.
              </p>
            </div>
          </div>
          */}

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-indigo-600" />
              Indemnification
            </h2>
            <div className="text-gray-700">
              <p>
                You agree to indemnify, defend, and hold harmless CareerDev AI, its developers from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Your use or misuse of the service</li>
                <li>Your violation of these Terms of Service</li>
                <li>Your violation of any rights of another party</li>
                <li>Any content you submit or generate using our service</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Governing Law and Disputes</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                These Terms of Service shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these terms or your use of CareerDev AI shall be resolved through binding arbitration, except where prohibited by law. You agree to waive any right to a jury trial or to participate in a class action.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Severability</h2>
            <div className="text-gray-700">
              <p>
                If any provision of these Terms of Service is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Entire Agreement</h2>
            <div className="text-gray-700">
              <p>
                These Terms of Service, together with our Privacy Policy, constitute the entire agreement between you and CareerDev AI regarding the use of our service, superseding any prior agreements.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Information</h2>
            <div className="text-gray-700 space-y-2">
              <p>If you have questions about these Terms of Service, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p><strong>Email:</strong> mycareerlabai@gmail.com</p>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
