'use client';

import { useMemo, useState, useEffect } from 'react';
import { trackSearch, trackFilter } from '@/lib/analytics';
import type { MentalHealthProfessionalDoc } from '@/lib/getAllMentalHealthProfessionals';
import Link from 'next/link';
import { ProfessionalType, ModeOfDelivery } from '@cptsd/db/client';

type Props = {
	initialProfessionals: MentalHealthProfessionalDoc[];
	allSpecializations: string[];
	allCities: string[];
	allStates: string[];
};

const TYPE_LABELS: Record<string, string> = {
	INDIVIDUAL: 'Individual Professional',
	NGO: 'NGO / Organization',
	CLINIC: 'Clinic',
	HOSPITAL: 'Hospital',
};

const MODE_LABELS: Record<string, string> = {
	OFFLINE: 'In-Person',
	ONLINE: 'Online',
	BOTH: 'Both Online & In-Person',
};

const TYPE_TABS: { key: string; label: string; includes: ProfessionalType[] }[] = [
	{ key: 'ALL', label: 'All', includes: [] },
	{ key: 'INDIVIDUAL', label: 'Individual Professionals', includes: [ProfessionalType.INDIVIDUAL] },
	{ key: 'NGO', label: 'NGOs & Organizations', includes: [ProfessionalType.NGO, ProfessionalType.CLINIC, ProfessionalType.HOSPITAL] },
];

function normalize(text: string) {
	return text.toLowerCase();
}

export default function MentalHealthProfessionalsBrowser({
	initialProfessionals,
	allSpecializations,
	allCities,
	allStates,
}: Props) {
	const [query, setQuery] = useState('');
	const [selectedTab, setSelectedTab] = useState<string>('ALL');
	const [selectedDesignation, setSelectedDesignation] = useState<string | null>(null);
	const [selectedCity, setSelectedCity] = useState<string | null>(null);
	const [selectedState, setSelectedState] = useState<string | null>(null);
	const [selectedMode, setSelectedMode] = useState<string | null>(null);
	const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);

	const filtered = useMemo(() => {
		const q = normalize(query.trim());
		const includes = TYPE_TABS.find((t) => t.key === selectedTab)?.includes ?? [];
		return initialProfessionals.filter((p) => {
			// type gate
			if (includes.length > 0 && !includes.includes(p.type)) return false;
			// designation gate
			if (selectedDesignation && p.designation !== selectedDesignation) return false;
			// city gate
			if (selectedCity && p.location?.city !== selectedCity) return false;
			// state gate
			if (selectedState && p.location?.state !== selectedState) return false;
			// mode gate
			if (selectedMode && p.modeOfDelivery !== selectedMode) return false;
			// specialization gate
			if (selectedSpecialization && !p.specializations.includes(selectedSpecialization as any)) return false;
			// text gate
			if (q.length > 0) {
				const hay =
					(p.name || '') +
					' ' +
					(p.about || '') +
					' ' +
					(p.designation || '') +
					' ' +
					(p.location?.city || '') +
					' ' +
					(p.location?.state || '') +
					' ' +
					(Array.isArray(p.languages) ? p.languages.join(' ') : '') +
					' ' +
					(Array.isArray(p.tags) ? p.tags.join(' ') : '');
				if (!normalize(hay).includes(q)) return false;
			}
			return true;
		});
	}, [
		initialProfessionals,
		query,
		selectedTab,
		selectedDesignation,
		selectedCity,
		selectedState,
		selectedMode,
		selectedSpecialization,
	]);

	// Track search queries (debounced)
	useEffect(() => {
		if (query.trim().length > 2) {
			const timer = setTimeout(() => {
				trackSearch(query, filtered.length, 'mental-health-professionals');
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [query, filtered.length]);

	// Track filter changes
	useEffect(() => {
		if (selectedTab !== 'ALL') {
			trackFilter('type_tab', selectedTab);
		}
	}, [selectedTab]);

	const noData = initialProfessionals.length === 0;
	const noMatches = !noData && filtered.length === 0;

	return (
		<div className="space-y-8">
			{/* Filter Bar */}
			<div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
				<div className="flex flex-col md:flex-row md:items-center gap-3">
					<div className="flex-1">
						<label htmlFor="q" className="sr-only">
							Search professionals
						</label>
						<input
							id="q"
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by name, specialization, city, language..."
							className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						{TYPE_TABS.map((t) => (
							<button
								key={t.key}
								type="button"
								onClick={() => setSelectedTab(t.key)}
								className={`px-3 py-1.5 rounded-full text-sm border ${
									selectedTab === t.key
										? 'bg-blue-600 text-white border-blue-600'
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
								}`}
								aria-pressed={selectedTab === t.key}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>

				{/* Additional Filters */}
				<div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
					<select
						value={selectedCity || ''}
						onChange={(e) => setSelectedCity(e.target.value || null)}
						className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">All Cities</option>
						{allCities.map((city) => (
							<option key={city} value={city}>
								{city}
							</option>
						))}
					</select>

					<select
						value={selectedState || ''}
						onChange={(e) => setSelectedState(e.target.value || null)}
						className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">All States</option>
						{allStates.map((state) => (
							<option key={state} value={state}>
								{state}
							</option>
						))}
					</select>

					<select
						value={selectedMode || ''}
						onChange={(e) => setSelectedMode(e.target.value || null)}
						className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">All Modes</option>
						{Object.values(ModeOfDelivery).map((mode) => (
							<option key={mode} value={mode}>
								{MODE_LABELS[mode] || mode.replace(/_/g, ' ')}
							</option>
						))}
					</select>

					<select
						value={selectedSpecialization || ''}
						onChange={(e) => setSelectedSpecialization(e.target.value || null)}
						className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">All Specializations</option>
						{allSpecializations.map((spec) => (
							<option key={spec} value={spec}>
								{spec.replace(/_/g, ' ')}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Empty states */}
			{noData && (
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
					<p className="text-gray-700">
						We are still building this directory. In the meantime, you can search for mental health
						professionals online, and always verify that the source is reputable and current.
					</p>
				</div>
			)}
			{noMatches && (
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
					<p className="text-gray-700">
						No professionals matched your filters. Try clearing filters or changing your search terms.
					</p>
				</div>
			)}

			{/* Professionals Grid */}
			{!noData && !noMatches && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filtered.map((p) => (
						<ProfessionalCard key={p._id} professional={p} />
					))}
				</div>
			)}
		</div>
	);
}

function ProfessionalCard({ professional }: { professional: MentalHealthProfessionalDoc }) {
	return (
		<Link
			href={`/mental-health-professionals/${professional.slug || professional._id}`}
			className="h-full flex flex-col bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
		>
			<div className="flex items-start gap-3 mb-3">
				{professional.profilePicture ? (
					<img
						src={professional.profilePicture}
						alt={professional.name}
						className="w-16 h-16 rounded-full object-cover flex-shrink-0"
					/>
				) : (
					<div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
						<span className="text-2xl">👤</span>
					</div>
				)}
				<div className="flex-1 min-w-0">
					<h3 className="text-lg font-semibold text-gray-900 truncate">{professional.name}</h3>
					{professional.designation && (
						<p className="text-sm text-gray-600">
							{professional.designation.replace(/_/g, ' ')}
							{professional.designationOther && ` - ${professional.designationOther}`}
						</p>
					)}
					{professional.verified && (
						<span className="inline-flex items-center text-xs text-green-600 mt-1">
							✓ Verified
						</span>
					)}
				</div>
			</div>

			{professional.about && (
				<p className="text-sm text-gray-700 line-clamp-3 mb-3">{professional.about}</p>
			)}

			<div className="mt-auto space-y-2 text-xs text-gray-600">
				{professional.location?.city && (
					<div className="flex items-center gap-1">
						<span>📍</span>
						<span>
							{professional.location.city}
							{professional.location.state && `, ${professional.location.state}`}
						</span>
					</div>
				)}

				<div className="flex items-center gap-2">
					<span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
						{TYPE_LABELS[professional.type] || professional.type.replace(/_/g, ' ')}
					</span>
					<span className="text-xs text-gray-500">
						{MODE_LABELS[professional.modeOfDelivery] || professional.modeOfDelivery.replace(/_/g, ' ')}
					</span>
				</div>

				{professional.languages && professional.languages.length > 0 && (
					<div>Languages: {professional.languages.join(', ')}</div>
				)}

				{professional.contact?.phone && <div>📞 {professional.contact.phone}</div>}
				{professional.contact?.helpline && <div>🆘 {professional.contact.helpline}</div>}
			</div>

			{professional.specializations && professional.specializations.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{professional.specializations.slice(0, 3).map((spec, idx) => (
						<span
							key={idx}
							className="inline-flex items-center rounded px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700 border border-gray-200"
						>
							{spec.replace(/_/g, ' ')}
						</span>
					))}
					{professional.specializations.length > 3 && (
						<span className="text-[11px] text-gray-400">+{professional.specializations.length - 3}</span>
					)}
				</div>
			)}
		</Link>
	);
}

