# Zoomable Images

The `img-zoom` class enables any image to open in a full-size overlay/lightbox, just like the gallery component.

## Usage

### 1. Include the gallery.css stylesheet

First, make sure your HTML page includes the gallery CSS file in the `<head>` section:

```html
<link rel="stylesheet" href="../../css/gallery.css">
```

### 2. Add the img-zoom class

Then, simply add the `img-zoom` class to any `<img>` element:

```html
<img class="img-zoom" src="path/to/image.png" alt="Image description">
```

### With optional caption

You can add a caption that will appear below the image in the lightbox using the `title` attribute or `data-caption` attribute:

```html
<!-- Using title attribute -->
<img class="img-zoom" src="chart.png" alt="Data chart" title="Monthly sales data">

<!-- Using data-caption attribute -->
<img class="img-zoom" src="diagram.png" alt="System diagram" data-caption="System architecture overview">
```

## Features

- **Click to zoom**: Click on any image with the `img-zoom` class to view it full-size
- **Keyboard accessible**: Press Enter or Space when the image is focused
- **Visual feedback**: Images show hover effects (opacity change and slight scale)
- **Easy to close**: 
  - Click the × button
  - Click outside the image
  - Press Escape key
- **Shared lightbox**: Uses the same lightbox as the gallery component for consistency

## Examples

The Ophidian language page demonstrates this with several linguistic charts that can be clicked to view in detail.

## Implementation Details

The feature is automatically initialized on page load via `main.js` and uses the existing gallery lightbox infrastructure for a consistent user experience across the site.
