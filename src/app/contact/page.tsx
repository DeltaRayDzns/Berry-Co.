import PageHeader from '@/components/ui/page-header'
import ContactSupportLayout from '@/components/storefront/contact-support-layout'
import { getSession } from '@/lib/session'

const SUPPORT_EMAIL = 'support@berryco.com'

export default async function ContactPage() {
  const session = await getSession()

  return (
    <div>
      <PageHeader
        title="Contact Us"
        subtitle="Questions about an order, a product, or anything else? We'd love to hear from you."
      />

      <div className="mx-auto max-w-5xl px-6 py-4 sm:py-6">
        <ContactSupportLayout
          user={session ? { email: session.email } : null}
          supportEmail={SUPPORT_EMAIL}
        />
      </div>
    </div>
  )
}
