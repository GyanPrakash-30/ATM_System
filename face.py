import cv2
import face_recognition
import os
import numpy as np
from datetime import datetime

# === CONFIGURATION ===
source_folder = 'abc'            # Folder with known faces
capture_folder = 'captures'      # Folder to save matched captures
threshold = 0.45                 # Face match threshold (lower = stricter)

# === SETUP ===
known_face_encodings = []
known_face_filenames = []
captured_filenames = set()

# Ensure capture folder exists
os.makedirs(capture_folder, exist_ok=True)

print(f"[INFO] Loading known faces from '{source_folder}'...")
for filename in os.listdir(source_folder):
    if filename.lower().endswith(('.jpg', '.png', '.jpeg')):
        path = os.path.join(source_folder, filename)
        image = face_recognition.load_image_file(path)
        encodings = face_recognition.face_encodings(image)
        if encodings:
            known_face_encodings.append(encodings[0])
            known_face_filenames.append(filename)
            print(f"[OK] Loaded: {filename}")
        else:
            print(f"[WARN] No face found in: {filename}")

print(f"[INFO] Total known faces: {len(known_face_encodings)}")

# === Start Webcam ===
video_capture = cv2.VideoCapture(0)
if not video_capture.isOpened():
    print("[ERROR] Cannot access webcam.")
    exit()

print("[INFO] Webcam started. Press 'q' to quit.")

while True:
    ret, frame = video_capture.read()
    if not ret:
        print("[ERROR] Failed to capture frame.")
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        label = "Unknown"
        color = (0, 0, 255)  # Red for unknown

        if known_face_encodings:
            distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            best_match_index = np.argmin(distances)
            if distances[best_match_index] < threshold:
                label = os.path.splitext(known_face_filenames[best_match_index])[0]  # remove .jpg
                color = (0, 255, 0)  # Green for known

                if label not in captured_filenames:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    face_crop = frame[top:bottom, left:right]
                    save_name = f"{label}_{timestamp}.jpg"
                    save_path = os.path.join(capture_folder, save_name)
                    cv2.imwrite(save_path, face_crop)
                    captured_filenames.add(label)
                    print(f"[CAPTURED] {label} saved to {save_path}")

        # Draw rectangle and label
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.putText(frame, label, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    cv2.imshow("Webcam Face Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("[INFO] Exiting.")
        break

video_capture.release()
cv2.destroyAllWindows()
