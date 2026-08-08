// Stream-based camera service.
// Does NOT auto-capture. Returns the live MediaStream for display in a <video> element.
// The caller is responsible for capturing a frame when the user presses the Capture button.

export type CameraErrorCode =
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'IN_USE'
  | 'NOT_SUPPORTED'
  | 'INSECURE_CONTEXT'
  | 'UNKNOWN'

export interface CameraStreamResult {
  stream: MediaStream
}

export interface CaptureResult {
  file: File
  previewUrl: string
}

export async function startCameraStream(): Promise<CameraStreamResult> {
  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    throw Object.assign(new Error('INSECURE_CONTEXT'), { code: 'INSECURE_CONTEXT' as CameraErrorCode })
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('NOT_SUPPORTED'), { code: 'NOT_SUPPORTED' as CameraErrorCode })
  }

  const constraints: MediaStreamConstraints = {
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    return { stream }
  } catch (err) {
    const e = err as DOMException
    if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
      throw Object.assign(new Error('PERMISSION_DENIED'), { code: 'PERMISSION_DENIED' as CameraErrorCode })
    }
    if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
      throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' as CameraErrorCode })
    }
    if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
      throw Object.assign(new Error('IN_USE'), { code: 'IN_USE' as CameraErrorCode })
    }
    throw Object.assign(new Error('UNKNOWN:' + e.message), { code: 'UNKNOWN' as CameraErrorCode })
  }
}

// Capture a frame from a currently-playing <video> element.
// Call this ONLY when the user clicks the Capture button.
export function captureFrameFromVideo(video: HTMLVideoElement): CaptureResult {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 1280
  canvas.height = video.videoHeight || 720
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CANVAS_NOT_SUPPORTED')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  // Basic black/dark frame guard
  const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100))
  let brightness = 0
  for (let i = 0; i < imageData.data.length; i += 4) {
    brightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
  }
  brightness /= imageData.data.length / 4
  if (brightness < 8) throw new Error('IMAGE_TOO_DARK')

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  const arr = dataUrl.split(',')
  const mime = 'image/jpeg'
  const bstr = atob(arr[1])
  const bytes = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) bytes[i] = bstr.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })
  const file = new File([blob], `medicine_capture_${Date.now()}.jpg`, { type: mime })
  const previewUrl = URL.createObjectURL(blob)
  return { file, previewUrl }
}

export function stopStream(stream: MediaStream | null) {
  if (stream) stream.getTracks().forEach((t) => t.stop())
}

// Probe camera access for permission preflight (does not keep stream open).
export async function probeCameraPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported'
  try {
    if (navigator.permissions) {
      const perm = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (perm.state === 'granted') return 'granted'
      if (perm.state === 'denied') return 'denied'
    }
    return 'prompt'
  } catch {
    return 'prompt'
  }
}

export async function probeMicPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported' | 'no-device'> {
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported'
  try {
    if (navigator.permissions) {
      const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      if (perm.state === 'granted') return 'granted'
      if (perm.state === 'denied') return 'denied'
    }
    return 'prompt'
  } catch {
    return 'prompt'
  }
}
