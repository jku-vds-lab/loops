import * as cv from '@techstark/opencv-js';

export async function addDifferenceHighlight(
  targetImgBase64,
  compareImgBase64,
  color: { r: number; g: number; b: number }
): Promise<string | undefined> {
  console.log('base64ToMat');
  const baseImgMat = await base64ToMat(targetImgBase64);
  const compareImgMat = await base64ToMat(compareImgBase64);

  if (!baseImgMat || !compareImgMat) {
    return;
  }

  const changeArea = 'pixels';

  console.log('getDiff');
  const diffAdded = getDiff(baseImgMat, compareImgMat, true);
  // const diffRemoved = getDiff(compareImgMat, baseImgMat, true);

  const thickness = -1; // -1 = filled, 1 = 1px thick, 2 = 2px thick, ...
  const contourDrawOpacity = 255; // draw contour fully opaque because it would set the pixels' opacity and not make the contour itself transparent
  const diffOverlayWeight = 0.66; // instead, draw contours on a copy of the image and blend it with the original image to achieve a transparency effect
  const colorCV = new cv.Scalar(color.r, color.g, color.b, contourDrawOpacity);

  console.log('pixelDiff');
  if (changeArea === 'pixels') {
    pixelDiff(compareImgMat, diffAdded.img, diffOverlayWeight, color);
    (diffAdded.img as any).delete();
  } else {
    drawContours(compareImgMat, diffAdded.contours, color, thickness, diffOverlayWeight, changeArea);
  }

  // document.getElementById(
  //   'summary'
  // ).innerText = `${diffRemoved.contours.length} removed and ${diffAdded.contours.length} added regions.`;

  console.log('back to bas64');
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
  (baseImgMat as any).delete();
  (compareImgMat as any).delete();

  return base64Img;
}

function pixelDiff(target, mask, diffOverlayWeight, color) {
  const overlay = target.clone();

  const maskData = mask.data;
  for (let i = 0; i < maskData.length; i += 1) {
    const rgbaIndex = i * 4;
    if (
      maskData[i] !== 0 // mask is black
      //  &&
      // //overlay is white
      // overlay.data[rgbaIndex] === 255 &&
      // overlay.data[rgbaIndex + 1] === 255 &&
      // overlay.data[rgbaIndex + 2] === 255
    ) {
      overlay.data[rgbaIndex] = color[0];
      overlay.data[rgbaIndex + 1] = color[1];
      overlay.data[rgbaIndex + 2] = color[2];
    }
  }
  cv.addWeighted(overlay, diffOverlayWeight, target, 1 - diffOverlayWeight, 0, target, -1);
}

function getDiff(compareImg, baseImg, calcContours) {
  const diffImg = new cv.Mat();
  cv.subtract(compareImg, baseImg, diffImg);
  const grayImg = new cv.Mat();
  cv.cvtColor(diffImg, grayImg, cv.COLOR_BGR2GRAY);

  const th = 26; // up to 10% (26/255) difference is tolerated
  const imask = new cv.Mat();
  cv.threshold(grayImg, imask, th, 255, cv.THRESH_BINARY);
  cv.imshow('mask', imask);

  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
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
  cv.imshow('dilate', dilate);

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
  cv.imshow('erode', erode);

  (diffImg as any).delete();
  (grayImg as any).delete();
  (imask as any).delete();
  (kernel as any).delete();
  (dilate as any).delete();

  if (!calcContours) {
    return {
      img: erode,
      contours: []
    };
  }

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  // RETR_EXTERNAL ... returns only extreme outer flags. All child contours are left behind. see https://docs.opencv.org/4.x/d9/d8b/tutorial_py_contours_hierarchy.html
  cv.findContours(erode, contours as unknown as cv.Mat, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  (hierarchy as any).delete();

  const boundingRects: any[] = [];
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
      (contours.get(i) as any).delete();
    }
  }

  (contours as any).delete();
  return {
    img: erode,
    contours: Array.from(filteredContours)
  };
}

function orbScore(baseImg, compareImg) {
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
  (bfMatcher as any).match(baseDescriptors, compareDescriptors, matches);
  let matchScore = 0;
  for (let i = 0; i < matches.size(); i++) {
    matchScore += matches.get(i).distance;
  }
  matchScore /= matches.size();
  const descriptorBits = 32 * 8; // see https://docs.opencv.org/4.8.0/db/d95/classcv_1_1ORB.html#ac166094ca013f59bfe3df3b86fa40bfe
  matchScore /= descriptorBits; // normalize

  (orb as any).delete();
  (baseKeypoints as any).delete();
  (compareKeypoints as any).delete();
  (baseDescriptors as any).delete();
  (compareDescriptors as any).delete();
  (mask as any).delete();

  (bfMatcher as any).delete();
  (matches as any).delete();

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
      cv.drawContours(overlay, hulls as unknown as cv.Mat, 0, color, thickness, lineType);
      (hulls as any).delete();
    } else {
      throw new Error(`Unknown contour type ${type}`);
    }

    (contour as any).delete();
  }

  cv.addWeighted(overlay, diffOverlayWeight, target, 1 - diffOverlayWeight, 0, target, -1);
  (overlay as any).delete();
}
async function base64ToMat(base64Img: any): Promise<cv.Mat | undefined> {
  //---------- Render 1st base64 string
  const img = new Image();
  img.src = base64Img;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctxA = canvas.getContext('2d');
  if (!ctxA) {
    console.error('Could not get context from canvas');
    return undefined;
  }

  ctxA.drawImage(img, 0, 0);

  const baseImgData = ctxA.getImageData(0, 0, canvas.width, canvas.height);
  const baseImg = cv.matFromImageData(baseImgData);

  canvas.remove();
  img.remove();
  return baseImg;
}
