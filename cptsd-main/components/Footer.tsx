import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">CPTSD.in</h3>
            <p className="text-sm text-gray-600">
              An awareness and education project about Complex PTSD in the Indian context.
              This is not a medical or emergency service.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/support#helplines" className="text-gray-600 hover:text-gray-900">
                  Helplines
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900">
                  About
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-600 hover:text-gray-900">
                  Community
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>CPTSD.in is an awareness and peer-support project.</strong> We share educational
              information about complex trauma, emotional neglect and mental health. We do not provide
              diagnosis, therapy, or emergency services. If you are in crisis, feeling unsafe, or
              thinking about harming yourself, please contact a trusted person, call a mental health
              helpline, or go to the nearest hospital emergency department.
            </p>
          </div>
          <div className="text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} CPTSD.in. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

