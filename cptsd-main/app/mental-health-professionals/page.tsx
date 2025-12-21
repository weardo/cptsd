import { getAllMentalHealthProfessionals } from '@/lib/getAllMentalHealthProfessionals';
import MentalHealthProfessionalsBrowser from './mental-health-professionals-browser';

export const dynamic = 'force-dynamic';

export default async function MentalHealthProfessionalsPage() {
	const professionals = await getAllMentalHealthProfessionals();

	const allSpecializations = Array.from(
		new Set(
			professionals.flatMap((p) =>
				Array.isArray(p.specializations) ? p.specializations.filter((s: unknown) => typeof s === 'string') : []
			)
		)
	).sort((a, b) => a.localeCompare(b));

	const allCities = Array.from(
		new Set(
			professionals
				.map((p) => p.location?.city)
				.filter((city): city is string => typeof city === 'string' && city.length > 0)
		)
	).sort((a, b) => a.localeCompare(b));

	const allStates = Array.from(
		new Set(
			professionals
				.map((p) => p.location?.state)
				.filter((state): state is string => typeof state === 'string' && state.length > 0)
		)
	).sort((a, b) => a.localeCompare(b));

	return (
		<main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
			<section className="max-w-3xl">
				<h1 className="text-4xl font-bold text-gray-900">Mental Health Professionals Directory</h1>
				<p className="mt-4 text-gray-700 leading-relaxed">
					Find qualified mental health professionals, therapists, counselors, and NGOs offering mental health
					services. This directory includes both individual practitioners and organizations that provide
					counseling and therapy services.
				</p>
				<div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
					<p className="text-sm text-amber-900">
						CPTSD.in does not endorse or guarantee the quality of services listed here. We share this
						information as a starting point so you can explore options and decide what feels right for you.
						Always verify credentials and check reviews before making an appointment.
					</p>
				</div>
				<p className="mt-4 text-sm text-gray-700">
					Information (phone numbers, availability, fees) can change. Always check the official website or
					contact the professional directly for the most current details.
				</p>
			</section>

			<section>
				<MentalHealthProfessionalsBrowser
					initialProfessionals={professionals}
					allSpecializations={allSpecializations}
					allCities={allCities}
					allStates={allStates}
				/>
			</section>
		</main>
	);
}

