import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readAudioMetadata } from './readAudioMetadata.ts'
const be = (n) => {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n)
  return b
}
const le = (n) => {
  const b = Buffer.alloc(4)
  b.writeUInt32LE(n)
  return b
}
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const atom = (name, content) =>
  Buffer.concat([be(content.length + 8), Buffer.from(name, 'latin1'), content])
const frame = (name, data) =>
  Buffer.concat([Buffer.from(name), be(data.length), Buffer.alloc(2), data])
const tag = Buffer.concat([
  frame('TIT2', Buffer.from('\x03Rain')),
  frame('APIC', Buffer.concat([Buffer.from('\x00image/png\x00\x03\x00'), png])),
])
const id3 = Buffer.concat([
  Buffer.from('ID3\x03\x00\x00'),
  Buffer.from([0, 0, tag.length >> 7, tag.length & 127]),
  tag,
])
test('ID3 and WAV embedded artwork and title', async () => {
  for (const data of [
    id3,
    Buffer.concat([
      Buffer.from('RIFF'),
      le(id3.length + 12),
      Buffer.from('WAVEid3 '),
      le(id3.length),
      id3,
    ]),
  ]) {
    const result = await readAudioMetadata(new Blob([data]))
    assert.equal(result.title, 'Rain')
    assert.equal(result.artwork.type, 'image/png')
    assert.deepEqual(new Uint8Array(await result.artwork.arrayBuffer()), new Uint8Array(png))
  }
})
test('M4A skips media payload and reads nested tags', async () => {
  const payload = (data) => atom('data', Buffer.concat([be(1), be(0), data]))
  const data = Buffer.concat([
    atom('ftyp', Buffer.from('M4A ')),
    atom('mdat', Buffer.alloc(100)),
    atom(
      'moov',
      atom(
        'udta',
        atom(
          'meta',
          Buffer.concat([
            be(0),
            atom(
              'ilst',
              Buffer.concat([
                atom('©nam', payload(Buffer.from('Rain'))),
                atom('covr', payload(png)),
              ]),
            ),
          ]),
        ),
      ),
    ),
  ])
  const result = await readAudioMetadata(new Blob([data]))
  assert.equal(result.title, 'Rain')
  assert.equal(result.artwork.type, 'image/png')
})
test('FLAC picture block', async () => {
  const data = Buffer.concat([
    be(3),
    be(9),
    Buffer.from('image/png'),
    be(0),
    be(1),
    be(1),
    be(24),
    be(0),
    be(png.length),
    png,
  ])
  const result = await readAudioMetadata(
    new Blob([Buffer.from('fLaC'), Buffer.from([134, 0, 0, data.length]), data]),
  )
  assert.equal(result.artwork.type, 'image/png')
})
test('Opus comments', async () => {
  const comment = Buffer.from('TITLE=Rain')
  const packet = Buffer.concat([Buffer.from('OpusTags'), le(0), le(1), le(comment.length), comment])
  const header = Buffer.alloc(27)
  header.write('OggS')
  header[26] = 1
  const result = await readAudioMetadata(new Blob([header, Buffer.from([packet.length]), packet]))
  assert.equal(result.title, 'Rain')
})
test('missing, truncated, oversized tags safely fall back', async () => {
  for (const data of [
    Buffer.alloc(0),
    Buffer.from('ID3'),
    id3.subarray(0, 20),
    Buffer.from('ID3\x04\x00\x00\x7f\x7f\x7f\x7f'),
  ])
    assert.deepEqual(await readAudioMetadata(new Blob([data])), {})
})
