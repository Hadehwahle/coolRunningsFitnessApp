import { LegalPage } from '@/components/ui';
import { useSeo } from '@/hooks/useSeo';

export function PrivacyPage() {
  useSeo({ title: 'Privacy Policy', description: 'How CoolRunningsFitness collects, uses and protects your personal information.' });
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
            <section>
              <h2 className="text-xl font-display font-bold mb-4">Introduction</h2>
              <p className="text-foreground leading-relaxed">
                At CoolRunningsFitness ("we," "us," or "our"), we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our running tracking application and related services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
              <p className="text-foreground leading-relaxed mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Name and email address</li>
                <li>Profile information (bio, avatar)</li>
                <li>Account credentials (encrypted password)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">Running Activity Data</h3>
              <p className="text-foreground leading-relaxed mb-4">
                When you track runs, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Distance, duration, and pace information</li>
                <li>Weather conditions and equipment notes</li>
                <li>Personal ratings and comments</li>
                <li>Date and time of activities</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">Usage Data</h3>
              <p className="text-foreground leading-relaxed">
                We automatically collect certain information about your device and how you interact with our service, including IP address, browser type, pages visited, and time spent on pages.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">How We Use Your Information</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Provide and maintain our running tracking services</li>
                <li>Calculate and display your running statistics</li>
                <li>Personalize your experience and provide tailored content</li>
                <li>Send you important updates about your account and our services</li>
                <li>Improve our application and develop new features</li>
                <li>Protect against fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Data Sharing and Disclosure</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We do not sell your personal information. We may share your data only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li><strong>With your consent:</strong> When you choose to share your running activities publicly</li>
                <li><strong>Service providers:</strong> Third-party vendors who help us operate our services</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business transfers:</strong> In connection with any merger or acquisition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Data Security</h2>
              <p className="text-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data, including encryption of sensitive information, secure servers, regular security assessments, and access controls. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Your Rights</h2>
              <p className="text-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to certain processing of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Cookies and Tracking</h2>
              <p className="text-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and personalize content. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Children's Privacy</h2>
              <p className="text-foreground leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Changes to This Policy</h2>
              <p className="text-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Contact Us</h2>
              <p className="text-foreground leading-relaxed">
                If you have questions about this privacy policy or our data practices, please contact us at:
              </p>
              <div className="bg-surface p-6 rounded-lg mt-4">
                <p className="font-semibold">CoolRunningsFitness Privacy Team</p>
                <p className="text-muted-foreground">Email: privacy@coolrunningsfitness.com</p>
                <p className="text-muted-foreground">Address: San Francisco, CA 94102</p>
              </div>
            </section>
    </LegalPage>
  );
}
