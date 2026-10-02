import { DemoIcon } from './icons'
import type { DemoIconName } from './icons'

export function AudioFilePicker({
  label,
  icon,
  onFiles,
}: {
  label: string
  icon: DemoIconName
  onFiles: (files: File[]) => void
}) {
  return (
    <label className="audio-player-demo__upload">
      <DemoIcon name={icon} />
      {label}
      <input
        type="file"
        accept="audio/*,.flac,.opus,.m4a"
        multiple
        aria-label={label}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          event.currentTarget.value = ''
          if (files.length) onFiles(files)
        }}
      />
    </label>
  )
}
