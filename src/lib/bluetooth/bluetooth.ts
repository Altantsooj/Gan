export type GATTDeviceDescriptor = { id: string };
export type GATTServiceDescriptor = GATTDeviceDescriptor & { service: string };
export type GATTCharacteristicDescriptor = GATTServiceDescriptor & { characteristic: string };
export type GATTOperation<T> = { description: string; result: Promise<T> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let queue: Promise<any> = Promise.resolve();
//const pendingOperations: GATTOperation<T>[] = [];
//const completedOperations: GATTOperation<T>[] = [];

const idToDeviceMap: { [k: string]: BluetoothDevice } = {};

export function getDevice(f: GATTDeviceDescriptor): Promise<BluetoothDevice> {
	return Promise.resolve(idToDeviceMap[f.id]);
}

export function getServer(f: GATTDeviceDescriptor): Promise<BluetoothRemoteGATTServer> {
	return getDevice(f).then((device) => {
		if (!device.gatt) {
			return Promise<BluetoothRemoteGATTServer>.reject();
		}
		return device.gatt;
	});
}

export function getService(f: GATTServiceDescriptor): Promise<BluetoothRemoteGATTService> {
	return getServer(f).then((server) => server.getPrimaryService(f.service));
}

export function getCharacteristic(
	f: GATTCharacteristicDescriptor
): Promise<BluetoothRemoteGATTCharacteristic> {
	return getService(f).then((service) => service.getCharacteristic(f.characteristic));
}

export function read(f: GATTCharacteristicDescriptor) {
	queue = queue.then(() =>
		getCharacteristic(f).then((characteristic) => characteristic.readValue())
	);
	return queue;
}

export function write(f: GATTCharacteristicDescriptor, data: Uint8Array) {
	return queue.then(() =>
		getCharacteristic(f).then((characteristic) => characteristic.writeValue(data))
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requestDevice(options: any) {
	return navigator.bluetooth
		.requestDevice(options)
		.then((device) => (idToDeviceMap[device.id] = device));
}
