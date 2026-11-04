import cv from '@techstark/opencv-js';

/**
 * OpenCV's module has a `then` that resolves to itself. A direct `await import()` of it makes bundler
 * interop copy that `then` onto the namespace and hang forever, so it is exported inside a plain box.
 */
export const box = { cv };
