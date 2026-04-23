export interface Locker {
	id: number;
	status: 'available' | 'in-use';
	assignedQR?: string;
	assignedAt?: string;
}

export interface LockerEvent {
	id: string;
	lockerId: number;
	type: 'assigned' | 'freed';
	qrCode?: string;
	timestamp: string;
}

export interface AppData {
	settings: {
		lockerCount: number;
		qrPattern: string;
	};
	lockers: Locker[];
	events: LockerEvent[];
}
