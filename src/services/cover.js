import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import Logger from '../utils/Logger';
import { BACKGROUND_COLOR, FONT, FONT_COLOR, COVER_PATH } from '../config';

const canvas = createCanvas(600, 600);
const context = canvas.getContext('2d');
const marginLeft = 10;

// general text properties
const fontSize = 20;
const lineSpacing = 5;

// title properties
const titleFontSize = 70;
const titleMargin = 10;

// author properties
const authorFontSize = 20;

// image properties
const imageMargin = 15;
const imageHeight = 300;

const writeMetadata = (heightPadding, texts) => {
  Object.entries(texts).forEach(([key, value], index) => {
    const y =
      imageMargin +
      heightPadding +
      imageHeight +
      (index + 1) * (fontSize + lineSpacing);
    const text = `${key}: ${value}`;
    context.fillText(text, marginLeft, y);
  });
};

const coverImage = async (background, title, author, metadata) => {
  // background
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // ils title
  // @TODO ils title too long
  context.font = `${titleFontSize}px ${FONT}`;
  context.fillStyle = FONT_COLOR;
  context.fillText(title, marginLeft, titleMargin + titleFontSize);

  // ils author
  const headerHeight =
    authorFontSize + titleFontSize + 2 * titleMargin + lineSpacing;
  context.font = `${authorFontSize}px ${FONT}`;
  context.fillText(author, marginLeft, headerHeight);

  // ils metadata
  context.font = `${fontSize}px ${FONT}`;
  writeMetadata(headerHeight, metadata);

  // Image background
  await loadImage(background).then(image => {
    let x = 0;
    let y = 0;
    let cropScaleX = canvas.width;
    let cropScaleY = imageHeight;

    // we crop oversized images
    if (image.height > imageHeight && image.width > canvas.width) {
      x = image.width / 2 - canvas.width / 2;
      y = image.height / 2 - imageHeight / 2;
      cropScaleX = canvas.width;
      cropScaleY = imageHeight;
    } else {
      // If image's aspect ratio is less than canvas's we fit on the longest edge
      const imageAspectRatio = image.width / image.height;
      const canvasAspectRatio = canvas.width / imageHeight;

      if (imageAspectRatio < canvasAspectRatio) {
        cropScaleX = image.width;
        cropScaleY = imageHeight * (image.width / canvas.width);
        y = image.height / 2 - cropScaleY / 2;
      } else if (imageAspectRatio > canvasAspectRatio) {
        cropScaleY = image.height;
        cropScaleX = canvas.width * (image.height / imageHeight);
        x = image.width / 2 - cropScaleX / 2;
      }
    }

    context.drawImage(
      image,
      x,
      y,
      cropScaleX,
      cropScaleY,
      0,
      imageMargin + headerHeight, // position in canvas - y
      canvas.width,
      imageHeight // size from position
    );
    const buf = canvas.toBuffer();
    fs.writeFileSync(COVER_PATH, buf);
    Logger.debug('Cover image saved');
  });
};

export default coverImage;
