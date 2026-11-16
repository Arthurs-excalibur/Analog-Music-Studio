// Web MIDI API integration for physical MIDI keyboard controllers

export type NoteCallback = (note: number, velocity: number) => void;

export class MidiManager {
  private access: any = null;
  private onNoteOn: NoteCallback | null = null;
  private onNoteOff: NoteCallback | null = null;
  private onDeviceChange: ((deviceName: string | null) => void) | null = null;
  private currentDevice: string | null = null;

  public async init(
    onNoteOn: NoteCallback,
    onNoteOff: NoteCallback,
    onDeviceChange: (deviceName: string | null) => void
  ): Promise<boolean> {
    this.onNoteOn = onNoteOn;
    this.onNoteOff = onNoteOff;
    this.onDeviceChange = onDeviceChange;

    if (!('requestMIDIAccess' in navigator)) {
      return false;
    }

    try {
      this.access = await (navigator as any).requestMIDIAccess();
      this.setupInputs();
      this.access.onstatechange = () => this.setupInputs();
      return true;
    } catch {
      return false;
    }
  }

  private setupInputs() {
    if (!this.access) return;

    let deviceFound = false;
    const inputs = this.access.inputs.values();

    for (const input of inputs) {
      deviceFound = true;
      this.currentDevice = input.name || 'MIDI Controller';
      input.onmidimessage = (e: any) => this.handleMidiMessage(e);
    }

    if (!deviceFound) {
      this.currentDevice = null;
    }

    if (this.onDeviceChange) {
      this.onDeviceChange(this.currentDevice);
    }
  }

  private handleMidiMessage(event: any) {
    const [status, note, velocity] = event.data;
    const command = status >> 4;

    if (command === 9 && velocity > 0) {
      // Note On
      if (this.onNoteOn) this.onNoteOn(note, velocity / 127);
    } else if (command === 8 || (command === 9 && velocity === 0)) {
      // Note Off
      if (this.onNoteOff) this.onNoteOff(note, 0);
    }
  }

  public getConnectedDevice(): string | null {
    return this.currentDevice;
  }
}

export const midi = new MidiManager();
