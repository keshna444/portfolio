import cv2
import mediapipe as mp
import pyautogui
import time
import math
from util import get_distance

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

screen_w, screen_h = pyautogui.size()
pyautogui.FAILSAFE = False

prev_screen_x = 0
prev_screen_y = 0
smoothening = 5

cap = cv2.VideoCapture(0)

pinch_active = False
right_pinch_active = False
pending_single_click_time = None
double_click_window = 0.5

scroll_mode = False
scroll_anchor_y = None

status_text = ""
status_until = 0

if not cap.isOpened():
    print("Camera 0 did not open.")
    exit()

while True:
    ret, frame = cap.read()

    if not ret:
        print("Could not read frame.")
        break

    frame = cv2.flip(frame, 1)
    frame_h, frame_w, _ = frame.shape

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    now = time.time()

    if pending_single_click_time is not None:
        if now - pending_single_click_time > double_click_window:
            pyautogui.click()
            pending_single_click_time = None
            status_text = "SINGLE CLICK"
            status_until = now + 0.6

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS
            )

            thumb_tip = hand_landmarks.landmark[4]
            index_tip = hand_landmarks.landmark[8]
            middle_tip = hand_landmarks.landmark[12]

            fingers = [
                1 if hand_landmarks.landmark[tip].y < hand_landmarks.landmark[tip - 2].y else 0
                for tip in [8, 12, 16, 20]
            ]

            index_x = int(index_tip.x * frame_w)
            index_y = int(index_tip.y * frame_h)
            middle_x = int(middle_tip.x * frame_w)
            middle_y = int(middle_tip.y * frame_h)
            thumb_x = int(thumb_tip.x * frame_w)
            thumb_y = int(thumb_tip.y * frame_h)

            screen_x = screen_w / frame_w * index_x
            screen_y = screen_h / frame_h * index_y

            curr_screen_x = prev_screen_x + (screen_x - prev_screen_x) / smoothening
            curr_screen_y = prev_screen_y + (screen_y - prev_screen_y) / smoothening

            thumb_index_distance = get_distance([
                (thumb_tip.x, thumb_tip.y),
                (index_tip.x, index_tip.y)
            ])

            thumb_middle_distance = get_distance([
                (thumb_tip.x, thumb_tip.y),
                (middle_tip.x, middle_tip.y)
            ])

            if fingers[0] == 1 and fingers[1] == 0 and not pinch_active and not scroll_mode:
                pyautogui.moveTo(curr_screen_x, curr_screen_y)

            prev_screen_x = curr_screen_x
            prev_screen_y = curr_screen_y

            if fingers[0] == 1 and fingers[1] == 0:
                if thumb_index_distance is not None and thumb_index_distance < 40:
                    if not pinch_active:
                        if pending_single_click_time is not None and (now - pending_single_click_time) <= double_click_window:
                            pyautogui.doubleClick()
                            pending_single_click_time = None
                            status_text = "DOUBLE CLICK"
                            status_until = now + 0.6
                        else:
                            pending_single_click_time = now
                        pinch_active = True
                else:
                    pinch_active = False
            else:
                pinch_active = False

            if fingers[0] == 1 and fingers[1] == 1:
                if thumb_middle_distance is not None and thumb_middle_distance < 40:
                    if not right_pinch_active:
                        pyautogui.rightClick()
                        status_text = "RIGHT CLICK"
                        status_until = now + 0.6
                        right_pinch_active = True
                else:
                    right_pinch_active = False
            else:
                right_pinch_active = False

            if fingers[0] == 1 and fingers[1] == 1 and (thumb_middle_distance is None or thumb_middle_distance >= 40):
                midpoint_y = (index_y + middle_y) // 2

                if not scroll_mode:
                    scroll_mode = True
                    scroll_anchor_y = midpoint_y
                else:
                    dy = midpoint_y - scroll_anchor_y

                    if abs(dy) > 15:
                        pyautogui.scroll(-int(dy * 2))
                        scroll_anchor_y = midpoint_y
                        status_text = "SCROLL"
                        status_until = now + 0.2
            else:
                scroll_mode = False
                scroll_anchor_y = None

            pixel_distance = math.hypot(index_x - thumb_x, index_y - thumb_y)

            cv2.circle(frame, (thumb_x, thumb_y), 10, (0, 255, 255), cv2.FILLED)
            cv2.circle(frame, (index_x, index_y), 10, (255, 0, 255), cv2.FILLED)
            cv2.circle(frame, (middle_x, middle_y), 10, (255, 255, 0), cv2.FILLED)

            cv2.line(frame, (thumb_x, thumb_y), (index_x, index_y), (0, 255, 0), 2)
            cv2.line(frame, (thumb_x, thumb_y), (middle_x, middle_y), (255, 0, 0), 2)

            cv2.putText(
                frame,
                f"Fingers: {fingers}",
                (20, 100),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2
            )

            cv2.putText(
                frame,
                f"Pinch: {int(pixel_distance)}",
                (20, 135),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2
            )

    if now < status_until:
        cv2.putText(
            frame,
            status_text,
            (20, 60),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

    cv2.imshow("Live Video", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
hands.close()
cv2.destroyAllWindows()