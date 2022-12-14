import cv2 
import mediapipe as mp 
import pdb
import numpy as np
import soundfile
import sounddevice
import sys

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_hands = mp.solutions.hands

wav_dir = "./sound-resources"
wav_files = [
  "80_Dm_MelodicHarp_SP_50_01.wav",
  "120_213_ArpG#m.wav",
  "120_Am_SynthChords_SP_51_03.wav",
  "120_F_PowerKeys_01_728.wav" ]

# -- read sound_data
sound_data_arr = []
for wav_file in wav_files:
  sound_data_arr.append(
    soundfile.read(wav_dir + "/" + wav_file)[0])

sounddevice.default.samplerate = 44100
sounddevice.default.channels = 2    # to be able record the audio

threshold_arr = np.array([0.1, 0.1, 0.1, 0.1])

# For webcam input:
cap = cv2.VideoCapture(0)

with mp_hands.Hands(
  model_complexity=1,
  min_detection_confidence=0.5,
  min_tracking_confidence=0.5) as hands:

  play_state = False
  while cap.isOpened():
    success, image = cap.read()
    if not success:
      print("Ignoring empty camera frame.")
      # if loading a video, use 'break' instead of 'continue'.
      continue

    # To improve performance, optionally mark the image as not writeable to 
    # pass by reference.
    image.flags.writeable = False
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image)

    #print(dir(results))
    #pdb.set_trace()

    # Draw the hand annotations on the image
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    if results.multi_hand_landmarks:
      for hand_landmarks in results.multi_hand_landmarks:
        mp_drawing.draw_landmarks(
          image, hand_landmarks,
          mp_hands.HAND_CONNECTIONS,
          mp_drawing_styles.get_default_hand_landmarks_style(),
          mp_drawing_styles.get_default_hand_connections_style())

        # print(f"-----")
        THUMB_TIP = hand_landmarks.landmark[4]
        INDEX_FINGER_TIP = hand_landmarks.landmark[8]
        MIDDLE_FINGER_TIP = hand_landmarks.landmark[12]
        RING_FINGER_TIP = hand_landmarks.landmark[16]
        PINKY_TIP = hand_landmarks.landmark[20]
        # print(f"hand_landmarks", THUMB_TIP) 
        # print(f"hand_landmarks", INDEX_FINGER_TIP)
        
        # pdb.set_trace()
        xy_THUMB_TIP = np.array([THUMB_TIP.x, THUMB_TIP.y])
        xy_NON_THUMB_TIP = np.array([
          [INDEX_FINGER_TIP.x, INDEX_FINGER_TIP.y], 
          [MIDDLE_FINGER_TIP.x, MIDDLE_FINGER_TIP.y],
          [RING_FINGER_TIP.x, RING_FINGER_TIP.y],
          [PINKY_TIP.x, PINKY_TIP.y]])
        euclid_dist = np.sqrt(np.sum((xy_THUMB_TIP - xy_NON_THUMB_TIP)**2, axis=1))

        # print(f"euclid_dist", euclid_dist)
        # print(f"iterator", iterator)

        bool_tip = euclid_dist < threshold_arr
        which_tip = np.argwhere(bool_tip)
        # sys.stdout.write("\r[x1, y1, z1] [x2, y2, z2]: [{:.5f}, {:.5f}, {:.5f}] [{:.5f}, {:.5f}, {:.5f}]".format(
        #   THUMB_TIP.x, THUMB_TIP.y, THUMB_TIP.z,
        #   INDEX_FINGER_TIP.x, INDEX_FINGER_TIP.y, INDEX_FINGER_TIP.z))
        idx_which_tip = 9 if len(which_tip) == 0 else which_tip[0][0]
        sys.stdout.write("\reuclid_dist: [{:.5f}, {:.5f}, {:.5f}, {:.5f}], {:d}".format(
          *euclid_dist, idx_which_tip))
        sys.stdout.flush()

        
        if idx_which_tip != 9 and bool_tip[idx_which_tip] and not play_state:
          sounddevice.play(sound_data_arr[idx_which_tip])
          play_state = True
        elif idx_which_tip == 9 and play_state:
          sounddevice.stop()
          play_state = False






    # Flip the image horizontally for a selfie-view display
    cv2.imshow("MediaPipe Holistic", cv2.flip(image, 1))
    if cv2.waitKey(5) & 0xFF == 27:
      break



  cap.release()
  print()
