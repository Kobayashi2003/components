import {
  detectPublicationFormat,
  openPublicationArchive,
} from '../../core/epub/archive/publication-format';
import { decompressPalmDoc } from '../../core/epub/archive/kf8-archive/decompression';
import { loadPublicationFromArchive } from '../../core/epub/publication/loader';
import { buildKf8Fixture, FIXTURE_FONT, palmDoc } from './kf8-fixture';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  // PalmDOC: literals, escaped bytes, space pairs and a back reference.
  const text = new TextEncoder().encode('Kindle ✓ abc');
  assert(
    new TextDecoder().decode(decompressPalmDoc(palmDoc(text))) ===
      'Kindle ✓ abc',
    'PalmDOC literal, escape and space-pair coding must round-trip',
  );
  assert(
    new TextDecoder().decode(
      decompressPalmDoc(Uint8Array.from([0x61, 0x62, 0x63, 0x80, 0x18])),
    ) === 'abcabc',
    'a PalmDOC back reference must copy earlier output',
  );

  const compressed = await buildKf8Fixture({
    compressed: true,
    trailingEntries: true,
  });
  assert(
    detectPublicationFormat(compressed) === 'mobi',
    'a KF8 book must be detected by its Palm database type',
  );
  const opened = await openPublicationArchive(compressed);
  assert(
    opened.archive &&
      opened.diagnostics.some(
        (diagnostic) => diagnostic.code === 'KF8_CONVERTED',
      ),
    `a KF8 book must open as an archive: ${opened.diagnostics.map((d) => d.message).join('; ')}`,
  );

  const loaded = await loadPublicationFromArchive(
    opened.archive,
    opened.diagnostics,
  );
  const publication = loaded.publication;
  assert(
    publication,
    `the synthesized package must load: ${loaded.diagnostics
      .filter((diagnostic) => diagnostic.severity === 'fatal')
      .map((diagnostic) => diagnostic.message)
      .join('; ')}`,
  );
  assert(
    publication.metadata.title === 'KF8 Fixture' &&
      publication.metadata.language === 'en' &&
      publication.metadata.creators[0]?.name === 'Test Author',
    'EXTH metadata must become package metadata',
  );
  assert(
    publication.spine.length === 3 &&
      publication.spine[0]!.path === 'OEBPS/Text/cover.xhtml',
    'a cover page must precede one spine document per skeleton',
  );
  const toc = publication.navigation.toc;
  assert(
    toc.length === 1 &&
      toc[0]!.label === 'Contents' &&
      toc[0]!.children.map((item) => item.label).join() ===
        'Chapter One,Chapter Two' &&
      toc[0]!.children[1]!.fragment === 'c2',
    'the NCX index must become a nested table of contents',
  );
  assert(
    publication.manifest.some(
      (item) =>
        item.properties.includes('cover-image') &&
        item.mediaType === 'image/jpeg',
    ),
    'EXTH cover offset must mark the cover image',
  );

  const archive = opened.archive;
  const part = await archive.readText('OEBPS/Text/part0000.xhtml');
  assert(
    part.includes('href="part0001.xhtml#c2"'),
    'kindle:pos links must resolve to the target part and anchor',
  );
  assert(
    part.includes('src="../Images/image00002.jpg"') &&
      part.includes('href="../Styles/flow0001.css"'),
    'kindle:embed and kindle:flow references must become relative paths',
  );
  assert(
    part.includes('ünïcödé ✓') && part.includes('id="aid-1"'),
    'text must stay UTF-8 and aid elements must become linkable',
  );
  const back = await archive.readText('OEBPS/Text/part0001.xhtml');
  assert(
    back.includes('href="part0000.xhtml#c1"'),
    'backward kindle:pos links must resolve too',
  );
  const font = await archive.read('OEBPS/Fonts/font00003.ttf');
  assert(
    font.length === FIXTURE_FONT.length &&
      font.every((byte, index) => byte === FIXTURE_FONT[index]),
    'obfuscated compressed fonts must be restored exactly',
  );
  const css = await archive.readText('OEBPS/Styles/flow0001.css');
  assert(
    css.includes('font-family:serif') &&
      css.includes('url(../Fonts/font00003.ttf)'),
    'CSS flows must become stylesheets with resolved font references',
  );

  const plain = await openPublicationArchive(
    await buildKf8Fixture({ rtl: true, fixedLayout: true }),
  );
  const plainLoaded = await loadPublicationFromArchive(plain.archive!);
  assert(
    plainLoaded.publication?.pageProgressionDirection === 'rtl' &&
      plainLoaded.publication.rendition.layout === 'pre-paginated',
    'uncompressed text, page direction and fixed layout must be honoured',
  );

  const protectedBook = await openPublicationArchive(
    await buildKf8Fixture({ encrypted: true }),
  );
  assert(
    protectedBook.archive === null &&
      protectedBook.diagnostics.some(
        (diagnostic) => diagnostic.code === 'KF8_DRM_PROTECTED',
      ),
    'DRM-protected books must be refused with a clear diagnostic',
  );

  const truncated = await openPublicationArchive(compressed.subarray(0, 400));
  assert(
    truncated.archive === null &&
      truncated.diagnostics.some(
        (diagnostic) => diagnostic.severity === 'fatal',
      ),
    'truncated Kindle files must fail with a diagnostic, not an exception',
  );

  console.log('KF8 archive integration test: PASS');
}

void main();
