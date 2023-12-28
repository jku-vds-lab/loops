import React, { useEffect, useRef, useState } from 'react';
import { CodeCellProvenance } from '../Provenance/JupyterListener';
import { IDiffProps, useStyles, IDiffDetailProps } from './DiffDetail';
import { addDifferenceHighlight } from './Image/OpenCV-ImgDiff';

export const ImgDetailDiff = ({ newCell, oldCell }: IDiffProps) => {
  const { classes, cx } = useStyles();
  const leftHeader = useRef<HTMLDivElement>(null);

  const [diffMode, setDiffMode] = useState('unified');
  const handleDiffModeChange = event => {
    setDiffMode(event.target.value);
  };

  const [showChanges, setHighlightChanges] = React.useState(true);
  const [showGreyscale, setShowGreyscale] = React.useState(true);
  const handleHighlightChangesChange = () => {
    setHighlightChanges(!showChanges);
  };
  const handleGreyscaleChange = () => {
    setShowGreyscale(!showGreyscale);
  };

  const [init, setInit] = React.useState(true);

  const [oldBase64, setOldBase64] = useState(prepareBase64(oldCell));
  const [newBase64, setNewBase64] = useState(prepareBase64(newCell));

  const [additions, setAdditions] = useState<number | undefined>(undefined);
  const [deletions, setDeletions] = useState<number | undefined>(undefined);
  const [pixelSimilartiy, setPixelSimilartiy] = useState<number | undefined>(undefined);

  const [transparency, setTransparency] = useState(0.5);

  const handleTransparencyChange = event => {
    setTransparency(parseFloat(event.target.value));
  };

  useEffect(() => {
    const addDiffs = async () => {
      if (showChanges) {
        const addedBase64 = await addDifferenceHighlight(
          prepareBase64(oldCell),
          prepareBase64(newCell),
          {
            r: 102,
            g: 194,
            b: 165
          },
          3,
          false,
          showGreyscale
        );
        if (addedBase64) {
          setNewBase64(addedBase64.img);
        }
        setAdditions(addedBase64?.changes);
        let similarity = 1 - (1 - (addedBase64?.pixelSimilartiy ?? 1));

        const removedBase64 = await addDifferenceHighlight(
          prepareBase64(newCell),
          prepareBase64(oldCell),
          {
            r: 240,
            g: 82,
            b: 104
          },
          3,
          false,
          showGreyscale
        );
        if (removedBase64) {
          setOldBase64(removedBase64.img);
        }
        setDeletions(removedBase64?.changes);
        similarity -= 1 - (removedBase64?.pixelSimilartiy ?? 1);

        setPixelSimilartiy(similarity);
        if (init) {
          setInit(false);
          setDiffMode(similarity < 0.9 ? 'side-by-side' : 'unified');
          setHighlightChanges(similarity >= 0.75);
        }
      } else {
        setOldBase64(prepareBase64(oldCell));
        setNewBase64(prepareBase64(newCell));
      }
    };

    addDiffs().catch(() => {
      setHighlightChanges(false);
    });
  }, [showChanges, showGreyscale]);

  function getSidebySideDiff(): React.ReactNode {
    return (
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%',
            borderRight: 'var(--jp-border-width) solid var(--jp-toolbar-border-color)',
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'end'
          }}
        >
          <img
            src={oldBase64}
            style={{ maxWidth: '100%', maxHeight: '100%', height: '200%', width: '200%', objectFit: 'contain' }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '50%',
            height: '100%'
          }}
        >
          <img
            src={newBase64}
            style={{ maxWidth: '100%', maxHeight: '100%', height: '200%', width: '200%', objectFit: 'contain' }}
          />
        </div>
      </div>
    );
  }

  function getUnifiedDiff(): React.ReactNode {
    // layer image of oldBase64 and newBase64 on top of each other and add a slider to adapt their opacity and fade from one to the other
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <label>
          Old:&nbsp;
          <input
            type="range"
            value={transparency}
            min="0"
            max="1"
            step="0.25"
            id="transparency"
            onChange={handleTransparencyChange}
          />
          &nbsp;New
        </label>
        <div style={{ position: 'relative', width: '80%', flexGrow: 1, flexShrink: 1 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              width: '80%',
              height: '100%'
            }}
          >
            <img
              src={oldBase64}
              style={{ maxWidth: '100%', maxHeight: '100%', height: '200%', width: '200%', objectFit: 'contain' }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              width: '80%',
              height: '100%'
            }}
          >
            <img
              src={newBase64}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                height: '200%',
                width: '200%',
                objectFit: 'contain',
                opacity: transparency
              }}
            />
          </div>
          {/* <img src={oldBase64} style={{ height: '100%' }} />
          <img
            src={newBase64}
            style={{ height: '100%', position: 'absolute', bottom: 0, left: 0, opacity: transparency }}
          /> */}
        </div>
      </div>
    );
  }

  return (
    <div className={cx(classes.diffDetail)}>
      <div className={cx(classes.monacoOptions)}>
        <header>Image Diff View</header>
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
        <label>
          <input
            type="checkbox"
            checked={showGreyscale}
            disabled={!showChanges}
            onChange={handleGreyscaleChange}
            style={{ marginBottom: '1em' }}
          />
          Convert to Greyscale
        </label>
        {pixelSimilartiy !== undefined ? (
          <span style={{ fontWeight: 600, marginBottom: '1em' }}>
            Pixel Similartiy:{' '}
            {pixelSimilartiy.toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 1 })}
          </span>
        ) : (
          <> </>
        )}
        {
          //if addtions and deletions are defined, show them
          // else show nothing
          additions !== undefined && deletions !== undefined ? (
            <>
              <span style={{ fontWeight: 600 }}>Regions Added: {additions}</span>
              <span style={{ fontWeight: 600 }}>Regions Removed: {deletions}</span>
            </>
          ) : (
            <> </>
          )
        }
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

// /**
//  *
//  * @param color ranging from 0-255
//  */
// function sRGB2Lin(color: number) {
//   const normalized = color / 255;
//   if (normalized <= 0.04045) {
//     return normalized / 12.92;
//   } else {
//     return Math.pow((normalized + 0.055) / 1.055, 2.4);
//   }
// }
// function lin2sRGB(linGrey: number) {
//   if (linGrey <= 0.0031308) {
//     return linGrey * 12.92 * 255;
//   } else {
//     return (1.055 * Math.pow(linGrey, 1 / 2.4) - 0.055) * 255;
//   }
// }

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
// const addDifference = async (oldBase64, newBase64, highlight) => {
//   // if removed old is basis and what was removed is highlighted on it in red
//   // if added, new is the bassis and what was added is highlighted in green
//   // i.e., as for code
//   const [base, compare] = highlight === 'removed' ? [oldBase64, newBase64] : [newBase64, oldBase64];

//   const baseImg = new Image();
//   baseImg.src = base;
//   await baseImg.decode();

//   const compareImg = new Image();
//   compareImg.src = compare;
//   await compareImg.decode();

//   const diffCanvas = document.createElement('canvas');
//   // canvas size based on base image, as this is the what is displayed (+ highlights from the compareImg)
//   diffCanvas.width = baseImg.width;
//   diffCanvas.height = baseImg.height;

//   const ctx = diffCanvas.getContext('2d');
//   if (ctx) {
//     //fill canvas with white
//     ctx.fillStyle = 'white';
//     ctx.fillRect(0, 0, diffCanvas.width, diffCanvas.height);

//     ctx.drawImage(compareImg, 0, 0);
//     const comapreImgData = ctx.getImageData(0, 0, diffCanvas.width, diffCanvas.height);
//     grayscale(comapreImgData.data);
//     // ctx.putImageData(comapreImgData, 0, 0);
//     const compareImgPixelData = Array.from(comapreImgData.data);
//     // const compareMat = cv.matFromImageData(comapreImgData);
//     ctx.clearRect(0, 0, diffCanvas.width, diffCanvas.height);

//     // draw baseImg on top of compareImg because we will get the base64 from canvas
//     ctx.drawImage(baseImg, 0, 0);
//     const baseImgData = ctx.getImageData(0, 0, diffCanvas.width, diffCanvas.height);
//     grayscale(baseImgData.data);
//     ctx.putImageData(baseImgData, 0, 0);
//     // const baseMat = cv.matFromImageData(baseImgData);

//     const similartiy = ssim(baseImgData.data, compareImgPixelData, baseImg.width, baseImg.height);
//     console.log('ssim is ', similartiy);
//     // try {
//     //   const orb = orbDistance(baseMat, compareMat);
//     //   console.log('orb is ', orb);
//     // } catch (e) {
//     //   console.log('error calculating orb', e);
//     // }
//     try {
//       const mse = meanSquaredError(baseImgData.data, compareImgPixelData);
//       console.log('mse is ', mse);
//       // const mse2 = meanSquaredError2(baseMat, compareMat);
//       // console.log('mse is ', mse2);
//     } catch (e) {
//       console.log('error calculating ormse', e);
//     }
//     try {
//       const nimSim = nmi(baseImgData.data, compareImgPixelData, 100);
//       console.log('nmiCV is ', nimSim);
//     } catch (e) {
//       console.log('error calculating nimSim', e);
//     }

//     // highlight added or removed content
//     if (highlight === 'added') {
//       console.log('highlight added');
//       highlightDifference(ctx, baseImgData.data, compareImgPixelData, 1);
//     } else if (highlight === 'removed') {
//       console.log('highlight removed');
//       highlightDifference(ctx, baseImgData.data, compareImgPixelData, 0);
//     }

//     ctx.putImageData(baseImgData, 0, 0);
//     return diffCanvas.toDataURL();
//   }
// };
// const grayscale = pixels => {
//   for (let i = 0; i < pixels.length; i += 4) {
//     const r = pixels[i];
//     const g = pixels[i + 1];
//     const b = pixels[i + 2];
//     // pixels[i + 3] is alpha channel
//     // preceived brightness formulas need linear RGB values, so calling sRGB2Lin
//     // see https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color
//     // and https://gist.github.com/mnpenner/70ab4f0836bbee548c71947021f93607
//     const linGrey = 0.2126 * sRGB2Lin(r) + 0.7152 * sRGB2Lin(g) + 0.0772 * sRGB2Lin(b);
//     const sRGBgrey = lin2sRGB(linGrey);
//     pixels[i] = pixels[i + 1] = pixels[i + 2] = sRGBgrey;
//   }
// };

// const highlightDifference = (ctx, baseImgData, compareImgData, channel) => {
//   // iterate over base img (will be annotated, thus is the reference)
//   for (let i = 0; i < baseImgData.length; i += 4) {
//     // find pixels that are missing in the compared image
//     if (baseImgData[i] !== 255 && compareImgData[i] === 255) {
//       baseImgData[i] = baseImgData[i + 1] = baseImgData[i + 2] = 0;
//       baseImgData[i + channel] = 255;
//     }
//   }
// };

/**
 * Compute the mean structural similarity index between two images.
 */
function ssim(
  baseImgData: Uint8ClampedArray | number[],
  compareImgData: Uint8ClampedArray | number[],
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

  let sum = 0;
  let count = 0;

  for (let i = 0; i < baseImgData.length; i += 4) {
    const r1 = baseImgData[i];
    const g1 = baseImgData[i + 1];
    const b1 = baseImgData[i + 2];

    const r2 = compareImgData[i];
    const g2 = compareImgData[i + 1];
    const b2 = compareImgData[i + 2];

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

function histogram(imageData: Uint8ClampedArray | number[], numBins: number): number[] {
  const hist = new Array(numBins).fill(0);
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
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

function nmi(
  baseImageData: Uint8ClampedArray | number[],
  compareImageData: Uint8ClampedArray | number[],
  numBins: number
): number {
  const baseHist = histogram(baseImageData, numBins);
  const compareHist = histogram(compareImageData, numBins);

  const baseEntropy = entropy(baseHist, baseImageData.length);
  const compareEntropy = entropy(compareHist, baseImageData.length);
  const mutualInfoValue = mutualInformation(baseHist, compareHist, baseImageData.length);
  const nmiValue = mutualInfoValue / Math.sqrt(baseEntropy * compareEntropy);

  return nmiValue;
}

function meanSquaredError(
  baseImageData: Uint8ClampedArray | number[],
  compareImageData: Uint8ClampedArray | number[]
): number {
  let sumSquaredError = 0;
  for (let i = 0; i < baseImageData.length; i += 4) {
    const baseR = baseImageData[i];
    const baseG = baseImageData[i + 1];
    const baseB = baseImageData[i + 2];
    const compareR = compareImageData[i];
    const compareG = compareImageData[i + 1];
    const compareB = compareImageData[i + 2];
    const squaredError = Math.pow(baseR - compareR, 2) + Math.pow(baseG - compareG, 2) + Math.pow(baseB - compareB, 2);
    sumSquaredError += squaredError;
  }
  const mse = sumSquaredError / baseImageData.length;
  return mse;
}

export function hasImage(output: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(output, 'text/html');
  // dataframe HTML output contains a table classed "dataframe"
  const img = doc.querySelector('img');
  return img !== null;
}

export function createUnifedDiff(html, referenceHTML): HTMLDivElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const referenceDoc = parser.parseFromString(referenceHTML, 'text/html');

  const img = doc.querySelector('img');
  const referenceImg = referenceDoc.querySelector('img');

  if (!img || !referenceImg) {
    // return empty html element
    return document.createElement('div');
  }
  const imgBase64 = img.src;
  const referenceImgBase64 = referenceImg.src;

  const addedBase64 = addDifferenceHighlight(
    imgBase64,
    referenceImgBase64,
    {
      r: 102,
      g: 194,
      b: 165
    },
    9,
    false,
    true,
    true
  );

  if (!addedBase64) {
    // return empty html element
    return document.createElement('div');
  }

  //create image with base64 src
  const imgElement = document.createElement('img');
  imgElement.src = addedBase64.img;
  imgElement.style.width = '100%';
  return imgElement;
}
