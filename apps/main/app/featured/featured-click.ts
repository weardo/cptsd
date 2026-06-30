'use client';

export async function increment(id: string) {
	try {
		await fetch(`/api/featured/${id}/click`, { method: 'POST', keepalive: true });
	} catch {
		// swallow
	}
}


