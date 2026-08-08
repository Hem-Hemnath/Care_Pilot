import { useState, useEffect, useCallback } from 'react'
import { probeCameraPermission, probeMicPermission } from '../camera/cameraService'

export type PermState = 'unknown' | 'granted' | 'denied' | 'prompt' | 'unsupported' | 'no-device'

export interface PermissionsState {
  camera: PermState
  mic: PermState
  requested: boolean
  requestPermissions: () => Promise<void>
}

export function usePermissions(): PermissionsState {
  const [camera, setCamera] = useState<PermState>('unknown')
  const [mic, setMic] = useState<PermState>('unknown')
  const [requested, setRequested] = useState(false)

  // Probe current state without prompting
  useEffect(() => {
    probeCameraPermission().then((s) => setCamera(s as PermState))
    probeMicPermission().then((s) => setMic(s as PermState))
  }, [])

  const requestPermissions = useCallback(async () => {
    setRequested(true)

    // Camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      stream.getTracks().forEach((t) => t.stop())
      setCamera('granted')
    } catch (err) {
      const e = err as DOMException
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') setCamera('denied')
      else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') setCamera('no-device')
      else setCamera('denied')
    }

    // Microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      stream.getTracks().forEach((t) => t.stop())
      setMic('granted')
    } catch (err) {
      const e = err as DOMException
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') setMic('denied')
      else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') setMic('no-device')
      else setMic('denied')
    }
  }, [])

  return { camera, mic, requested, requestPermissions }
}
