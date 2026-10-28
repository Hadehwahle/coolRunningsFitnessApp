import { LegalPage } from '@/components/ui';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useSeo } from '@/hooks/useSeo';

export function DisclaimerPage() {
  useSeo({ title: 'Disclaimer', description: 'Health and fitness disclaimer for content published on CoolRunningsFitness.' });
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <LegalPage title="Disclaimer" updated="October 2026">

          {/* General disclaimer */}
          <section>
            <p className="text-base">
              All content provided by CoolRunnings Fitness is for informational purposes only. The owner of this platform makes
              no representation as to the accuracy or completeness of any information on this site or found by following any link
              on this site. The owner will not be liable for any errors or omissions in this information nor for the availability
              of this information. The owner will not be liable for any losses, injury or damages from the display or use of this
              information. These terms and conditions of use are subject to change at any time without notice.
            </p>
          </section>

          {/* Compensation */}
          <section>
            <h2 className="text-foreground text-2xl mb-4">Compensation</h2>
            <div className="card bg-surface2 border-transparent p-6 space-y-4">
              <p>
                CoolRunnings Fitness is part of affiliate advertising programs. This means that if you click and/or make a
                purchase through certain links on this site, or any related social media platforms, we have the potential to
                earn a commission from that click and/or purchase.
              </p>
              <p>
                This platform accepts forms of cash advertising, sponsorship, paid insertions or other forms of compensation.
                The compensation received may influence the advertising content, topics or posts made on this platform. Any
                such content, advertising space or post will be clearly identified as paid or sponsored content.
              </p>
              <p>
                The owner(s) of this platform may be compensated to provide opinion on products, services, websites and
                various other topics. Even though the owner(s) receives compensation for posts or advertisements, we always
                give our honest opinions, findings, beliefs, or experiences on those topics or products. The views and opinions
                expressed on this platform are purely those of the contributors. Any product claim, statistic, quote or other
                representation about a product or service should be verified with the manufacturer, provider or party in question.
              </p>
              <p>
                This platform does not contain any content which might present a conflict of interest.
              </p>
            </div>
          </section>

          {/* Fitness disclaimer */}
          <section>
            <h2 className="text-foreground text-2xl mb-4">Fitness &amp; Health Disclaimer</h2>
            <div className="card bg-surface2 border-transparent p-6 space-y-4">
              <p>
                The information provided on CoolRunnings Fitness is intended for general informational and educational purposes only.
                It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the guidance of a qualified
                healthcare provider before beginning any new exercise programme, especially if you have a pre-existing medical condition
                or injury.
              </p>
              <p>
                Running and physical training carry inherent risks. By using this platform, you acknowledge that you participate in any
                exercise or fitness activity entirely at your own risk. CoolRunnings Fitness accepts no liability for injury, illness,
                or any other adverse outcomes resulting from use of information provided on this site.
              </p>
            </div>
          </section>

          {/* External links */}
          <section>
            <h2 className="text-foreground text-2xl mb-4">External Links</h2>
            <p>
              This platform may contain links to external websites that are not operated by CoolRunnings Fitness. We have no
              control over the content and practices of those sites and accept no responsibility for their respective privacy
              policies or content. We encourage you to review the privacy policy of any site you visit.
            </p>
          </section>

          {/* Privacy */}
          <section>
            
            <p className="text-sm text-muted-foreground">
              If you wish to know more, please review our{' '}
              <Link to="/privacy" className="text-primary hover:text-primary-light transition-colors">Privacy Policy</Link>
              {' '}and{' '}
              <Link to="/terms" className="text-primary hover:text-primary-light transition-colors">Terms of Service</Link>.
            </p>
          </section>
    </LegalPage>
  );
}
