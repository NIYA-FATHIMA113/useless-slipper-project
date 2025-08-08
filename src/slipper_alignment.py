print("👟 Slipper Alignment System Starting...")

import cv2
import numpy as np

# Start webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Could not open webcam.")
    exit()

print("✅ Webcam opened successfully. Press Q to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Convert to HSV (better for color detection)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Define a slipper color range (example: light brown/beige slippers)
    lower_color = np.array([10, 50, 50])
    upper_color = np.array([30, 255, 255])

    # Create a mask
    mask = cv2.inRange(hsv, lower_color, upper_color)

    # Find contours of detected areas
    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 1000:  # Ignore small objects
            x, y, w, h = cv2.boundingRect(cnt)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, "Slipper Detected", (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.imshow("Slipper Alignment View", frame)
    cv2.imshow("Detection Mask", mask)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("👋 Program closed.")
