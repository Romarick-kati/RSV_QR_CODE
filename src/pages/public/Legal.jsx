import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import { useSEO } from '../../lib/useSEO';

const UPDATED = '30 September 2026';
const EMAIL = 'ndiromarickkati45@gmail.com';

function Page({ title, intro, sections, path, description }) {
  useSEO(title, description, { path });
  return (
    <div style={{ background: 'var(--bg)' }}>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-5 sm:px-8 pt-14 pb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-[var(--text-dim)] mb-8">Last updated: {UPDATED}</p>
        <p className="text-[var(--text-dim)] leading-relaxed mb-10">{intro}</p>
        {sections.map(([h, body]) => (
          <section key={h} className="mb-8">
            <h2 className="font-display text-xl font-semibold mb-2">{h}</h2>
            <p className="text-[var(--text-dim)] leading-relaxed">{body}</p>
          </section>
        ))}
        <p className="text-[var(--text-dim)] leading-relaxed">Questions? Write to <a className="underline" style={{ color: 'var(--accent)' }} href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>
      </main>
      <PublicFooter />
    </div>
  );
}

export function Privacy() {
  return (
    <Page
      path="/privacy"
      title="Privacy Policy"
      description="How Presence collects, uses and protects your personal data when you register for events and check in with QR passes."
      intro="Presence (presencescan.site) helps people register for events and check in with a QR pass. This page explains what we collect, why, and the choices you have."
      sections={[
        ['What we collect', 'Your name, email address and password (stored only as a secure hash) when you create an account; an optional profile photo; the events you register for; and your check-in time when a pass is scanned. If you sign in with Google we receive your name, email and profile picture from Google. For paid events, payments are processed by Fapshi, and we receive only the payment status, never your Mobile Money PIN.'],
        ['How we use it', 'To run your account, issue your QR pass, let organizers see who registered and attended, send notifications about events you joined, and keep the service secure. We do not sell your personal data.'],
        ['Who can see it', 'Event organizers see the name, email and attendance status of people who registered for their events. Our service providers (hosting, database, email and payment processing) handle data only to run Presence.'],
        ['Cookies and storage', 'We store a sign-in session and your language and theme preferences in your browser. We do not use advertising cookies.'],
        ['Your choices', 'You can update your profile at any time, cancel event registrations before the deadline, and ask us to delete your account and data by emailing us.'],
        ['Security and retention', 'Data is transmitted over HTTPS and stored in a managed database. We keep your data while your account is active and delete it on request, except records we must keep for legal or fraud-prevention reasons.'],
        ['Changes', 'If we change this policy we will update the date above.'],
      ]}
    />
  );
}

export function Terms() {
  return (
    <Page
      path="/terms"
      title="Terms of Service"
      description="The rules for using Presence to create events, register, pay and check in."
      intro="By creating an account or using Presence you agree to these terms. If you do not agree, please do not use the service."
      sections={[
        ['Your account', 'You must give accurate information and keep your password safe. You are responsible for activity on your account.'],
        ['Attendees', 'A QR pass is personal and works once for the event it was issued for. Sharing or copying a pass to let others in may lead to it being cancelled by the organizer.'],
        ['Organizers', 'Organizers are responsible for their events, including accurate details, refunds and any local permits. Charging for tickets requires an approved organizer account. Do not use Presence for unlawful, misleading or harmful events.'],
        ['Payments', 'Paid registrations are handled by Fapshi. Refund terms are set by the organizer of each event. A pass unlocks once payment is confirmed.'],
        ['Acceptable use', 'Do not attempt to disrupt the service, scrape personal data, or bypass security controls. We may suspend accounts that break these rules.'],
        ['Availability', 'We work to keep Presence available but cannot promise it will always be uninterrupted or error-free. The service is provided as is.'],
        ['Limitation of liability', 'To the extent the law allows, Presence is not liable for indirect losses arising from use of the service or from events run by organizers.'],
        ['Changes', 'We may update these terms; continued use after an update means you accept them.'],
      ]}
    />
  );
}
