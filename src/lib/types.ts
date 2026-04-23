export interface Partition {
	id: string;
	name: string;
	lockerCount: number;
}

export interface Locker {
	partitionId: string;
	index: number;
	status: 'available' | 'in-use';
	assignedQR?: string;
	assignedAt?: string;
}

export interface LockerEvent {
	id: string;
	lockerLabel: string;
	type: 'assigned' | 'freed';
	qrCode?: string;
	timestamp: string;
}

export interface AppData {
	settings: {
		partitions: Partition[];
		qrPattern: string;
	};
	lockers: Locker[];
	events: LockerEvent[];
}
