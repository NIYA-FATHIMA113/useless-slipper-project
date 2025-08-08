import cv2
import numpy as np
import tkinter as tk
from tkinter import filedialog, messagebox

# --- SETTINGS ---
ANGLE_THRESHOLD = 15  # degrees allowed before alert

# --- Functions ---
def detect_slipper_angle(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    edges = cv2.Canny(blur, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    # Pick largest contour (slipper)
    c = max(contours, key=cv2.contourArea)
    rect = cv2.minAreaRect(c)
    angle = rect[2]

    # Fix OpenCV's weird angle range
    if angle < -45:
        angle = 90 + angle

    return angle

def upload_image():
    file_path = filedialog.askopenfilename(filetypes=[("Image files", "*.jpg *.png *.jpeg")])
    if not file_path:
        return
    
    angle = detect_slipper_angle(file_path)
    if angle is None:
        messagebox.showerror("Error", "No slipper detected!")
        return
    
    if abs(angle) > ANGLE_THRESHOLD:
        messagebox.showwarning("Misaligned", f"⚠ Slipper angle: {angle:.2f}°\nPlease fix it!")
    else:
        messagebox.showinfo("Aligned", f"✅ Slipper is aligned!\nAngle: {angle:.2f}°")

# --- GUI ---
root = tk.Tk()
root.title("Useless Slipper Project")

label = tk.Label(root, text="Upload your slipper photo to check alignment", font=("Arial", 12))
label.pack(pady=10)

upload_btn = tk.Button(root, text="Upload Image", command=upload_image, font=("Arial", 12))
upload_btn.pack(pady=10)

root.mainloop()
