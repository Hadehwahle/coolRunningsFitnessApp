import { LegalPage } from '@/components/ui';
import { useSeo } from '@/hooks/useSeo';

export function TermsPage() {
  useSeo({ title: 'Terms of Service', description: 'The terms that apply when you use CoolRunningsFitness.' });
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
            <section>
              <h2 className="text-xl font-display font-bold mb-4">Agreement to Terms</h2>
              <p className="text-foreground leading-relaxed">
                By accessing or using CoolRunningsFitness ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Use of Service</h2>
              <h3 className="text-xl font-semibold mb-3">Eligibility</h3>
              <p className="text-foreground leading-relaxed mb-4">
                You must be at least 13 years old to use this Service. By using the Service, you represent and warrant that you meet this age requirement.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Account Registration</h3>
              <p className="text-foreground leading-relaxed mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">Acceptable Use</h3>
              <p className="text-foreground leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Upload malicious code or viruses</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Spam or send unsolicited communications</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated tools to access the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">User Content</h2>
              <h3 className="text-xl font-semibold mb-3">Your Content</h3>
              <p className="text-foreground leading-relaxed mb-4">
                You retain ownership of any content you post, including running data, comments, and profile information. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with the Service.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Content Standards</h3>
              <p className="text-foreground leading-relaxed mb-4">
                All user content must:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Be accurate and not misleading</li>
                <li>Comply with applicable laws</li>
                <li>Not contain offensive or inappropriate material</li>
                <li>Not violate others' privacy or rights</li>
                <li>Not promote illegal activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Intellectual Property</h2>
              <p className="text-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by CoolRunningsFitness and are protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Third-Party Links</h2>
              <p className="text-foreground leading-relaxed">
                Our Service may contain links to third-party websites or services that are not owned or controlled by CoolRunningsFitness. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Disclaimer of Warranties</h2>
              <p className="text-foreground leading-relaxed mb-4">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>The accuracy or reliability of running data</li>
                <li>Uninterrupted or error-free operation</li>
                <li>The suitability of the Service for your fitness goals</li>
                <li>The security of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Limitation of Liability</h2>
              <p className="text-foreground leading-relaxed">
                To the maximum extent permitted by law, CoolRunningsFitness shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of profits, or injury, resulting from your use of or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Health and Safety Disclaimer</h2>
              <p className="text-foreground leading-relaxed">
                The Service is not a substitute for professional medical advice. Always consult with a qualified healthcare provider before beginning any exercise program. We are not responsible for any injuries or health issues that may result from your use of the Service or participation in running activities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Termination</h2>
              <p className="text-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Changes to Terms</h2>
              <p className="text-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Governing Law</h2>
              <p className="text-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Contact Us</h2>
              <p className="text-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-surface p-6 rounded-lg mt-4">
                <p className="font-semibold">CoolRunningsFitness Legal Team</p>
                <p className="text-muted-foreground">Email: legal@coolrunningsfitness.com</p>
                <p className="text-muted-foreground">Address: San Francisco, CA 94102</p>
              </div>
            </section>
    </LegalPage>
  );
}
