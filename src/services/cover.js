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
  // const mm = {p: "Publisher: Publisher Name",n:"Student name: Name name",d:"Date: 10/02/20"};
  writeMetadata(headerHeight, metadata);

  // Image background
  // @TODO background proportion
  // @TODO image location
  await loadImage(background).then(image => {
    context.drawImage(
      image,
      0,
      imageMargin + headerHeight,
      canvas.width,
      imageHeight
    );
    const buf = canvas.toBuffer();
    fs.writeFileSync(COVER_PATH, buf);
    Logger.debug('Cover image saved');
  });
};

export default coverImage;
