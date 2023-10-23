// import * as cv from '@techstark/opencv-js';

// function orbDistance(baseMat: cv.Mat, compareMat: cv.Mat) {
//   console.time('orbDistance');

//   // Create the ORB detector
//   const orb = new cv.ORB(500);

//   // Detect and compute the keypoints and descriptors for each image
//   const baseKeypoints = orb.detect(baseMat);
//   const baseDescriptors = orb.compute(baseMat, baseKeypoints);

//   const compareKeypoints = orb.detect(compareMat);
//   const compareDescriptors = orb.compute(compareMat, compareKeypoints);

//   // Match the descriptors between the two images
//   const matches = cv.matchBruteForce(baseDescriptors, compareDescriptors);

//   // Compute the Euclidean distance between the matched keypoints
//   let sum = 0;
//   let count = 0;

//   for (const match of matches) {
//     const baseKeypoint = baseKeypoints[match.queryIdx];
//     const compareKeypoint = compareKeypoints[match.trainIdx];

//     const dx = baseKeypoint.pt.x - compareKeypoint.pt.x;
//     const dy = baseKeypoint.pt.y - compareKeypoint.pt.y;

//     const distance = Math.sqrt(dx ** 2 + dy ** 2);

//     sum += distance;
//     count++;
//   }

//   console.timeEnd('orbDistance');
//   return sum / count;
// }

// function canvasToMat(data: Uint8ClampedArray, width, height): cv.Mat {
//   // Convert the canvas data to a Mat object
//   const mat = new cv.Mat(height, width, cv.CV_64FCV_8UC4);
//   mat.data.set(data);

//   return mat;
// }

// // slower than JS implementation
// export function ssimOpenCV(baseMat: cv.Mat, compareMat: cv.Mat) {
//   console.time('ssimOpenCV');
//   const k1 = 0.01;
//   const k2 = 0.03;

//   const c1 = (k1 * 255) ** 2;
//   const c2 = (k2 * 255) ** 2;

//   const baseMean = cv.mean(baseMat);
//   const compareMean = cv.mean(compareMat);

//   const baseMatDouble = new cv.Mat();
//   baseMat.convertTo(baseMatDouble, cv.CV_64F);
//   const baseMeanStdDev = new cv.Mat();
//   const baseStdDev = new cv.Mat();
//   cv.meanStdDev(baseMatDouble, baseMeanStdDev, baseStdDev);

//   const compareMatDouble = new cv.Mat();
//   compareMat.convertTo(compareMatDouble, cv.CV_64F);
//   const compareMeanStdDev = new cv.Mat();
//   const compareStdDev = new cv.Mat();
//   cv.meanStdDev(compareMatDouble, compareMeanStdDev, compareStdDev);

//   const baseStdDevCalc = baseStdDev.doubleAt(0, 0);
//   const compareStdDevCalc = compareStdDev.doubleAt(0, 0);

//   const baseSub = new cv.Mat();
//   // const diffMat = cv.subtract(baseMat, compareMat, dst, cv.CV_64F);
//   cv.subtract(baseMatDouble, baseMeanStdDev, baseSub);

//   const compareSub = new cv.Mat();
//   cv.subtract(compareMatDouble, compareMeanStdDev, compareSub);

//   const covarianceMat = new cv.Mat();
//   cv.multiply(baseSub, compareSub, covarianceMat);
//   const covarianceMean = cv.mean(covarianceMat);

//   const ssim =
//     ((2 * baseMean[0] * compareMean[0] + c1) * (2 * covarianceMean[0] + c2)) /
//     ((baseMean[0] ** 2 + compareMean[0] ** 2 + c1) * (baseStdDevCalc ** 2 + compareStdDevCalc ** 2 + c2));

//   console.timeEnd('ssimOpenCV');
//   return ssim;
// }

// export function meanSquaredError2(baseMat: cv.Mat, compareMat: cv.Mat): number {
//   console.time('mseDistance2');
//   const diff = new cv.Mat();
//   cv.absdiff(baseMat, compareMat, diff);
//   const squared = new cv.Mat();
//   cv.multiply(diff, diff, squared);
//   const mse = cv.mean(squared).reduce((sum, value) => sum + value, 0) / (baseMat.cols * baseMat.rows);
//   diff.delete();
//   squared.delete();
//   console.timeEnd('mseDistance2');
//   return mse;
// }
