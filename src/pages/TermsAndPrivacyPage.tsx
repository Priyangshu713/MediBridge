import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Lock, Shield, ArrowLeft, Database, Cookie } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const TermsAndPrivacyPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<string>('terms');

    useEffect(() => {
        // Check URL query parameter for tab selection
        const searchParams = new URLSearchParams(location.search);
        const tabParam = searchParams.get('tab');
        if (tabParam === 'privacy') {
            setActiveTab('privacy');
        } else if (tabParam === 'data') {
            setActiveTab('data');
        } else if (tabParam === 'cookies') {
            setActiveTab('cookies');
        }
    }, [location]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div
            className="min-h-[calc(100vh-120px)] flex flex-col pt-24 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div variants={itemVariants} className="flex items-center mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Heart className="text-primary h-6 w-6" />
                    Legal Terms & Privacy
                </h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white/95 backdrop-blur-sm rounded-lg border shadow-md p-6 mb-12">
                <Tabs defaultValue="terms" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 h-auto md:grid-cols-4 mb-6 gap-2">
                        <TabsTrigger value="terms" className="text-xs sm:text-sm md:text-base lg:text-lg py-2">Terms of Service</TabsTrigger>
                        <TabsTrigger value="privacy" className="text-xs sm:text-sm md:text-base lg:text-lg py-2">Privacy Policy</TabsTrigger>
                        <TabsTrigger value="data" className="text-xs sm:text-sm md:text-base lg:text-lg py-2">Data Processing</TabsTrigger>
                        <TabsTrigger value="cookies" className="text-xs sm:text-sm md:text-base lg:text-lg py-2">Cookie Policy</TabsTrigger>
                    </TabsList>

                    <TabsContent value="terms" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Terms of Service
                            </h2>

                            <div className="space-y-4 text-muted-foreground">
                                <section>
                                    <h3 className="font-medium text-foreground mb-2">1. Acceptance of Terms</h3>
                                    <p>By accessing or using MediBridge, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">2. Service Description</h3>
                                    <p>MediBridge provides a platform for users to track and manage personal health information. Our service offers tools to monitor health metrics, set goals, and receive personalized insights.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">3. User Accounts</h3>
                                    <p>To use MediBridge, you must create an account with a valid email address and password. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">4. Secure Cloud Storage</h3>
                                    <p>MediBridge is designed to store your health data securely on our servers. This enables seamless cross-device synchronization and ensures your data is protected and backed up. We use industry-standard encryption to safeguard your information.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">5. User Conduct</h3>
                                    <p>You agree not to use MediBridge for any unlawful purpose or in any way that could damage, disable, or impair the service. You may not attempt to gain unauthorized access to any part of the service.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">6. Intellectual Property</h3>
                                    <p>All content, features, and functionality of MediBridge are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">7. Disclaimer of Warranties</h3>
                                    <p>MediBridge is provided "as is" without warranties of any kind. We do not guarantee that the service will be error-free or uninterrupted.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">8. Limitation of Liability</h3>
                                    <p>MediBridge shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">9. Modifications to Terms</h3>
                                    <p>We reserve the right to modify these Terms of Service at any time. Continued use of MediBridge after changes constitutes acceptance of the modified terms.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">10. Governing Law</h3>
                                    <p>These Terms of Service shall be governed by the laws of the jurisdiction in which we operate, without regard to its conflict of law provisions.</p>
                                </section>
                            </div>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="privacy" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                Privacy Policy
                            </h2>

                            <div className="space-y-4 text-muted-foreground">
                                <section>
                                    <h3 className="font-medium text-foreground mb-2">1. Data Accessed</h3>
                                    <p>MediBridge is committed to protecting your privacy. When you use our application, we access and collect the following types of data:</p>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">a) Google User Data (via Google Sign-In)</h4>
                                    <p>If you choose to sign in using Google OAuth, we access the following data from your Google account:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Name:</strong> Your full name as registered with your Google account</li>
                                        <li><strong>Email address:</strong> Your primary Google email address</li>
                                        <li><strong>Profile picture:</strong> Your Google account profile photo</li>
                                    </ul>
                                    <p className="mt-2">We do not access any other Google user data beyond what is listed above. We do not access your Google contacts, Google Drive files, calendar events, or any other Google services data.</p>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">b) Data You Provide Directly</h4>
                                    <p>In addition to Google user data, we collect the following information that you voluntarily provide:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>Password (encrypted, for email/password sign-up only)</li>
                                        <li>Health metrics and measurements</li>
                                        <li>Personal health history and medical records</li>
                                        <li>Nutrition and fitness information</li>
                                        <li>Wellness journal entries (mood, stress levels, notes)</li>
                                        <li>Goals and progress tracking data</li>
                                        <li>Appointment booking details</li>
                                    </ul>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">c) Automatically Collected Data</h4>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>Basic account activity data (login dates, app usage statistics)</li>
                                        <li>Device and browser information for security purposes</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">2. Data Usage</h3>
                                    <p>We use, process, and handle the Google user data and other collected data strictly for the following purposes:</p>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">a) Google User Data Usage</h4>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Name and profile picture:</strong> Used solely to personalize your MediBridge account profile and display your identity within the application</li>
                                        <li><strong>Email address:</strong> Used for account authentication, account recovery, and sending essential service-related communications (e.g., appointment confirmations, security alerts)</li>
                                    </ul>
                                    <p className="mt-2">We do <strong>not</strong> use your Google user data for advertising, marketing to third parties, or any purpose unrelated to the core functionality of MediBridge.</p>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">b) Health and Application Data Usage</h4>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>Providing personalized health insights and AI-powered recommendations</li>
                                        <li>Enabling cross-device synchronization of your health data</li>
                                        <li>Facilitating appointment bookings with healthcare professionals</li>
                                        <li>Generating wellness reports and visualizations for your personal use</li>
                                        <li>Improving and maintaining the quality of our services</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">3. Data Sharing</h3>
                                    <p>MediBridge does <strong>not</strong> sell, rent, trade, or otherwise transfer your personal information or Google user data to any third parties for their own purposes. Specifically:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>No sale of data:</strong> We never sell your Google user data or any other personal data to third parties</li>
                                        <li><strong>No advertising use:</strong> Your data is never shared with advertisers or used for targeted advertising</li>
                                        <li><strong>No unauthorized sharing:</strong> We do not share your data with third parties for purposes unrelated to MediBridge's core functionality</li>
                                    </ul>
                                    <p className="mt-3"><strong>Limited exceptions where data may be shared:</strong></p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>With your explicit consent:</strong> If you choose to share wellness data with a doctor during an appointment booking, the data you select will be included in the appointment report. This sharing is entirely optional and initiated by you</li>
                                        <li><strong>Service providers:</strong> We use trusted third-party services (such as cloud hosting and authentication providers) that may process your data on our behalf. These providers are contractually bound to use your data only for providing their services to us and are obligated to protect your data</li>
                                        <li><strong>Legal requirements:</strong> We may disclose your data if required to do so by law or in response to valid legal requests by public authorities</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">4. Data Storage & Protection</h3>
                                    <p>We take the security and protection of your data seriously. The following measures are in place to safeguard your information:</p>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">a) Encryption</h4>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>In transit:</strong> All data transmitted between your device and our servers is encrypted using HTTPS/TLS (SSL) protocols</li>
                                        <li><strong>At rest:</strong> Sensitive data, including passwords and authentication tokens, is encrypted using industry-standard encryption algorithms (bcrypt for passwords, secure HTTP-only cookies for sessions)</li>
                                    </ul>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">b) Access Controls</h4>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>Strict access controls ensure that only authorized personnel can access server infrastructure</li>
                                        <li>Authentication tokens are stored as secure, HTTP-only cookies to prevent unauthorized client-side access</li>
                                        <li>Google OAuth tokens are used only during the authentication flow and are not stored long-term</li>
                                    </ul>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">c) Infrastructure Security</h4>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>Our application is hosted on industry-leading cloud platforms (Vercel, MongoDB Atlas) with built-in security features</li>
                                        <li>Regular security reviews are conducted to identify and address potential vulnerabilities</li>
                                        <li>CORS policies are configured to restrict unauthorized cross-origin access</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">5. Data Retention & Deletion</h3>
                                    <p>We retain your data only for as long as necessary to provide our services and fulfill the purposes described in this policy:</p>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">a) Retention Periods</h4>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Account information (including Google user data):</strong> Retained for as long as your account is active</li>
                                        <li><strong>Health data and wellness entries:</strong> Retained securely on our servers for as long as your account is active, or until you choose to delete individual entries</li>
                                        <li><strong>Usage logs:</strong> Retained for up to 90 days, then automatically deleted</li>
                                        <li><strong>Appointment records:</strong> Retained for the duration of your account's existence for your reference</li>
                                    </ul>
                                    <h4 className="font-medium text-foreground mt-3 mb-1">b) How to Request Deletion</h4>
                                    <p>You have the right to request the deletion of your data at any time. You can:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Delete individual data:</strong> Remove specific health entries, wellness journal records, or appointment data through your account dashboard</li>
                                        <li><strong>Delete your entire account:</strong> Navigate to your account settings and use the "Delete Account" option. This will permanently remove your account and all associated data — including any Google user data we have stored — from our servers</li>
                                        <li><strong>Contact us:</strong> Email us at <strong>support@medibridge.qzz.io</strong> to request a full data deletion. We will process your request within 30 days</li>
                                    </ul>
                                    <p className="mt-2">Upon account deletion, all your personal data, Google user data, health records, and any other stored information will be permanently and irreversibly removed from our servers.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">6. Your Rights & Control</h3>
                                    <p>You have full control over your data. At any time, you can:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>Access and review all personal data we hold about you</li>
                                        <li>Update or correct your account information</li>
                                        <li>Export your health data for personal use</li>
                                        <li>Revoke Google OAuth access through your Google Account settings at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary underline">myaccount.google.com/permissions</a></li>
                                        <li>Delete your account and all associated data</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">7. Updates to Privacy Policy</h3>
                                    <p>We may update this Privacy Policy periodically to reflect changes in our practices, technology, or legal requirements. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. For significant changes, we may also notify you via email.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">8. Contact Us</h3>
                                    <p>If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us at:</p>
                                    <p className="mt-2"><strong>Email:</strong> support@medibridge.qzz.io</p>
                                </section>
                            </div>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="data" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                Data Processing
                            </h2>

                            <div className="space-y-4 text-muted-foreground">
                                <section>
                                    <h3 className="font-medium text-foreground mb-2">1. General Principles</h3>
                                    <p>MediBridge processes your data in accordance with GDPR, HIPAA, and other applicable data protection regulations. We follow the principles of data minimization, purpose limitation, and transparency in all our data processing activities.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">2. Types of Data Processing</h3>
                                    <p>We engage in the following data processing activities:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Authentication processing:</strong> Verification of user credentials during login</li>
                                        <li><strong>Health data storage:</strong> Securely storing your health metrics on our servers</li>
                                        <li><strong>Analytics processing:</strong> Anonymous usage statistics to improve our service</li>
                                        <li><strong>Account management:</strong> Processing related to account creation, maintenance, and deletion</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">3. Lawful Basis for Processing</h3>
                                    <p>We process your data based on the following legal grounds:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Contract performance:</strong> Processing necessary to provide you with our services</li>
                                        <li><strong>Consent:</strong> Processing based on your specific consent (e.g., for promotional emails)</li>
                                        <li><strong>Legitimate interests:</strong> Processing for our legitimate business interests, such as improving our services</li>
                                        <li><strong>Legal obligation:</strong> Processing to comply with legal requirements</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">4. Health Data Processing</h3>
                                    <p>MediBridge takes a privacy-first approach to health data:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>Your health metrics and history are processed and stored securely on our encrypted servers</li>
                                        <li>Data is transmitted using secure, encrypted protocols (SSL/TLS)</li>
                                        <li>AI analysis helps provide personalized insights while maintaining strict privacy standards</li>
                                        <li>You maintain complete control over your data through your account settings</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">5. Third-Party Processors</h3>
                                    <p>We use the following third-party data processors:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Authentication services:</strong> For secure login functionality</li>
                                        <li><strong>Cloud storage providers:</strong> For secure storage of account information</li>
                                        <li><strong>Analytics providers:</strong> For anonymous usage statistics</li>
                                    </ul>
                                    <p className="mt-2">All third-party processors are contractually bound to maintain the confidentiality and security of your data.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">6. Data Retention</h3>
                                    <p>We retain different types of data for different periods:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Account information:</strong> Retained until you delete your account</li>
                                        <li><strong>Usage logs:</strong> Retained for 90 days</li>
                                        <li><strong>Health data:</strong> Retained securely on our servers until you choose to delete it</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">7. International Data Transfers</h3>
                                    <p>Your account information may be transferred to and processed in countries outside your country of residence. When we transfer your information:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>We implement appropriate safeguards like standard contractual clauses</li>
                                        <li>We ensure the receiving country provides adequate data protection</li>
                                        <li>We comply with cross-border data transfer regulations</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">8. Data Subject Rights</h3>
                                    <p>As a data subject, you have the following rights:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>Right to access your personal data</li>
                                        <li>Right to rectify inaccurate data</li>
                                        <li>Right to erasure ("right to be forgotten")</li>
                                        <li>Right to restrict processing</li>
                                        <li>Right to data portability</li>
                                        <li>Right to object to processing</li>
                                    </ul>
                                    <p className="mt-2">To exercise these rights, please contact our Data Protection Officer at support@medibridge.qzz.io.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">9. Data Protection Officer</h3>
                                    <p>Our Data Protection Officer oversees our data processing activities and can be contacted at:</p>
                                    <p className="mt-2">
                                        Data Protection Officer<br />
                                        MediBridge<br />
                                        123 Health Street<br />
                                        Wellness City, 10001<br />
                                        support@medibridge.qzz.io
                                    </p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">10. Updates to Data Processing Practices</h3>
                                    <p>We may update our data processing practices from time to time. We will notify you of any significant changes through our website or via email.</p>
                                </section>
                            </div>
                        </motion.div>
                    </TabsContent>
                    <TabsContent value="cookies" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                <Cookie className="h-5 w-5 text-primary" />
                                Cookie Policy
                            </h2>

                            <div className="space-y-4 text-muted-foreground">
                                <section>
                                    <h3 className="font-medium text-foreground mb-2">1. What Are Cookies</h3>
                                    <p>Cookies are small text files that are stored on your computer or mobile device when you visit a website. They allow the website to recognize your device and remember if you have been to the website before.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">2. How We Use Cookies</h3>
                                    <p>MediBridge uses cookies primarily to ensure the security of your account and to understand how our platform is used. We do not use tracking cookies for advertising purposes.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">3. Strictly Necessary Cookies (Always On)</h3>
                                    <p>These cookies are essential for the operation of MediBridge. Without these cookies, the services you have asked for, like secure login and protecting your session, cannot be provided.</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Authentication Cookies (HttpOnly):</strong> Used to securely maintain your logged-in state. These are protected against unauthorized access and malicious scripting.</li>
                                        <li><strong>Session Management:</strong> Ensure your requests to the server are recognized as coming from you.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">4. Analytics Cookies (Optional)</h3>
                                    <p>These cookies allow us to recognize and count the number of visitors and see how visitors move around our platform when they are using it. This helps us improve the way our website works.</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Performance Tracking:</strong> Identifying which pages are most frequently visited.</li>
                                        <li><strong>Error Monitoring:</strong> Helping us detect and resolve app crashes or broken links.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">5. Third-Party Cookies</h3>
                                    <p>We only use trusted third-party services that may place cookies on your device:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li><strong>Vercel Analytics:</strong> Used strictly for performance and error monitoring.</li>
                                        <li><strong>Google OAuth:</strong> Used only if you choose to sign in via Google.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">6. Managing Your Cookie Preferences</h3>
                                    <p>You can manage your cookie preferences at any time through our interactive Cookie Consent banner. While you cannot opt-out of Strictly Necessary cookies, you are free to disable Analytics cookies.</p>
                                    <p className="mt-2 text-sm italic">Note: Changing your preferences via browser settings to block all cookies (including essential ones) will prevent you from logging into MediBridge securely.</p>
                                </section>

                                <section>
                                    <h3 className="font-medium text-foreground mb-2">7. Updates to This Policy</h3>
                                    <p>We may update this Cookie Policy to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any significant changes.</p>
                                </section>
                            </div>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center mb-8">
                <Button
                    onClick={() => navigate(-1)}
                    className="bg-gradient-to-r from-primary to-health-lavender hover:opacity-90"
                >
                    I Understand and Accept
                </Button>
            </motion.div>
        </motion.div>
    );
};

export default TermsAndPrivacyPage; 
