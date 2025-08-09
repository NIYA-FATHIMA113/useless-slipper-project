const imageUpload = document.getElementById('imageUpload');
const canvas = document.getElementById('canvasOutput');
const ctx = canvas.getContext('2d');
const resultDiv = document.getElementById('result');

imageUpload.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      // Set canvas size and draw image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Process image with OpenCV after short delay (to ensure OpenCV loaded)
      setTimeout(() => processImage(), 100);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function processImage() {
  // Load image from canvas into OpenCV Mat
  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let thresh = new cv.Mat();

  // Convert to grayscale
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // Threshold to binary image (adjust threshold as needed)
  cv.threshold(gray, thresh, 120, 255, cv.THRESH_BINARY_INV);

  // Find contours
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // Filter contours by area and sort descending
  let slipperContours = [];
  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);
    if (area > 1000) { // filter noise, tweak 1000 if needed
      slipperContours.push(cnt);
    } else {
      cnt.delete();
    }
  }

  if (slipperContours.length < 2) {
    resultDiv.textContent = "Could not detect two slippers. Try a clearer image.";
    resultDiv.className = "result misaligned";
    cleanup(src, gray, thresh, contours, hierarchy, slipperContours);
    return;
  }

  // Sort contours by area descending
  slipperContours.sort((a, b) => cv.contourArea(b) - cv.contourArea(a));

  // Get minAreaRect for the two biggest contours (the slippers)
  let rect1 = cv.minAreaRect(slipperContours[0]);
  let rect2 = cv.minAreaRect(slipperContours[1]);

  // rect.angle can be tricky: usually angle in [-90, 0)
  // We normalize angle to 0-180 degrees for comparison
  let angle1 = normalizeAngle(rect1.angle);
  let angle2 = normalizeAngle(rect2.angle);

  // Draw rectangles on image for visualization
  drawRotatedRect(src, rect1);
  drawRotatedRect(src, rect2);
  cv.imshow(canvas, src);

  // Check alignment
  checkSlipperAlignment(angle1, angle2);

  // Cleanup
  cleanup(src, gray, thresh, contours, hierarchy, slipperContours);
}

function normalizeAngle(angle) {
  // OpenCV's minAreaRect angle can be between -90 and 0
  // Convert negative angles to positive 0-180 range
  if (angle < -45) {
    return angle + 90;
  } else {
    return angle;
  }
}

function drawRotatedRect(mat, rect) {
  let points = cv.RotatedRect.points(rect);
  for (let i = 0; i < 4; i++) {
    cv.line(mat, points[i], points[(i+1)%4], [255, 0, 0, 255], 2);
  }
}

function checkSlipperAlignment(angle1, angle2) {
  const diff = Math.abs(angle1 - angle2);

  if (diff <= 10) {
    resultDiv.textContent = `Slippers aligned perfectly! (Angle difference: ${diff.toFixed(1)}°)`;
    resultDiv.className = "result aligned";
  } else {
    resultDiv.textContent = `Slippers are disaligned! (Angle difference: ${diff.toFixed(1)}°)`;
    resultDiv.className = "result misaligned";
  }
}

function cleanup(src, gray, thresh, contours, hierarchy, slipperContours) {
  src.delete();
  gray.delete();
  thresh.delete();
  contours.delete();
  hierarchy.delete();
  slipperContours.forEach(cnt => cnt.delete());
}
