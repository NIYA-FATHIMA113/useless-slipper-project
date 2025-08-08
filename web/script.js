document.getElementById("imageUpload").addEventListener("change", function (e) {
    let file = e.target.files[0];
    if (!file) return;

    let img = new Image();
    img.onload = function () {
        processImage(img);
    };
    img.src = URL.createObjectURL(file);
});

function processImage(img) {
    let canvas = document.getElementById("canvasOutput");
    let ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Blur to reduce noise
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

    // Edge detection
    let edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150);

    // Find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let angles = [];
    for (let i = 0; i < contours.size(); i++) {
        let rect = cv.minAreaRect(contours.get(i));
        let angle = rect.angle;
        if (angle < -45) angle += 90; // normalize
        if (rect.size.width > 50 && rect.size.height > 50) { // filter small
            angles.push(angle);
        }
    }

    // Display result
    let resultDiv = document.getElementById("result");
    if (angles.length >= 2) {
        let diff = Math.abs(angles[0] - angles[1]);
        if (diff <= 10) {
            resultDiv.textContent = "✅ Slippers are aligned!";
            resultDiv.className = "aligned";
        } else {
            resultDiv.textContent = "❌ Slippers are misaligned!";
            resultDiv.className = "misaligned";
        }
    } else {
        resultDiv.textContent = "⚠ Could not detect two slippers.";
        resultDiv.className = "";
    }

    src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
}
