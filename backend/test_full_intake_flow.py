import socket
_orig = socket.getaddrinfo
socket.getaddrinfo = lambda h, p, f=0, t=0, pr=0, fl=0: _orig(h, p, socket.AF_INET, t, pr, fl)

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import urllib.request, json, time

API_URL = "http://127.0.0.1:8000/api/v1/ai/conversational-intake"

def safe_print(label, text):
    try:
        sys.stdout.buffer.write(f"{label}: {text}\n".encode("utf-8"))
    except Exception:
        print(f"{label}: [Encoded Text]")

def send_turn(turn, user_msg, history):
    payload = {
        "patient_name": "Ramesh Kumar",
        "age": 45,
        "gender": "Male",
        "language": "hi",
        "history": history,
        "user_message": user_msg,
        "turn_count": turn,
        "synthesize_audio": True
    }
    t0 = time.time()
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        res = json.loads(resp.read().decode("utf-8"))
    dt = time.time() - t0
    return res, dt

print("=================================================================")
print("TESTING FULL CONVERSATIONAL INTAKE: SARVAM-105B + MEDICAL RAG")
print("=================================================================")

history = []

# Turn 1: Chief Complaint
print("\n--- TURN 1: Chief Complaint ---")
user_msg_1 = "दो दिन से बहुत तेज बुखार और ठंड लग रही है"
safe_print("Patient speaks", user_msg_1)
res1, dt1 = send_turn(1, user_msg_1, history)
print(f"Roundtrip Latency: {dt1:.2f}s | LLM Provider: {res1.get('llm_provider')}")
safe_print("Medical RAG Guideline", res1.get('rag_guideline'))
safe_print("AI Spoken Hindi", res1.get('spoken_reply'))
safe_print("AI English", res1.get('assistant_reply_en'))
print(f"Voice Provider: {res1.get('voice_provider')} | Audio bytes len: {len(res1.get('audio_base64', ''))}")
print(f"Is Priority: {res1.get('is_priority')} | Is Complete: {res1.get('is_intake_complete')}")

history.append({"role": "user", "speaker": "patient", "content": user_msg_1})
history.append({"role": "assistant", "speaker": "assistant", "content": res1.get('spoken_reply')})

# Turn 2: Symptom details
print("\n--- TURN 2: Symptom details ---")
user_msg_2 = "बुखार 102 डिग्री तक चला जाता है और बदन में दर्द रहता है"
safe_print("Patient speaks", user_msg_2)
res2, dt2 = send_turn(2, user_msg_2, history)
print(f"Roundtrip Latency: {dt2:.2f}s | LLM Provider: {res2.get('llm_provider')}")
safe_print("Medical RAG Guideline", res2.get('rag_guideline'))
safe_print("AI Spoken Hindi", res2.get('spoken_reply'))
safe_print("AI English", res2.get('assistant_reply_en'))
print(f"Voice Provider: {res2.get('voice_provider')}")
print(f"Is Priority: {res2.get('is_priority')} | Is Complete: {res2.get('is_intake_complete')}")

history.append({"role": "user", "speaker": "patient", "content": user_msg_2})
history.append({"role": "assistant", "speaker": "assistant", "content": res2.get('spoken_reply')})

# Turn 3: Concluding medications/allergies
print("\n--- TURN 3: Concluding Intake ---")
user_msg_3 = "मैं कोई नियमित दवा नहीं लेता और मुझे किसी दवा से कोई एलर्जी नहीं है"
safe_print("Patient speaks", user_msg_3)
res3, dt3 = send_turn(3, user_msg_3, history)
print(f"Roundtrip Latency: {dt3:.2f}s | LLM Provider: {res3.get('llm_provider')}")
safe_print("Medical RAG Guideline", res3.get('rag_guideline'))
safe_print("AI Spoken Hindi", res3.get('spoken_reply'))
safe_print("AI English", res3.get('assistant_reply_en'))
print(f"Voice Provider: {res3.get('voice_provider')}")
print(f"Is Priority: {res3.get('is_priority')} | Is Complete: {res3.get('is_intake_complete')}")

print("\n=================================================================")
print(f"AVERAGE LATENCY PER TURN: {(dt1 + dt2 + dt3) / 3:.2f}s")
print("=================================================================")
