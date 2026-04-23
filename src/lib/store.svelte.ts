import { invoke } from '@tauri-apps/api/core';
import type { AppData, Locker } from './types';

class Store {
	data = $state<AppData>({
		settings: { lockerCount: 0, qrPattern: '^KQR\\d{5}:\\d{12}$' },
		lockers: [],
		events: []
	});

	loaded = $state(false);

	async load() {
		try {
			const raw = await invoke<string>('read_data');
			if (raw) {
				const parsed = JSON.parse(raw) as AppData;
				parsed.settings.qrPattern ??= '^KQR\\d{5}:\\d{12}$';
				this.data = parsed;
			}
		} catch (e) {
			console.error('Failed to load data:', e);
		}
		this.loaded = true;
	}

	async save() {
		try {
			await invoke('write_data', { data: JSON.stringify(this.data) });
		} catch (e) {
			console.error('Failed to save data:', e);
		}
	}

	async assignLocker(lockerId: number, qrCode: string) {
		const locker = this.data.lockers.find((l: Locker) => l.id === lockerId);
		if (!locker) return;

		const now = new Date().toISOString();
		locker.status = 'in-use';
		locker.assignedQR = qrCode;
		locker.assignedAt = now;

		this.data.events.push({
			id: crypto.randomUUID(),
			lockerId,
			type: 'assigned',
			qrCode,
			timestamp: now
		});

		await this.save();
	}

	async freeLocker(lockerId: number) {
		const locker = this.data.lockers.find((l: Locker) => l.id === lockerId);
		if (!locker) return;

		locker.status = 'available';
		locker.assignedQR = undefined;
		locker.assignedAt = undefined;

		this.data.events.push({
			id: crypto.randomUUID(),
			lockerId,
			type: 'freed',
			timestamp: new Date().toISOString()
		});

		await this.save();
	}

	async setQrPattern(pattern: string) {
		this.data.settings.qrPattern = pattern;
		await this.save();
	}

	async setLockerCount(count: number) {
		const current = this.data.lockers.length;

		if (count > current) {
			for (let i = current + 1; i <= count; i++) {
				this.data.lockers.push({ id: i, status: 'available' });
			}
		} else if (count < current) {
			this.data.lockers = this.data.lockers.slice(0, count);
		}

		this.data.settings.lockerCount = count;
		await this.save();
	}
}

export const store = new Store();
