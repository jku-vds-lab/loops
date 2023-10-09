import React, { useEffect, useRef, useState } from 'react';
import { CodeCellProvenance } from '../Provenance/JupyterListener';
import { IDiffProps, useStyles, IDiffDetailProps } from './DiffDetail';

export const ImgDiff = ({ newCell, oldCell }: IDiffProps) => {
  const { classes, cx } = useStyles();
  const leftHeader = useRef<HTMLDivElement>(null);

  const [diffMode, setDiffMode] = useState('side-by-side');
  const handleDiffModeChange = event => {
    setDiffMode(event.target.value);
  };

  const [showChanges, setHighlightChanges] = React.useState(false);
  const handleHighlightChangesChange = () => {
    setHighlightChanges(!showChanges);
  };

  const [oldBase64, setOldBase64] = useState(prepareBase64(oldCell));
  const [newBase64, setNewBase64] = useState(prepareBase64(newCell));

  useEffect(() => {
    const addDiffs = async () => {
      console.log('useEffect calls addDiffs', showChanges);
      if (showChanges) {
        const addedBase64 = await addDifference(oldBase64, newBase64, 'added');
        setNewBase64(addedBase64);

        const removedBase64 = await addDifference(oldBase64, newBase64, 'removed');
        setOldBase64(removedBase64);
      } else {
        setOldBase64(prepareBase64(oldCell));
        setNewBase64(prepareBase64(newCell));
      }
    };

    addDiffs();
  }, [showChanges]);

  function getSidebySideDiff(): React.ReactNode {
    return (
      <div style={{ display: 'flex ' }}>
        <div
          style={{
            width: 'calc(50% - 14px)',
            borderRight: 'var(--jp-border-width) solid var(--jp-toolbar-border-color)'
          }}
        >
          <img src={oldBase64} style={{ width: '100%' }} />
        </div>
        <div style={{ flexGrow: '1' }}>
          <img src={newBase64} style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  function getUnifiedDiff(): React.ReactNode {
    return <>Unified</>;
  }

  return (
    <div className={cx(classes.diffDetail)}>
      <div className={cx(classes.monacoOptions)}>
        <header>Diff View</header>
        <label>
          <input
            type="radio"
            value="side-by-side"
            checked={diffMode === 'side-by-side'}
            onChange={handleDiffModeChange}
          />
          Side-by-Side
        </label>
        <label>
          <input type="radio" value="unified" checked={diffMode === 'unified'} onChange={handleDiffModeChange} />
          Unified
        </label>
        <label>
          <input
            type="checkbox"
            checked={showChanges}
            onChange={handleHighlightChangesChange}
            style={{ marginTop: '1em' }}
          />
          Highlight Changes
        </label>
        Similarity Measures:
        <ul>
          <li>Structural Similatiy:</li>
          <li>Hausdorff Distance:</li>
          <li>Mean Squared Error:</li>
          <li>NMI: </li>
        </ul>
      </div>
      <div className={cx(classes.monacoWrapper)}>
        <div className={cx(classes.monacoHeader)}>
          <div ref={leftHeader} style={{ width: 'calc(50% - 14px)' }}>
            v{oldCell.stateNo + 1},{' '}
            <relative-time datetime={oldCell.timestamp.toISOString()} precision="second">
              {oldCell.timestamp.toLocaleTimeString()} {oldCell.timestamp.toLocaleDateString()}
            </relative-time>
          </div>
          <div style={{ flexGrow: '1' }}>
            v{newCell.stateNo + 1},{' '}
            <relative-time datetime={newCell.timestamp.toISOString()} precision="second">
              {newCell.timestamp.toLocaleTimeString()} {newCell.timestamp.toLocaleDateString()}
            </relative-time>
          </div>
        </div>
        {diffMode === 'side-by-side' ? getSidebySideDiff() : getUnifiedDiff()}
      </div>
    </div>
  );
};
/**
 *
 * @param color ranging from 0-255
 */
function sRGB2Lin(color: number) {
  const normalized = color / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  } else {
    return Math.pow((normalized + 0.055) / 1.055, 2.4);
  }
}
function lin2sRGB(linGrey: number) {
  if (linGrey <= 0.0031308) {
    return linGrey * 12.92 * 255;
  } else {
    return (1.055 * Math.pow(linGrey, 1 / 2.4) - 0.055) * 255;
  }
}
function prepareBase64(cellDiff: IDiffDetailProps) {
  let base64 = (cellDiff.cell as CodeCellProvenance).output.find(out => out.data?.['image/png'] !== undefined)?.data?.[
    'image/png'
  ];

  if (base64 !== undefined) {
    // append base64 header
    base64 = `data:image/png;base64,${base64}`;
  } else {
    // create empty base64 image
    base64 = 'data:null';
  }
  return base64;
}
const addDifference = async (oldBase64, newBase64, highlight) => {
  // if removed old is basis and what was removed is highlighted on it in red
  // if added, new is the bassis and what was added is highlighted in green
  // i.e., as for code
  const [base, compare] = highlight === 'removed' ? [oldBase64, newBase64] : [newBase64, oldBase64];

  const baseImg = new Image();
  baseImg.src = base;
  await baseImg.decode();

  const compareImg = new Image();
  compareImg.src = compare;
  await compareImg.decode();

  const diffCanvas = document.createElement('canvas');
  // canvas size based on base image, as this is the what is displayed (+ highlights from the compareImg)
  diffCanvas.width = baseImg.width;
  diffCanvas.height = baseImg.height;

  const ctx = diffCanvas.getContext('2d');
  if (ctx) {
    //fill canvas with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, diffCanvas.width, diffCanvas.height);

    ctx.drawImage(compareImg, 0, 0);
    const comapreImgData = ctx.getImageData(0, 0, diffCanvas.width, diffCanvas.height);
    grayscale(comapreImgData.data);
    // ctx.putImageData(comapreImgData, 0, 0);
    const compareImgPixelData = Array.from(comapreImgData.data);
    const compareMat = cv.matFromImageData(comapreImgData);
    ctx.clearRect(0, 0, diffCanvas.width, diffCanvas.height);

    // draw baseImg on top of compareImg because we will get the base64 from canvas
    ctx.drawImage(baseImg, 0, 0);
    const baseImgData = ctx.getImageData(0, 0, diffCanvas.width, diffCanvas.height);
    grayscale(baseImgData.data);
    ctx.putImageData(baseImgData, 0, 0);
    const baseMat = cv.matFromImageData(baseImgData);

    console.log(
      'image width: ' +
        baseMat.cols +
        '\n' +
        'image height: ' +
        baseMat.rows +
        '\n' +
        'image size: ' +
        baseMat.size().width +
        '*' +
        baseMat.size().height +
        '\n' +
        'image depth: ' +
        baseMat.depth() +
        '\n' +
        'image channels ' +
        baseMat.channels() +
        '\n' +
        'image type: ' +
        baseMat.type() +
        '\n'
    );

    const similartiy = ssim(baseImgData.data, comapreImgData.data, baseImg.width, baseImg.height);
    console.log('ssim is ', similartiy);
    // try {
    //   const orb = orbDistance(baseMat, compareMat);
    //   console.log('orb is ', orb);
    // } catch (e) {
    //   console.log('error calculating orb', e);
    // }
    try {
      // const mse = meanSquaredError(baseMat, compareMat);
      // console.log('mse is ', mse);

      const mse2 = meanSquaredError2(baseMat, compareMat);
      console.log('mse is ', mse2);
    } catch (e) {
      console.log('error calculating ormse', e);
    }
    try {
      const ssimcv = ssimOpenCV(baseMat, compareMat);
      console.log('ssimOpenCV is ', ssimcv);
    } catch (e) {
      console.log('error calculating ssimcv', e);
    }
    try {
      const nimSim = nmi(baseMat, compareMat, 100);
      console.log('nmiCV is ', nimSim);
    } catch (e) {
      console.log('error calculating nimSim', e);
    }

    // highlight added or removed content
    if (highlight === 'added') {
      console.log('highlight added');
      highlightDifference(ctx, baseImgData.data, compareImgPixelData, 1);
    } else if (highlight === 'removed') {
      console.log('highlight removed');
      highlightDifference(ctx, baseImgData.data, compareImgPixelData, 0);
    }

    ctx.putImageData(baseImgData, 0, 0);
    return diffCanvas.toDataURL();
  }
};
const grayscale = pixels => {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // pixels[i + 3] is alpha channel
    // preceived brightness formulas need linear RGB values, so calling sRGB2Lin
    const linGrey = 0.2126 * sRGB2Lin(r) + 0.7152 * sRGB2Lin(g) + 0.0772 * sRGB2Lin(b);
    const sRGBgrey = lin2sRGB(linGrey);
    pixels[i] = pixels[i + 1] = pixels[i + 2] = sRGBgrey;
  }
};

const highlightDifference = (ctx, baseImgData, compareImgData, channel) => {
  // iterate over base img (will be annotated, thus is the reference)
  for (let i = 0; i < baseImgData.length; i += 4) {
    // find pixels that are missing in the compared image
    if (baseImgData[i] !== 255 && compareImgData[i] === 255) {
      baseImgData[i] = baseImgData[i + 1] = baseImgData[i + 2] = 0;
      baseImgData[i + channel] = 255;
    }
  }
};

/**
 * Compute the mean structural similarity index between two images.
 */
function ssim(
  baseImgData: Uint8ClampedArray,
  compareImgData: Uint8ClampedArray,
  baseImgWidth: number,
  baseImgHeight: number
): number {
  console.time('ssim');
  const K1 = 0.01;
  const K2 = 0.03;
  const L = 255;
  const C1 = (K1 * L) ** 2;
  const C2 = (K2 * L) ** 2;
  const C3 = C2 / 2;

  // const compareImgWidth = compareImgData.length / (baseImgData.length / baseImgWidth);
  // const compareImgHeight = compareImgData.length / (baseImgData.length / baseImgHeight);

  // // Add padding to the smaller image
  // const padRight = baseImgWidth - compareImgWidth;
  // const padTop = baseImgHeight - compareImgHeight;
  // const paddedCompareImgData = new Uint8ClampedArray(baseImgData.length);

  // for (let y = 0; y < compareImgHeight; y++) {
  //   const baseImgOffset = (y + padTop) * baseImgWidth * 4;
  //   const compareImgOffset = y * compareImgWidth * 4;
  //   paddedCompareImgData.set(
  //     compareImgData.subarray(compareImgOffset, compareImgOffset + compareImgWidth * 4),
  //     baseImgOffset
  //   );
  //   for (let x = compareImgWidth; x < baseImgWidth; x++) {
  //     const paddedOffset = baseImgOffset + x * 4;
  //     paddedCompareImgData[paddedOffset] = 255;
  //     paddedCompareImgData[paddedOffset + 1] = 255;
  //     paddedCompareImgData[paddedOffset + 2] = 255;
  //     paddedCompareImgData[paddedOffset + 3] = 255;
  //   }
  // }
  // for (let y = 0; y < padTop; y++) {
  //   const baseImgOffset = y * baseImgWidth * 4;
  //   for (let x = 0; x < baseImgWidth; x++) {
  //     const paddedOffset = baseImgOffset + x * 4;
  //     paddedCompareImgData[paddedOffset] = 255;
  //     paddedCompareImgData[paddedOffset + 1] = 255;
  //     paddedCompareImgData[paddedOffset + 2] = 255;
  //     paddedCompareImgData[paddedOffset + 3] = 255;
  //   }
  // }

  const paddedCompareImgData = compareImgData;

  let sum = 0;
  let count = 0;

  for (let i = 0; i < baseImgData.length; i += 4) {
    const r1 = baseImgData[i];
    const g1 = baseImgData[i + 1];
    const b1 = baseImgData[i + 2];

    const r2 = paddedCompareImgData[i];
    const g2 = paddedCompareImgData[i + 1];
    const b2 = paddedCompareImgData[i + 2];

    const mu1 = (r1 + g1 + b1) / 3;
    const mu2 = (r2 + g2 + b2) / 3;
    const mu1mu2 = mu1 * mu2;
    const mu1sq = mu1 ** 2;
    const mu2sq = mu2 ** 2;

    const sigma1sq = (r1 - mu1) ** 2 + (g1 - mu1) ** 2 + (b1 - mu1) ** 2;
    const sigma2sq = (r2 - mu2) ** 2 + (g2 - mu2) ** 2 + (b2 - mu2) ** 2;
    const sigma12 = (r1 - mu1) * (r2 - mu2) + (g1 - mu1) * (g2 - mu2) + (b1 - mu1) * (b2 - mu2);

    const ssim = ((2 * mu1mu2 + C1) * (2 * sigma12 + C2)) / ((mu1sq + mu2sq + C1) * (sigma1sq + sigma2sq + C2));

    sum += ssim;
    count++;
  }

  console.timeEnd('ssim');
  return sum / count;
}

import cv from '@techstark/opencv-js';

function orbDistance(baseMat: cv.Mat, compareMat: cv.Mat) {
  console.time('orbDistance');

  // Create the ORB detector
  const orb = new cv.ORB(500);

  // Detect and compute the keypoints and descriptors for each image
  const baseKeypoints = orb.detect(baseMat);
  const baseDescriptors = orb.compute(baseMat, baseKeypoints);

  const compareKeypoints = orb.detect(compareMat);
  const compareDescriptors = orb.compute(compareMat, compareKeypoints);

  // Match the descriptors between the two images
  const matches = cv.matchBruteForce(baseDescriptors, compareDescriptors);

  // Compute the Euclidean distance between the matched keypoints
  let sum = 0;
  let count = 0;

  for (const match of matches) {
    const baseKeypoint = baseKeypoints[match.queryIdx];
    const compareKeypoint = compareKeypoints[match.trainIdx];

    const dx = baseKeypoint.pt.x - compareKeypoint.pt.x;
    const dy = baseKeypoint.pt.y - compareKeypoint.pt.y;

    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    sum += distance;
    count++;
  }

  console.timeEnd('orbDistance');
  return sum / count;
}
function canvasToMat(data: Uint8ClampedArray, width, height): cv.Mat {
  // Convert the canvas data to a Mat object
  const mat = new cv.Mat(height, width, cv.CV_64FCV_8UC4);
  mat.data.set(data);

  return mat;
}

function meanSquaredError(baseMat: cv.Mat, compareMat: cv.Mat) {
  console.time('mseDistance');

  // Compute the difference between the two images
  // const diffMat = baseMat.sub(compareMat);
  const diffMat = new cv.Mat();
  cv.subtract(baseMat, compareMat, diffMat, cv.CV_64F);

  // Compute the squared error for each pixel
  const squaredErrorMat = new cv.Mat();
  cv.multiply(diffMat, diffMat, squaredErrorMat);

  // Compute the mean squared error
  const mse = cv.mean(squaredErrorMat)[0];

  console.timeEnd('mseDistance');
  return mse;
}

// slower than JS implementation
function ssimOpenCV(baseMat: cv.Mat, compareMat: cv.Mat) {
  console.time('ssimOpenCV');
  const k1 = 0.01;
  const k2 = 0.03;

  const c1 = (k1 * 255) ** 2;
  const c2 = (k2 * 255) ** 2;

  const baseMean = cv.mean(baseMat);
  const compareMean = cv.mean(compareMat);

  const baseMatDouble = new cv.Mat();
  baseMat.convertTo(baseMatDouble, cv.CV_64F);
  const baseMeanStdDev = new cv.Mat();
  const baseStdDev = new cv.Mat();
  cv.meanStdDev(baseMatDouble, baseMeanStdDev, baseStdDev);

  const compareMatDouble = new cv.Mat();
  compareMat.convertTo(compareMatDouble, cv.CV_64F);
  const compareMeanStdDev = new cv.Mat();
  const compareStdDev = new cv.Mat();
  cv.meanStdDev(compareMatDouble, compareMeanStdDev, compareStdDev);

  const baseStdDevCalc = baseStdDev.doubleAt(0, 0);
  const compareStdDevCalc = compareStdDev.doubleAt(0, 0);

  const baseSub = new cv.Mat();
  // const diffMat = cv.subtract(baseMat, compareMat, dst, cv.CV_64F);
  cv.subtract(baseMatDouble, baseMeanStdDev, baseSub);

  const compareSub = new cv.Mat();
  cv.subtract(compareMatDouble, compareMeanStdDev, compareSub);

  const covarianceMat = new cv.Mat();
  cv.multiply(baseSub, compareSub, covarianceMat);
  const covarianceMean = cv.mean(covarianceMat);

  const ssim =
    ((2 * baseMean[0] * compareMean[0] + c1) * (2 * covarianceMean[0] + c2)) /
    ((baseMean[0] ** 2 + compareMean[0] ** 2 + c1) * (baseStdDevCalc ** 2 + compareStdDevCalc ** 2 + c2));

  console.timeEnd('ssimOpenCV');
  return ssim;
}

function meanSquaredError2(baseMat: cv.Mat, compareMat: cv.Mat): number {
  console.time('mseDistance2');
  const diff = new cv.Mat();
  cv.absdiff(baseMat, compareMat, diff);
  const squared = new cv.Mat();
  cv.multiply(diff, diff, squared);
  const mse = cv.mean(squared).reduce((sum, value) => sum + value, 0) / (baseMat.cols * baseMat.rows);
  diff.delete();
  squared.delete();
  console.timeEnd('mseDistance2');
  return mse;
}

function histogram(imageData: ImageData, numBins: number): number[] {
  const hist = new Array(numBins).fill(0);
  const numPixels = imageData.width * imageData.height;
  for (let i = 0; i < numPixels; i++) {
    const pixelIndex = i * 4;
    const r = imageData.data[pixelIndex];
    const g = imageData.data[pixelIndex + 1];
    const b = imageData.data[pixelIndex + 2];
    const intensity = Math.round((r + g + b) / 3);
    const binIndex = Math.floor((intensity * numBins) / 256);
    hist[binIndex]++;
  }
  return hist;
}

function entropy(hist: number[], total: number): number {
  let entropy = 0;
  for (let i = 0; i < hist.length; i++) {
    const p = hist[i] / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

function mutualInformation(baseHist: number[], compareHist: number[], total: number): number {
  let mutualInfo = 0;
  for (let i = 0; i < baseHist.length; i++) {
    for (let j = 0; j < compareHist.length; j++) {
      const p = (baseHist[i] * compareHist[j]) / total;
      if (p > 0) {
        const jointProb = p;
        mutualInfo += p * Math.log2(jointProb / (baseHist[i] * compareHist[j]));
      }
    }
  }
  return mutualInfo;
}

function nmi(baseImageData: ImageData, compareImageData: ImageData, numBins: number): number {
  const baseHist = histogram(baseImageData, numBins);
  const compareHist = histogram(compareImageData, numBins);
  const total = baseImageData.width * baseImageData.height;

  const baseEntropy = entropy(baseHist, total);
  const compareEntropy = entropy(compareHist, total);
  const mutualInfoValue = mutualInformation(baseHist, compareHist, total);
  const nmiValue = mutualInfoValue / Math.sqrt(baseEntropy * compareEntropy);

  return nmiValue;
}
