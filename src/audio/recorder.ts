// Real-time audio recorder and WAV exporter for Analog Studio

export class AudioRecorder {
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private destNode: MediaStreamAudioDestinationNode | null = null;

  public startRecording(ctx: AudioContext, sourceNode: AudioNode) {
    if (this.isRecording) return;

    this.destNode = ctx.createMediaStreamDestination();
    sourceNode.connect(this.destNode);

    this.audioChunks = [];
    const stream = this.destNode.stream;

    // Use WebM or audio/wav supported mimeType
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/ogg')
      ? 'audio/ogg'
      : '';

    this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      const blob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
      this.triggerDownload(blob, `analog-studio-${Date.now()}.webm`);
    };

    this.mediaRecorder.start(100);
    this.isRecording = true;
  }

  public stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;
    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}

export const recorder = new AudioRecorder();
