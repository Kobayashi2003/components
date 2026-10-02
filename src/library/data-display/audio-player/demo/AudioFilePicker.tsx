export function AudioFilePicker({
  label,
  onFiles,
}: {
  label: string
  onFiles: (files: File[]) => void
}) {
  return (
    <label className="morph-audio-demo__upload">
      <span aria-hidden="true">＋</span>
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
