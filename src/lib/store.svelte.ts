import { invoke } from '@tauri-apps/api/core';
import type { AppData, Locker, Partition } from './types';

class Store {
	data = $state<AppData>({
		settings: { partitions: [], qrPattern: '^KQR\\d{5}:\\d{12}$' },
		lockers: [],
		events: []
	});

	loaded = $state(false);

	async load() {
		try {
			const raw = await invoke<string>('read_data');
			if (raw) {
				const parsed = JSON.parse(raw) as any;

				// Migrate from old format (lockerCount + numeric locker ids)
				if (!parsed.settings.partitions) {
					const oldCount = parsed.settings.lockerCount ?? 0;
					const defaultPartition: Partition = {
						id: crypto.randomUUID(),
						name: 'A',
						lockerCount: oldCount
					};
					parsed.settings.partitions = [defaultPartition];
					parsed.lockers = (parsed.lockers as any[]).map((l: any) => ({
						partitionId: defaultPartition.id,
						index: l.id,
						status: l.status,
						assignedQR: l.assignedQR,
						assignedAt: l.assignedAt
					}));
					parsed.events = (parsed.events as any[]).map((e: any) => ({
						...e,
						lockerLabel: `A-${e.lockerId ?? '?'}`
					}));
				}

				parsed.settings.qrPattern ??= '^KQR\\d{5}:\\d{12}$';
				this.data = parsed as AppData;
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

	lockerLabel(locker: Locker): string {
		const partition = this.data.settings.partitions.find((p) => p.id === locker.partitionId);
		return partition ? `${partition.name}-${locker.index}` : `?-${locker.index}`;
	}

	async assignLocker(locker: Locker, qrCode: string) {
		const now = new Date().toISOString();
		locker.status = 'in-use';
		locker.assignedQR = qrCode;
		locker.assignedAt = now;

		this.data.events.push({
			id: crypto.randomUUID(),
			lockerLabel: this.lockerLabel(locker),
			type: 'assigned',
			qrCode,
			timestamp: now
		});

		await this.save();
	}

	async freeLocker(locker: Locker) {
		locker.status = 'available';
		locker.assignedQR = undefined;
		locker.assignedAt = undefined;

		this.data.events.push({
			id: crypto.randomUUID(),
			lockerLabel: this.lockerLabel(locker),
			type: 'freed',
			timestamp: new Date().toISOString()
		});

		await this.save();
	}

	async setPartitions(partitions: Partition[]) {
		// Preserve in-use status for lockers that still exist
		const existingStates = new Map<string, Pick<Locker, 'status' | 'assignedQR' | 'assignedAt'>>();
		for (const locker of this.data.lockers) {
			existingStates.set(`${locker.partitionId}:${locker.index}`, {
				status: locker.status,
				assignedQR: locker.assignedQR,
				assignedAt: locker.assignedAt
			});
		}

		const newLockers: Locker[] = [];
		for (const partition of partitions) {
			for (let i = 1; i <= partition.lockerCount; i++) {
				const existing = existingStates.get(`${partition.id}:${i}`);
				newLockers.push({
					partitionId: partition.id,
					index: i,
					status: existing?.status ?? 'available',
					assignedQR: existing?.assignedQR,
					assignedAt: existing?.assignedAt
				});
			}
		}

		this.data.settings.partitions = partitions;
		this.data.lockers = newLockers;
		await this.save();
	}

	async setQrPattern(pattern: string) {
		this.data.settings.qrPattern = pattern;
		await this.save();
	}
}

export const store = new Store();
