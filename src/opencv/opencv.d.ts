declare module 'opencv-4.8.0.js' {
  interface Mat {
    // Define the properties and methods of the Mat class here
    delete: () => void;
  }

  // Define other classes and interfaces here

  // Define the cv object
  export const cv: {
    // Define the properties and methods of the cv object here
    imreadAsync: (src: string | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement) => Promise<Mat>;
    imshow: (winname: string, mat: Mat) => void;
    matFromImageData: (data: ImageData) => Mat;
    // Add other properties and methods here
  };
}