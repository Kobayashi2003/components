import { useEffect, useRef, useState } from 'react'
import { readAudioMetadata } from './readAudioMetadata'

export interface AudioFile {
  id: string
  fingerprint: string
  url: string
  name: string
  artwork?: string
  title?: string
  artist?: string
  album?: string
  reading: boolean
}

function release(file: AudioFile) {
  URL.revokeObjectURL(file.url)
  if (file.artwork) URL.revokeObjectURL(file.artwork)
}

export function useAudioLibrary() {
  const [files, setFiles] = useState<AudioFile[]>([])
  const [message, setMessage] = useState('')
  const owned = useRef(new Map<string, AudioFile>())
  useEffect(() => {
    const resources = owned.current
    return () => {
      resources.forEach(release)
      resources.clear()
    }
  }, [])

  function remove(id: string) {
    const file = owned.current.get(id)
    if (file) release(file)
    owned.current.delete(id)
    setFiles((current) => current.filter((file) => file.id !== id))
  }

  function clear() {
    owned.current.forEach(release)
    owned.current.clear()
    setFiles([])
  }

  function move(id: string, offset: number) {
    setFiles((current) => {
      const index = current.findIndex((file) => file.id === id)
      const target = index + offset
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function add(input: File[], replace = false) {
    const valid = input.filter(
      (file) =>
        file.size > 0 &&
        (file.type.startsWith('audio/') ||
          /\.(mp3|m4a|aac|flac|ogg|opus|wav|aiff|aif|webm)$/i.test(file.name)),
    )
    if (!valid.length) {
      setMessage('Choose a non-empty audio file.')
      return []
    }
    if (replace) clear()
    const entries: AudioFile[] = []
    for (const file of valid) {
      const fingerprint = `${file.name}:${file.size}:${file.lastModified}`
      if (Array.from(owned.current.values()).some((entry) => entry.fingerprint === fingerprint))
        continue
      const entry: AudioFile = {
        id: crypto.randomUUID(),
        fingerprint,
        url: URL.createObjectURL(file),
        name: file.name,
        reading: true,
      }
      owned.current.set(entry.id, entry)
      entries.push(entry)
    }
    setMessage(
      entries.length < input.length ? 'Duplicate, empty, or non-audio files were skipped.' : '',
    )
    setFiles((current) => [...current, ...entries])
    void readEntries(entries, valid)
    return entries
  }

  async function readEntries(entries: AudioFile[], valid: File[]) {
    for (const entry of entries) {
      const file = valid.find(
        (file) => `${file.name}:${file.size}:${file.lastModified}` === entry.fingerprint,
      )!
      let metadata: Awaited<ReturnType<typeof readAudioMetadata>> | undefined
      try {
        metadata = await readAudioMetadata(file)
      } catch {
        /* Metadata is optional for native audio playback. */
      }
      if (!owned.current.has(entry.id)) continue
      const updated: AudioFile = {
        ...entry,
        ...metadata,
        artwork: metadata?.artwork ? URL.createObjectURL(metadata.artwork) : undefined,
        reading: false,
      }
      owned.current.set(entry.id, updated)
      setFiles((current) => current.map((file) => (file.id === entry.id ? updated : file)))
    }
  }
  return { files, message, add, remove, clear, move }
}
