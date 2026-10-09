/**
 * Builds small, structurally complete KF8 (AZW3) books in memory: PalmDOC or
 * uncompressed text with trailing entries, a CSS flow, skeleton, fragment and
 * NCX indexes, a cover, a plate image and an obfuscated compressed font. The
 * byte layout mirrors what KindleUnpack accepts.
 */

const NONE = 0xffffffff;
const encoder = new TextEncoder();

export interface Kf8FixtureOptions {
  readonly compressed?: boolean;
  readonly trailingEntries?: boolean;
  readonly fixedLayout?: boolean;
  readonly rtl?: boolean;
  readonly encrypted?: boolean;
}

/** Minimal JPEG signature bytes; resource detection reads only the magic. */
export const FIXTURE_JPEG = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1,
  0, 0, 0xff, 0xd9,
]);

export const FIXTURE_FONT = concat([
  Uint8Array.from([0, 1, 0, 0]),
  encoder.encode('fake-font-data'.repeat(20)),
]);

export const CHAPTERS = [
  {
    title: 'Chapter One',
    anchor: 'c1',
    text: 'It was a quiet morning in the harbour. ',
  },
  {
    title: 'Chapter Two',
    anchor: 'c2',
    text: 'The ship returned at dusk, as promised. ',
  },
] as const;

export async function buildKf8Fixture(
  options: Kf8FixtureOptions = {},
): Promise<Uint8Array> {
  const css = encoder.encode(
    '@font-face{font-family:Fixture;src:url(kindle:embed:0003?mime=application/x-font-ttf)}' +
      'body{font-family:serif}h1{text-align:center;font-family:Fixture}',
  );
  const contents = CHAPTERS.map(
    (chapter, index) =>
      `<div aid="${index + 1}"><h1 id="${chapter.anchor}">${chapter.title}</h1>` +
      `<p class="note">${chapter.text.repeat(40)}</p>` +
      `<p><a href="{LINK}">Go elsewhere</a> — ünïcödé ✓</p>` +
      `<img src="kindle:embed:0002?mime=image/jpeg" alt="Plate ${index + 1}"/></div>`,
  );
  const fragmentBytes = contents.map((content, index) => {
    const target = index === 0 ? 1 : 0;
    const offset = contents[target]!.indexOf('<h1');
    return encoder.encode(
      content.replace(
        '{LINK}',
        `kindle:pos:fid:${base32(target, 4)}:off:${base32(offset, 10)}`,
      ),
    );
  });

  const raw: Uint8Array[] = [];
  let rawLength = 0;
  const skeletons: { offset: number; length: number }[] = [];
  const fragments: { insert: number; length: number }[] = [];
  CHAPTERS.forEach((chapter, index) => {
    const head = encoder.encode(
      '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml">' +
        `<head><title>${chapter.title}</title><link rel="stylesheet" type="text/css" ` +
        'href="kindle:flow:0001?mime=text/css"/></head><body aid="0">',
    );
    const skeleton = concat([head, encoder.encode('</body></html>')]);
    skeletons.push({ offset: rawLength, length: skeleton.length });
    fragments.push({
      insert: rawLength + head.length,
      length: fragmentBytes[index]!.length,
    });
    raw.push(skeleton, fragmentBytes[index]!);
    rawLength += skeleton.length + fragmentBytes[index]!.length;
  });
  const htmlEnd = rawLength;
  raw.push(css);
  const text = concat(raw);

  const recordSize = 4096;
  const textRecords: Uint8Array[] = [];
  for (let start = 0; start < text.length; start += recordSize) {
    const chunk = text.subarray(start, start + recordSize);
    const body = options.compressed ? palmDoc(chunk) : chunk;
    // A multibyte trailer byte, then one trailing entry sizing itself.
    textRecords.push(
      options.trailingEntries
        ? concat([body, Uint8Array.from([0x00, 0x81])])
        : body,
    );
  }

  const key = Uint8Array.from({ length: 16 }, (_, index) => index + 1);
  const deflated = await deflate(FIXTURE_FONT);
  for (let index = 0; index < Math.min(1040, deflated.length); index += 1)
    deflated[index] = deflated[index]! ^ key[index % key.length]!;
  const font = concat([
    encoder.encode('FONT'),
    be32(FIXTURE_FONT.length, 3, 24 + key.length, key.length, 24),
    key,
    deflated,
  ]);

  const firstResource = 1 + textRecords.length;
  const resources = [FIXTURE_JPEG, FIXTURE_JPEG, font];
  const fdstIndex = firstResource + resources.length;
  const fdst = concat([
    encoder.encode('FDST'),
    be32(12, 2, 0, htmlEnd, htmlEnd, text.length),
  ]);

  const skeletonRecords = indexRecords(
    [
      [1, 1, 3, 0],
      [6, 2, 12, 0],
    ],
    skeletons.map((skeleton, index) => ({
      name: encoder.encode(`SKEL${String(index).padStart(10, '0')}`),
      control: 0b0101,
      values: [1, skeleton.offset, skeleton.length],
    })),
  );
  const selectors = strings(
    fragments.map((_, index) => `P-//*[@aid='${index + 1}']`),
  );
  const fragmentRecords = indexRecords(
    [
      [2, 1, 1, 0],
      [3, 1, 2, 0],
      [4, 1, 4, 0],
      [6, 2, 8, 0],
    ],
    fragments.map((fragment, index) => ({
      name: encoder.encode(String(fragment.insert).padStart(10, '0')),
      control: 0b1111,
      values: [selectors.offsets[index]!, index, index, 0, fragment.length],
    })),
    selectors.bytes,
  );
  const labels = strings([
    'Contents',
    ...CHAPTERS.map((chapter) => chapter.title),
  ]);
  const ncxRecords = indexRecords(
    [
      [3, 1, 1, 0],
      [4, 1, 2, 0],
      [6, 2, 4, 0],
      [21, 1, 8, 0],
      [22, 1, 16, 0],
      [23, 1, 32, 0],
    ],
    [
      {
        name: encoder.encode('00'),
        control: 0b110111,
        values: [labels.offsets[0]!, 0, 0, 0, 1, 2],
      },
      ...CHAPTERS.map((_, index) => ({
        name: encoder.encode(String(index + 1).padStart(2, '0')),
        control: 0b1111,
        values: [
          labels.offsets[index + 1]!,
          1,
          index,
          contents[index]!.indexOf('<h1'),
          0,
        ],
      })),
    ],
    labels.bytes,
  );
  const skeletonIndex = fdstIndex + 1;
  const fragmentIndex = skeletonIndex + skeletonRecords.length;
  const ncxIndex = fragmentIndex + fragmentRecords.length;

  const exthItems: [number, Uint8Array][] = [
    [100, encoder.encode('Test Author')],
    [503, encoder.encode('KF8 Fixture')],
    [524, encoder.encode('en')],
    [113, encoder.encode('B000KF8TEST')],
    [201, be32(0)],
  ];
  if (options.fixedLayout) exthItems.push([122, encoder.encode('true')]);
  if (options.rtl) exthItems.push([527, encoder.encode('rtl')]);
  const exthBody = concat(
    exthItems.map(([type, value]) =>
      concat([be32(type, value.length + 8), value]),
    ),
  );
  const exth = pad4(
    concat([
      encoder.encode('EXTH'),
      be32(12 + exthBody.length, exthItems.length),
      exthBody,
    ]),
  );

  const headerLength = 264;
  const header = new Uint8Array(16 + headerLength);
  const view = new DataView(header.buffer);
  view.setUint16(0, options.compressed ? 2 : 1);
  view.setUint32(4, text.length);
  view.setUint16(8, textRecords.length);
  view.setUint16(10, recordSize);
  view.setUint16(12, options.encrypted ? 2 : 0);
  header.set(encoder.encode('MOBI'), 16);
  for (let offset = 20; offset < header.length; offset += 4)
    view.setUint32(offset, NONE);
  const put = (offset: number, value: number) => view.setUint32(offset, value);
  put(20, headerLength);
  put(24, 2);
  put(28, 65001);
  put(32, 12345);
  put(36, 8);
  put(80, firstResource);
  put(0x68, 8);
  put(108, firstResource);
  put(112, 0);
  put(116, 0);
  put(128, 0x50);
  put(192, fdstIndex);
  put(196, 2);
  put(0xf0, options.trailingEntries ? 0b11 : 0);
  put(0xf4, ncxIndex);
  put(0xf8, fragmentIndex);
  put(0xfc, skeletonIndex);
  const title = encoder.encode('KF8 Fixture');
  put(84, header.length + exth.length);
  put(88, title.length);
  const record0 = concat([header, exth, title, new Uint8Array(4)]);

  const records = [
    record0,
    ...textRecords,
    ...resources,
    fdst,
    ...skeletonRecords,
    ...fragmentRecords,
    ...ncxRecords,
    Uint8Array.from([0xe9, 0x8e, 0x0d, 0x0a]),
  ];
  const database = new Uint8Array(78);
  database.set(encoder.encode('KF8 Fixture'), 0);
  database.set(encoder.encode('BOOKMOBI'), 60);
  new DataView(database.buffer).setUint16(76, records.length);
  let offset = 78 + records.length * 8 + 2;
  const table = records.map((record, index) => {
    const entry = be32(offset, index * 2);
    offset += record.length;
    return entry;
  });
  return concat([database, ...table, new Uint8Array(2), ...records]);
}

function indexRecords(
  tags: readonly (readonly [number, number, number, number])[],
  entries: readonly {
    name: Uint8Array;
    control: number;
    values: readonly number[];
  }[],
  stringRecord?: Uint8Array,
): Uint8Array[] {
  const data: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  for (const entry of entries) {
    offsets.push(0xc0 + length);
    const bytes = concat([
      Uint8Array.from([entry.name.length]),
      entry.name,
      Uint8Array.from([entry.control]),
      ...entry.values.map(varLength),
    ]);
    data.push(bytes);
    length += bytes.length;
  }
  const body = pad4(concat(data), 0xc0);
  const idxtPosition = 0xc0 + body.length;
  const idxt = concat([
    encoder.encode('IDXT'),
    ...offsets.map((value) => Uint8Array.from([value >> 8, value & 0xff])),
  ]);
  const entryRecord = concat([
    indexHeader({ start: idxtPosition, count: entries.length }),
    body,
    idxt,
  ]);
  const tagBody = concat([
    ...tags.map((tag) => Uint8Array.from(tag)),
    Uint8Array.from([0, 0, 0, 1]),
  ]);
  const main = concat([
    indexHeader({
      count: 1,
      code: 65001,
      total: entries.length,
      nctoc: stringRecord ? 1 : 0,
    }),
    encoder.encode('TAGX'),
    be32(12 + tagBody.length, 1),
    tagBody,
  ]);
  return stringRecord ? [main, entryRecord, stringRecord] : [main, entryRecord];
}

function indexHeader(
  fields: Partial<
    Record<'start' | 'count' | 'code' | 'total' | 'nctoc', number>
  >,
): Uint8Array {
  const header = new Uint8Array(0xc0);
  header.set(encoder.encode('INDX'), 0);
  const view = new DataView(header.buffer);
  view.setUint32(4, 0xc0);
  view.setUint32(20, fields.start ?? 0);
  view.setUint32(24, fields.count ?? 0);
  view.setUint32(28, fields.code ?? 0);
  view.setUint32(36, fields.total ?? 0);
  view.setUint32(52, fields.nctoc ?? 0);
  return header;
}

function strings(values: readonly string[]): {
  bytes: Uint8Array;
  offsets: number[];
} {
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  for (const value of values) {
    const bytes = encoder.encode(value);
    offsets.push(length);
    const entry = concat([varLength(bytes.length), bytes]);
    parts.push(entry);
    length += entry.length;
  }
  return { bytes: concat(parts), offsets };
}

/** PalmDOC literal and space-pair encoding; enough to exercise the decoder. */
export function palmDoc(input: Uint8Array): Uint8Array {
  const output: number[] = [];
  for (let index = 0; index < input.length;) {
    const byte = input[index]!;
    const next = input[index + 1];
    if (byte === 0x20 && next != null && next >= 0x40 && next <= 0x7f) {
      output.push(next ^ 0x80);
      index += 2;
    } else if (byte === 0 || (byte >= 0x09 && byte <= 0x7f)) {
      output.push(byte);
      index += 1;
    } else {
      let count = 0;
      while (
        count < 8 &&
        index + count < input.length &&
        !(
          input[index + count] === 0 ||
          (input[index + count]! >= 0x09 && input[index + count]! <= 0x7f)
        )
      )
        count += 1;
      output.push(count, ...input.subarray(index, index + count));
      index += count;
    }
  }
  return Uint8Array.from(output);
}

function varLength(value: number): Uint8Array {
  const groups: number[] = [];
  do {
    groups.unshift(value & 0x7f);
    value = Math.floor(value / 128);
  } while (value > 0);
  groups[groups.length - 1]! |= 0x80;
  return Uint8Array.from(groups);
}

function base32(value: number, width: number): string {
  return value.toString(32).toUpperCase().padStart(width, '0');
}

function be32(...values: number[]): Uint8Array {
  const bytes = new Uint8Array(values.length * 4);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => view.setUint32(index * 4, value));
  return bytes;
}

function pad4(bytes: Uint8Array, base = 0): Uint8Array {
  const remainder = (base + bytes.length) % 4;
  return remainder ? concat([bytes, new Uint8Array(4 - remainder)]) : bytes;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(
    parts.reduce((total, part) => total + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([Uint8Array.from(bytes)])
    .stream()
    .pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
