import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">CPTSD Healing Blog</h3>
            <p className="text-sm text-gray-600">
              A safe, supportive space for sharing resources, insights, and stories about Complex PTSD recovery and healing.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  All Articles
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-sm text-gray-600">
              Resources for Complex PTSD recovery and healing. Find guidance, support, and hope on your healing journey.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>CPTSD Healing Blog is an educational resource.</strong> We share information about complex trauma, 
              emotional neglect and mental health. We do not provide diagnosis, therapy, or emergency services. 
              If you are in crisis, feeling unsafe, or thinking about harming yourself, please contact a trusted person, 
              call a mental health helpline, or go to the nearest hospital emergency department.
            </p>
          </div>
          <div className="text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} CPTSD Healing Blog. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

