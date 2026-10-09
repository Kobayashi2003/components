export type AsciiMediaSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

export type AsciiColorMode = 'mono' | 'source' | 'palette';
export type AsciiDensityMode = 'auto' | 'bright' | 'dark';

export const MAX_COLUMNS = 1024;
export const MAX_DETAIL_COLUMNS = 1536;
export const DEFAULT_CHARSET = '@#*+=-:. ';
export const DEFAULT_PALETTE = ['#392b67', '#b44b8b', '#f0a36b', '#fff1b5'];

const CELL_WIDTH_RATIO = 0.62;

interface RenderAsciiOptions {
  canvas: HTMLCanvasElement;
  sampleCanvas: HTMLCanvasElement;
  colorCanvas: HTMLCanvasElement;
  source: AsciiMediaSource;
  width: number;
  height: number;
  pixelRatio: number;
  columns: number;
  charset: string;
  fontSize: number;
  contrast: number;
  colorMode: AsciiColorMode;
  densityMode: AsciiDensityMode;
  color: string;
  background: string;
  palette: readonly string[];
  sourceSaturation: number;
  sourceBrightness: number;
  sourceShadowLift: number;
  sourceFill: number;
  fit: 'cover' | 'contain';
}

export function getSourceSize(source: AsciiMediaSource): [number, number] {
  if (source instanceof HTMLVideoElement) return [source.videoWidth, source.videoHeight];
  if (source instanceof HTMLImageElement) return [source.naturalWidth, source.naturalHeight];
  return [source.width, source.height];
}

function parseHexColor(value: string): [number, number, number] | null {
  const hex = value.replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(hex)) {
    return [...hex].map(digit => parseInt(digit + digit, 16)) as [number, number, number];
  }
  if (/^[\da-f]{6}$/i.test(hex)) {
    return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)) as [
      number,
      number,
      number,
    ];
  }
  return null;
}

function byte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function colorLuminance(value: string, context: CanvasRenderingContext2D): number {
  context.fillStyle = '#000000';
  context.fillStyle = value;
  const normalized = context.fillStyle;
  const hex = parseHexColor(normalized);
  const rgb =
    hex ??
    normalized
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
  if (!rgb || rgb.length < 3) return 0;
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function sampleSource(
  context: CanvasRenderingContext2D,
  source: AsciiMediaSource,
  displayWidth: number,
  displayHeight: number,
  cellWidth: number,
  cellHeight: number,
  fit: 'cover' | 'contain',
) {
  const [sourceWidth, sourceHeight] = getSourceSize(source);
  if (!sourceWidth || !sourceHeight) return false;

  const scale =
    fit === 'cover'
      ? Math.max(displayWidth / sourceWidth, displayHeight / sourceHeight)
      : Math.min(displayWidth / sourceWidth, displayHeight / sourceHeight);
  const drawnWidth = sourceWidth * scale;
  const drawnHeight = sourceHeight * scale;
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.drawImage(
    source,
    (displayWidth - drawnWidth) / 2 / cellWidth,
    (displayHeight - drawnHeight) / 2 / cellHeight,
    drawnWidth / cellWidth,
    drawnHeight / cellHeight,
  );
  return true;
}

function colorForPixel(
  mode: AsciiColorMode,
  red: number,
  green: number,
  blue: number,
  luminance: number,
  palette: [number, number, number][],
  saturation: number,
  brightness: number,
  shadowLift: number,
): [number, number, number] {
  if (mode === 'palette' && palette.length) {
    const position = Math.max(0, Math.min(1, luminance / 255)) * (palette.length - 1);
    const left = palette[Math.floor(position)];
    const right = palette[Math.min(palette.length - 1, Math.ceil(position))];
    const mix = position - Math.floor(position);
    return [
      byte(left[0] + (right[0] - left[0]) * mix),
      byte(left[1] + (right[1] - left[1]) * mix),
      byte(left[2] + (right[2] - left[2]) * mix),
    ];
  }

  const gamma = 1 - Math.max(0, Math.min(0.8, shadowLift));
  const liftedRed = 255 * (red / 255) ** gamma;
  const liftedGreen = 255 * (green / 255) ** gamma;
  const liftedBlue = 255 * (blue / 255) ** gamma;
  const average = (liftedRed + liftedGreen + liftedBlue) / 3;
  const gain = Math.max(0, brightness);
  const chroma = Math.max(0, saturation);
  return [
    byte((average + (liftedRed - average) * chroma) * gain),
    byte((average + (liftedGreen - average) * chroma) * gain),
    byte((average + (liftedBlue - average) * chroma) * gain),
  ];
}

export function renderAsciiLayer({
  canvas,
  sampleCanvas,
  colorCanvas,
  source,
  width,
  height,
  pixelRatio,
  columns,
  charset,
  fontSize,
  contrast,
  colorMode,
  densityMode,
  color,
  background,
  palette,
  sourceSaturation,
  sourceBrightness,
  sourceShadowLift,
  sourceFill,
  fit,
}: RenderAsciiOptions): string | null {
  const context = canvas.getContext('2d');
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!context || !sampleContext) return null;

  const cellWidth = width / columns;
  const cellHeight = cellWidth / CELL_WIDTH_RATIO;
  const rows = Math.max(1, Math.round(height / cellHeight));
  sampleCanvas.width = columns;
  sampleCanvas.height = rows;
  if (!sampleSource(sampleContext, source, width, height, cellWidth, cellHeight, fit)) return null;
  const pixels = sampleContext.getImageData(0, 0, columns, rows).data;

  const targetWidth = Math.max(1, Math.round(width * pixelRatio));
  const targetHeight = Math.max(1, Math.round(height * pixelRatio));
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  const glyphs = [...charset].filter(glyph => glyph.trim().length > 0);
  if (!glyphs.length) glyphs.push(...DEFAULT_CHARSET.trim().split(''));
  const colors = palette.map(parseHexColor).filter(entry => entry !== null);
  const needsColorMap = colorMode !== 'mono' && (colorMode === 'source' || colors.length > 0);
  const backgroundLuminance = colorLuminance(background, sampleContext);
  const denseForBright =
    densityMode === 'bright' ||
    (densityMode === 'auto' &&
      (colorMode === 'mono'
        ? colorLuminance(color, sampleContext) >= backgroundLuminance
        : backgroundLuminance < 128));
  const colorContext = needsColorMap ? colorCanvas.getContext('2d') : null;
  if (needsColorMap && !colorContext) return null;
  let colorPixels: ImageData | null = null;
  if (colorContext) {
    colorCanvas.width = columns;
    colorCanvas.height = rows;
    colorPixels = colorContext.createImageData(columns, rows);
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  const glyphSize = Math.max(0.25, Math.min(fontSize, cellHeight * 0.94));
  context.font = `600 ${glyphSize}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.letterSpacing = '0px';
  const glyphAdvance = context.measureText('M').width;
  context.letterSpacing = `${cellWidth - glyphAdvance}px`;
  context.fillStyle = colorPixels ? '#fff' : color;
  const lines: string[] = [];

  for (let y = 0; y < rows; y += 1) {
    let line = '';
    for (let x = 0; x < columns; x += 1) {
      const offset = (y * columns + x) * 4;
      const alpha = pixels[offset + 3];
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722 - 128) * contrast + 128;
      const density = denseForBright ? 1 - luminance / 256 : luminance / 256;
      const index = Math.min(glyphs.length - 1, Math.max(0, Math.floor(density * glyphs.length)));
      line += alpha < 26 ? ' ' : glyphs[index];

      if (colorPixels) {
        const [mappedRed, mappedGreen, mappedBlue] = colorForPixel(
          colorMode,
          red,
          green,
          blue,
          luminance,
          colors,
          sourceSaturation,
          sourceBrightness,
          sourceShadowLift,
        );
        colorPixels.data[offset] = mappedRed;
        colorPixels.data[offset + 1] = mappedGreen;
        colorPixels.data[offset + 2] = mappedBlue;
        colorPixels.data[offset + 3] = alpha;
      }
    }
    lines.push(line);
    context.fillText(line, (cellWidth - glyphAdvance) / 2, (y + 0.5) * cellHeight);
  }

  if (colorContext && colorPixels) {
    colorContext.putImageData(colorPixels, 0, 0);
    context.globalCompositeOperation = 'source-in';
    context.imageSmoothingEnabled = false;
    context.drawImage(colorCanvas, 0, 0, width, rows * cellHeight);
    context.globalCompositeOperation = 'source-over';
    context.imageSmoothingEnabled = true;
    if (colorMode === 'source' && sourceFill > 0) {
      context.globalCompositeOperation = 'destination-over';
      context.globalAlpha = Math.min(1, sourceFill);
      context.drawImage(colorCanvas, 0, 0, width, rows * cellHeight);
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
    }
  }

  return lines.join('\n');
}
