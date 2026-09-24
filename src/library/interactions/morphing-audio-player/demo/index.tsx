import { MorphingAudioPlayer } from '..'
import cover from './cover.jpg'
import './styles.css'

export default function MorphingAudioPlayerShowcase() {
  return (
    <div className="morph-audio-demo">
      <MorphingAudioPlayer title="Cabra Field" subtitle="Side B" artwork={cover} />
    </div>
  )
}
