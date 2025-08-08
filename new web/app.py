from flask import Flask, render_template, request
import cv2
import numpy as np
import math
import os

app = Flask(__name__)
UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def detect_slipper_angle(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    angles = []

    for cnt in contours:
        if cv2.contourArea(cnt) > 1000:  # ignore small noise
            rect = cv2.minAreaRect(cnt)
            angle = rect[-1]
            if angle < -45:
                angle = 90 + angle
            angles.append(angle)

    if len(angles) >= 2:
        diff = abs(angles[0] - angles[1])
        return "Aligned" if diff < 5 else "Misaligned"
    return "Not enough slippers detected"

@app.route('/', methods=['GET', 'POST'])
def index():
    result = None
    image_url = None
    if request.method == 'POST':
        file = request.files['image']
        if file:
            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)
            result = detect_slipper_angle(filepath)
            image_url = filepath
    return render_template('index.html', result=result, image_url=image_url)

if __name__ == '__main__':
    app.run(debug=True)
