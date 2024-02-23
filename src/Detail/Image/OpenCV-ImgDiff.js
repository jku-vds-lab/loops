// disable eslint
/* eslint-disable */

export function addDifferenceHighlight(
  targetImgBase64,
  compareImgBase64,
  color,
  kernelSize = 3,
  orb = false,
  grayscale = false,
  colorBoth = false
) {
  // console.log('cv', cv);

  const targetImg = new Image();
  targetImg.src = targetImgBase64;

  const compareImg = new Image();
  compareImg.src = compareImgBase64;

  console.time('decode images');

  // let time = Date.now();
  let startTime = Date.now();
  const timeOut = 0.333 * 1000;

  while (!targetImg.complete || !compareImg.complete) {
    if (Date.now() - startTime > timeOut) {
      console.timeEnd('decode images');
      console.error('Timeout while decoding images');
      throw new Error('Timeout while decoding images');
      // } else if (Date.now() - time > 1000) {
      //   console.debug('deocding images');
      //   time = Date.now();
    } else {
      continue; //noop
    }
  }
  console.timeEnd('decode images');

  // use size of targetImage for both, i.e. the compare image may be cut off it is larger
  const baseImgMat = imageToMat(targetImg, targetImg.width, targetImg.height);
  const compareImgMat = imageToMat(compareImg, targetImg.width, targetImg.height);

  targetImg.remove();
  compareImg.remove();

  if (!baseImgMat || !compareImgMat) {
    return;
  }

  let orbScore = undefined;
  if (orb === true) {
    orbScore = calcORB(baseImgMat, compareImgMat);
    orbScore = 1 - orbScore; // convert distance to similarity
  }

  const changeArea = 'pixels';

  // console.log('getDiff');
  const diff = getDiff(baseImgMat, compareImgMat, true, kernelSize);
  const diffReverse = getDiff(compareImgMat, baseImgMat, false, kernelSize);

  // console.log('length before', compareImgMat.data.length);

  if (grayscale) {
    cv.cvtColor(compareImgMat, compareImgMat, cv.COLOR_BGR2GRAY);
    cv.cvtColor(compareImgMat, compareImgMat, cv.COLOR_GRAY2BGRA);
  }

  // console.log('length after', compareImgMat.data.length);

  const thickness = -1; // -1 = filled, 1 = 1px thick, 2 = 2px thick, ...
  const contourDrawOpacity = 255; // draw contour fully opaque because it would set the pixels' opacity and not make the contour itself transparent
  const diffOverlayWeight = 0.66; // instead, draw contours on a copy of the image and blend it with the original image to achieve a transparency effect
  const colorCV = new cv.Scalar(color.r, color.g, color.b, contourDrawOpacity);

  let pixelSimilartiy = undefined;
  // console.log('pixelDiff');
  if (changeArea === 'pixels') {
    pixelSimilartiy = pixelDiff(compareImgMat, diff.img, diffReverse.img, diffOverlayWeight, colorCV, colorBoth);
    diff.img.delete();
  } else {
    drawContours(compareImgMat, diff.contours, colorCV, thickness, diffOverlayWeight, changeArea);
  }

  // console.log('back to bas64');
  // OpenCV.js Mat back to Base64
  const imgData = new ImageData(new Uint8ClampedArray(compareImgMat.data), compareImgMat.cols, compareImgMat.rows);
  const canvas = document.createElement('canvas');
  canvas.width = compareImgMat.cols;
  canvas.height = compareImgMat.rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.putImageData(imgData, 0, 0);
  const base64Img = canvas.toDataURL();

  canvas.remove();
  baseImgMat.delete();
  compareImgMat.delete();

  return { img: base64Img, changes: diff.contours.length, orb: orbScore, pixelSimilartiy };
}

function pixelDiff(target, mask, mask2, diffOverlayWeight, color, colorBoth) {
  const overlay = target.clone();

  const maskData = mask.data;
  let similarPixels = maskData.length;

  for (let i = 0; i < maskData.length; i += 1) {
    const rgbaIndex = i * 4;
    if (
      maskData[i] !== 0 && // mask is not black
      mask2.data[i] === 0 // mask2 is black
      //  &&
      // //overlay is white
      // overlay.data[rgbaIndex] === 255 &&
      // overlay.data[rgbaIndex + 1] === 255 &&
      // overlay.data[rgbaIndex + 2] === 255
    ) {
      overlay.data[rgbaIndex] = color[0];
      overlay.data[rgbaIndex + 1] = color[1];
      overlay.data[rgbaIndex + 2] = color[2];
      similarPixels--; // TODO check for similar on-white pixels instead?
    } else if (
      maskData[i] !== 0 && // mask is not black
      mask2.data[i] !== 0 // mask2 is black
    ) {
      overlay.data[rgbaIndex] = 251;
      overlay.data[rgbaIndex + 1] = 225;
      overlay.data[rgbaIndex + 2] = 86;
    } else if (
      colorBoth &&
      maskData[i] === 0 && // mask is black
      mask2.data[i] !== 0 // mask2 is not black
    ) {
      overlay.data[rgbaIndex] = 240;
      overlay.data[rgbaIndex + 1] = 82;
      overlay.data[rgbaIndex + 2] = 104;
    }
  }
  cv.addWeighted(overlay, diffOverlayWeight, target, 1 - diffOverlayWeight, 0, target, -1);
  // console.log('similarPixels', similarPixels, 'differentPixels', maskData.length - similarPixels);
  // console.log('pixelSimilartiy', similarPixels / maskData.length);
  return similarPixels / maskData.length;
}

function getDiff(compareImg, baseImg, calcContours, kernelSize) {
  const diffImg = new cv.Mat();
  cv.subtract(compareImg, baseImg, diffImg);
  const grayImg = new cv.Mat();
  cv.cvtColor(diffImg, grayImg, cv.COLOR_BGR2GRAY);

  const th = 26; // up to 10% (26/255) difference is tolerated
  const imask = new cv.Mat();
  cv.threshold(grayImg, imask, th, 255, cv.THRESH_BINARY);
  // cv.imshow('mask', imask);

  const kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
  const dilate = new cv.Mat();
  // get iterations from slider #dilateIterations
  let iterations = 2;

  cv.dilate(
    imask,
    dilate,
    kernel,
    new cv.Point(-1, -1),
    iterations,
    cv.BORDER_CONSTANT,
    cv.morphologyDefaultBorderValue()
  );
  // cv.imshow('dilate', dilate);

  const erode = new cv.Mat();
  iterations = 1;
  cv.erode(
    dilate,
    erode,
    kernel,
    new cv.Point(-1, -1),
    iterations,
    cv.BORDER_CONSTANT,
    cv.morphologyDefaultBorderValue()
  );
  // cv.imshow('erode', erode);

  diffImg.delete();
  grayImg.delete();
  imask.delete();
  kernel.delete();
  dilate.delete();

  if (!calcContours) {
    return {
      img: erode,
      contours: []
    };
  }

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  // RETR_EXTERNAL ... returns only extreme outer flags. All child contours are left behind. see https://docs.opencv.org/4.x/d9/d8b/tutorial_py_contours_hierarchy.html
  cv.findContours(erode, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  hierarchy.delete();

  const boundingRects = [];
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    // Calculate bounding rectangles for all contours
    boundingRects.push(cv.boundingRect(contour));
  }

  // Filter out contours that are within others
  const filteredContours = new Set();

  for (let i = 0; i < boundingRects.length; i++) {
    const boundingRectA = boundingRects[i];
    let aWasNestedAtLeastOnce = false;

    for (let j = 0; j < boundingRects.length; j++) {
      if (i !== j) {
        const boundingRectB = boundingRects[j];

        const aIsInB =
          boundingRectB.x <= boundingRectA.x &&
          boundingRectB.y <= boundingRectA.y &&
          boundingRectB.x + boundingRectB.width >= boundingRectA.x + boundingRectA.width &&
          boundingRectB.y + boundingRectB.height >= boundingRectA.y + boundingRectA.height;

        if (aIsInB) {
          aWasNestedAtLeastOnce = true;
          break;
        }
      }
    }

    if (!aWasNestedAtLeastOnce) {
      filteredContours.add(contours.get(i));
    } else {
      contours.get(i).delete();
    }
  }

  contours.delete();
  return {
    img: erode,
    contours: Array.from(filteredContours)
  };
}

function calcORB(baseImg, compareImg) {
  // time the ORB calculation
  // console.time('ORB');

  const orb = new cv.ORB();
  const baseKeypoints = new cv.KeyPointVector();
  const compareKeypoints = new cv.KeyPointVector();
  const baseDescriptors = new cv.Mat();
  const compareDescriptors = new cv.Mat();
  const mask = new cv.Mat();
  orb.detectAndCompute(baseImg, mask, baseKeypoints, baseDescriptors);
  orb.detectAndCompute(compareImg, mask, compareKeypoints, compareDescriptors);

  const bfMatcher = new cv.BFMatcher(cv.NORM_HAMMING, true);
  const matches = new cv.DMatchVector();
  bfMatcher.match(baseDescriptors, compareDescriptors, matches);
  let matchScore = 0;
  for (let i = 0; i < matches.size(); i++) {
    matchScore += matches.get(i).distance;
  }
  matchScore /= matches.size();
  const descriptorBits = 32 * 8; // see https://docs.opencv.org/4.8.0/db/d95/classcv_1_1ORB.html#ac166094ca013f59bfe3df3b86fa40bfe
  matchScore /= descriptorBits; // normalize

  orb.delete();
  baseKeypoints.delete();
  compareKeypoints.delete();
  baseDescriptors.delete();
  compareDescriptors.delete();
  mask.delete();

  bfMatcher.delete();
  matches.delete();

  // console.log('ORB score', matchScore);
  // console.timeEnd('ORB');
  return matchScore;
}

function drawContours(target, contours, color, thickness, diffOverlayWeight, type) {
  // draw added contours on compareImage
  const overlay = target.clone();
  for (const contour of contours) {
    // draw contours as rectangle or convex hull. see https://docs.opencv.org/3.4/dd/d49/tutorial_py_contour_features.html
    if (type === 'rectangle') {
      const rect = cv.boundingRect(contour);
      const pt1 = new cv.Point(rect.x, rect.y);
      const pt2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);

      cv.rectangle(overlay, pt1, pt2, color, thickness); // scaler = color in RGB-Opacity format
    } else if (type === 'hull') {
      const hull = new cv.Mat();
      cv.convexHull(contour, hull, false, true);

      // Draw the convex hull
      const lineType = cv.LINE_8;
      const hulls = new cv.MatVector();
      hulls.push_back(hull);

      // this could be done for all contours at once, by putting them into a MatVector
      cv.drawContours(overlay, hulls, 0, color, thickness, lineType);
      hulls.delete();
    } else {
      throw new Error(`Unknown contour type ${type}`);
    }

    contour.delete();
  }

  cv.addWeighted(overlay, diffOverlayWeight, target, 1 - diffOverlayWeight, 0, target, -1);
  overlay.delete();
}

function imageToMat(img, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get context from canvas');
    return undefined;
  }

  // fill with white first  in case it is smaller
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, 0, 0);

  const baseImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const baseImg = cv.matFromImageData(baseImgData);

  canvas.remove();
  return baseImg;
}
