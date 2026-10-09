interface Metadata {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: Blob;
}
const limit = 16 * 1024 * 1024;
const text = (b: Uint8Array, encoding = 'utf-8') =>
  new TextDecoder(encoding).decode(b).replace(/\0/g, ' ').trim();
const raw = (b: Uint8Array) => new TextDecoder('latin1').decode(b);
const u32 = (b: Uint8Array, p = 0, little = false) =>
  new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(p, little);
const sync = (b: Uint8Array, p = 0) => b.slice(p, p + 4).reduce((n, v) => n * 128 + (v & 127), 0);
function end(b: Uint8Array, p: number, wide = false) {
  for (; p < b.length; p += wide ? 2 : 1)
    if (!b[p] && (!wide || !b[p + 1])) return p + (wide ? 2 : 1);
  return b.length;
}
function artwork(b: Uint8Array) {
  const mime =
    b[0] === 255 && b[1] === 216
      ? 'image/jpeg'
      : b[0] === 137 && raw(b.subarray(1, 4)) === 'PNG'
        ? 'image/png'
        : raw(b.subarray(0, 3)) === 'GIF'
          ? 'image/gif'
          : raw(b.subarray(0, 4)) === 'RIFF' && raw(b.subarray(8, 12)) === 'WEBP'
            ? 'image/webp'
            : '';
  return mime && b.length <= limit ? new Blob([new Uint8Array(b)], { type: mime }) : undefined;
}
function id3(b: Uint8Array, result: Metadata) {
  const version = b[3];
  if (version < 2 || version > 4) return;
  const unsync = (v: Uint8Array) => v.filter((byte, i) => !(byte === 0 && v[i - 1] === 255));
  let data = b.subarray(10);
  if (version < 4 && b[5] & 128) data = unsync(data);
  let p = 0;
  if (b[5] & 64) {
    if (version === 2 || data.length < 4) return;
    p = version === 4 ? sync(data) : u32(data) + 4;
  }
  const header = version === 2 ? 6 : 10;
  while (p + header <= data.length) {
    const name = raw(data.subarray(p, p + (version === 2 ? 3 : 4)));
    const size =
      version === 2
        ? data[p + 3] * 65536 + data[p + 4] * 256 + data[p + 5]
        : version === 4
          ? sync(data, p + 4)
          : u32(data, p + 4);
    if (!/^[A-Z0-9]+$/.test(name) || !size || p + header + size > data.length) break;
    const flags = version === 2 ? 0 : data[p + 9];
    let frame = data.subarray(p + header, p + header + size);
    p += header + size;
    if ((version === 3 && flags & 224) || (version === 4 && flags & 76)) continue;
    if (version === 4 && (b[5] & 128 || flags & 2)) frame = unsync(frame);
    if (version === 4 && flags & 1) frame = frame.subarray(4);
    const key = (
      {
        TIT2: 'title',
        TT2: 'title',
        TPE1: 'artist',
        TP1: 'artist',
        TALB: 'album',
        TAL: 'album',
      } as Record<string, 'title' | 'artist' | 'album'>
    )[name];
    if (key)
      result[key] =
        text(
          frame.subarray(1),
          ['windows-1252', 'utf-16', 'utf-16be', 'utf-8'][frame[0]] ?? 'utf-8',
        ) || undefined;
    if (name === 'APIC' || name === 'PIC') {
      const start = name === 'PIC' ? 4 : end(frame, 1);
      const image = artwork(
        frame.subarray(end(frame, start + 1, frame[0] === 1 || frame[0] === 2)),
      );
      if (image && (!result.artwork || frame[start] === 3)) result.artwork = image;
    }
  }
}
function picture(b: Uint8Array, result: Metadata) {
  if (b.length < 32) return;
  let p = 8 + u32(b, 4);
  if (p + 4 > b.length) return;
  p += 4 + u32(b, p);
  if (p + 20 > b.length) return;
  const size = u32(b, p + 16);
  if (p + 20 + size > b.length) return;
  const image = artwork(b.subarray(p + 20, p + 20 + size));
  if (image && (!result.artwork || u32(b) === 3)) result.artwork = image;
}
function comments(b: Uint8Array, result: Metadata) {
  if (b.length < 8) return;
  let p = 4 + u32(b, 0, true);
  if (p + 4 > b.length) return;
  const count = Math.min(u32(b, p, true), 10000);
  p += 4;
  for (let i = 0; i < count && p + 4 <= b.length; i++) {
    const size = u32(b, p, true);
    p += 4;
    if (p + size > b.length) break;
    const value = text(b.subarray(p, p + size));
    p += size;
    const split = value.indexOf('=');
    const key = value.slice(0, split).toUpperCase();
    const content = value.slice(split + 1);
    if (['TITLE', 'ARTIST', 'ALBUM'].includes(key)) result[key.toLowerCase() as 'title'] = content;
    if (key === 'METADATA_BLOCK_PICTURE') {
      try {
        picture(
          Uint8Array.from(atob(content), c => c.charCodeAt(0)),
          result,
        );
      } catch {
        /* Ignore malformed optional artwork. */
      }
    }
  }
}
export async function readAudioMetadata(file: Blob): Promise<Metadata> {
  const result: Metadata = {};
  const read = async (p: number, size: number) =>
    new Uint8Array(await file.slice(p, p + Math.min(size, limit)).arrayBuffer());
  const tag = async (p: number, available: number) => {
    const h = await read(p, 10);
    if (h.length < 10 || raw(h.subarray(0, 3)) !== 'ID3') return;
    const size = sync(h, 6) + 10;
    if (size <= available && size <= limit) id3(await read(p, size), result);
  };
  const h = await read(0, 12);
  if (raw(h.subarray(0, 3)) === 'ID3') await tag(0, file.size);
  else if (raw(h.subarray(0, 4)) === 'RIFF') {
    for (let p = 12, count = 0; p + 8 <= file.size && count < 10000; count++) {
      const b = await read(p, 8);
      const size = u32(b, 4, true);
      if (p + 8 + size > file.size) break;
      if (raw(b.subarray(0, 4)).toLowerCase() === 'id3 ') await tag(p + 8, size);
      p += 8 + size + (size % 2);
    }
  } else if (raw(h.subarray(0, 4)) === 'fLaC') {
    for (let p = 4, count = 0; p + 4 <= file.size && count < 1000; count++) {
      const b = await read(p, 4);
      const size = b[1] * 65536 + b[2] * 256 + b[3];
      if (p + 4 + size > file.size) break;
      if (size <= limit && (b[0] & 127) === 6) picture(await read(p + 4, size), result);
      if (size <= limit && (b[0] & 127) === 4) comments(await read(p + 4, size), result);
      p += 4 + size;
      if (b[0] & 128) break;
    }
  } else if (raw(h.subarray(0, 4)) === 'OggS') {
    const data = await read(0, limit);
    let packet: number[] = [];
    let serial: number | undefined;
    for (let p = 0; p + 27 <= data.length;) {
      if (raw(data.subarray(p, p + 4)) !== 'OggS') break;
      const count = data[p + 26];
      if (p + 27 + count > data.length) break;
      const lengths = data.subarray(p + 27, p + 27 + count);
      const stream = u32(data, p + 14, true);
      serial ??= stream;
      let start = p + 27 + count;
      for (const length of lengths) {
        if (start + length > data.length) return result;
        if (stream === serial) {
          for (const byte of data.subarray(start, start + length)) packet.push(byte);
          if (length < 255) {
            const bytes = Uint8Array.from(packet);
            if (raw(bytes.subarray(0, 8)) === 'OpusTags') {
              comments(bytes.subarray(8), result);
              return result;
            }
            if (bytes[0] === 3 && raw(bytes.subarray(1, 7)) === 'vorbis') {
              comments(bytes.subarray(7), result);
              return result;
            }
            packet = [];
          }
        }
        start += length;
      }
      p = start;
    }
  } else if (raw(h.subarray(4, 8)) === 'ftyp') {
    let visited = 0;
    const atoms = async (start: number, stop: number, depth = 0, field = '') => {
      for (let p = start; p + 8 <= stop && visited++ < 10000;) {
        const b = await read(p, 16);
        let size = u32(b);
        const name = raw(b.subarray(4, 8));
        const head = size === 1 ? 16 : 8;
        if (size === 1) {
          if (b.length < 16) break;
          size = u32(b, 8) * 4294967296 + u32(b, 12);
        }
        if (!size) size = stop - p;
        if (!Number.isSafeInteger(size) || size < head || p + size > stop) break;
        if (name === 'data' && field && size >= head + 8 && size <= limit) {
          const value = await read(p + head + 8, size - head - 8);
          if (field === 'covr') result.artwork ??= artwork(value);
          else result[field as 'title'] = text(value) || undefined;
        } else if (depth < 8) {
          const key = (
            {
              '©nam': 'title',
              '©ART': 'artist',
              aART: 'artist',
              '©alb': 'album',
              covr: 'covr',
            } as Record<string, string>
          )[name];
          if (key || ['moov', 'udta', 'meta', 'ilst'].includes(name))
            await atoms(p + head + (name === 'meta' ? 4 : 0), p + size, depth + 1, key ?? '');
        }
        p += size;
      }
    };
    await atoms(0, file.size);
  }
  return result;
}
