from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from collections import Counter
from nlp_utils import detect_intent, parse_date_keyword, extract_category_or_keyword, get_bot_response
from datetime import datetime, timedelta

def to_local_date(utc_str, tz_offset=9):
    """Convert UTC ISO string to local date with offset in hours (default KST=UTC+9)"""
    """# Remove Z if present
    if utc_str.endswith("Z"):
        utc_str = utc_str[:-1]
    dt_utc = datetime.strptime(utc_str[:19], "%Y-%m-%dT%H:%M:%S")
    dt_local = dt_utc + timedelta(hours=tz_offset)
    return dt_local.date()
    """
    if not utc_str:
        return None
    if utc_str.endswith("Z"):
        utc_str = utc_str[:-1]

    dt_utc = datetime.strptime(utc_str[:19], "%Y-%m-%dT%H:%M:%S")
    dt_local = dt_utc + timedelta(hours=tz_offset)
    return dt_local.date()

app = Flask(__name__)
CORS(app)

# depends on backend punye localhost
BACKEND_BASE = "http://localhost:5000/api" 

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status":"ok"})


def fetch_all_events():
    resp = requests.get(f"{BACKEND_BASE}/events")
    resp.raise_for_status()
    return resp.json()

def fetch_user_registered_events(student_id):
    resp = requests.get(f"{BACKEND_BASE}/attendance/{student_id}/attendances")
    if resp.status_code != 200:
        return []
    return resp.json()

def fetch_user_interests(student_id):
    resp = requests.get(f"{BACKEND_BASE}/user-interest/{student_id}")
    if resp.status_code != 200:
        return []
    return resp.json()

"""
# dummy data for testing
def fetch_all_events():
    return [
        {"event_id": 1, "title": "AI Workshop", "event_date": "2025-11-27", "category": "technology"},
        {"event_id": 2, "title": "Sports Day", "event_date": "2025-11-28", "category": "sports"},
        {"event_id": 3, "title": "Cybersecurity Talk", "event_date": "2025-12-01", "category": "technology"},
    ]

def fetch_user_registered_events(student_id):
    return [
        {"event_id": 1, "title": "AI Workshop", "event_date": "2025-11-27", "category": "computer"},
        ]

def fetch_user_interests(student_id):
    dummy = {
        "1":["technology","music"],
        "2":["sports"],
    }
    return dummy.get(str(student_id), [])
"""

@app.route("/chat", methods=["POST"])

def chat():
    payload = request.json or {}
    user_id = payload.get("student_id")  # optional
    message = payload.get("message", "")
    if not message:
        return jsonify({"reply": "Please send a question in the request body 'message'."}), 400

    message_lower = message.strip().lower()
    intent = detect_intent(message)
    
    # --- Debug prints ---
    print("==== New Chat Request ====")
    print("User message:", message)
    print("Detected intent:", intent)

    try:
        events = fetch_all_events()
        print("Events fetched from backend:", events)

        # --- 1. Handle basic greetings / yes / no / thanks ---
        greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]
        yes_words = ["yes", "yeah", "yep", "sure", "ok", "okay"]
        no_words = ["no", "nope", "nah", "not really"]
        thanks_words = ["thanks", "thank you", "thx"]

        if any(word in message_lower for word in greetings):
            reply = "Hello! How can I help you with events today?"
            print("Replying with greeting:", reply)
            return jsonify({"reply": reply})

        if any(word in message_lower for word in yes_words):
            reply = "Great! What kind of events are you interested in?"
            print("Replying with yes:", reply)
            return jsonify({"reply": reply})

        if any(word in message_lower for word in no_words):
            reply = "No problem! Let me know if you want to see any events."
            print("Replying with no:", reply)
            return jsonify({"reply": reply})

        if any(word in message_lower for word in thanks_words):
            reply = "You're welcome! 😊"
            print("Replying with thanks:", reply)
            return jsonify({"reply": reply})

        # --- 2. Events on specific date/range OR category ---
        if intent in ["events_on_date", "events_by_category_or_keyword"]:
            matched = events[:]  # start with all events

            # 1️⃣ Date range filtering
            drange = parse_date_keyword(message)
            if drange:
                start, end = drange
                start_dt = datetime.fromisoformat(start).date()
                end_dt = datetime.fromisoformat(end).date()
                filtered_by_date = []
                for e in matched:
                    try:
                        d = to_local_date(e.get("event_date"))
                    except:
                        try:
                            d = datetime.strptime(e.get("event_date")[:10], "%Y-%m-%d").date()
                        except:
                            continue
                    if start_dt <= d <= end_dt:
                        filtered_by_date.append(e)
                matched = filtered_by_date
                print(f"Events after date filtering ({start_dt} to {end_dt}):", [e["title"] for e in matched])

            # 2️⃣ Category/keyword filtering
            kws = extract_category_or_keyword(message)
            print("Keywords extracted:", kws)
            if kws:
                valid_categories = {e.get("category", "").lower() for e in events}
                category_keywords = [k.lower() for k in kws if k.lower() in valid_categories]
                if category_keywords:
                    matched = [e for e in matched if e.get("category", "").lower() in category_keywords]
                    print("Events after category filtering:", [e["title"] for e in matched])

            # 3️⃣ Prepare reply
            if not matched:
                reply = "I couldn't find events for that date/category. Do you want to see upcoming events?"
                return jsonify({"reply": reply, "events": []})

            titles = ", ".join([f'{e["title"]} ({to_local_date(e["event_date"])})' for e in matched[:10]])
            reply = f"I found these events: {titles}"
            return jsonify({"reply": reply, "events": matched[:10]})


        # --- 4. My registered events ---
        if intent == "my_registered_events":
            if not user_id:
                reply = "I need your student_id to fetch your registered events. Please log in first."
                print("Reply:", reply)
                return jsonify({"reply": reply})
            regs = fetch_user_registered_events(user_id)
            print("Registered events for user:", regs)
            if not regs:
                reply = "You don't seem to have any registered events."
                print("Reply:", reply)
                return jsonify({"reply": reply})
            titles = ", ".join([f'{e["title"]} ({to_local_date(e["event_date"])})' for e in regs[:5]])
            reply = f"You're registered for: {titles}"
            print("Reply:", reply)
            return jsonify({"reply": reply, "events": regs[:5]})

        # --- 5. Recommend upcoming events ---
        if intent == "recommend_events":
            today = datetime.today().date()
            upcoming = [e for e in events if to_local_date(e.get("event_date")) >= today]
            print("Upcoming events:", upcoming)
            
            if not upcoming:
                reply = "There are no upcoming events at the moment."
                print("Reply:", reply)
                return jsonify({"reply": reply, "events": []})

            # Personalization
            user_categories = []
            if user_id:
                regs = fetch_user_registered_events(user_id)
                interests = fetch_user_interests(user_id)

                print("user registered events:", regs)
                print("user interest from backend:", interests)

                #registered event cat
                user_categories += [
                    r.get("category","").lower()
                    for r in regs
                    if r.get("category")
                ]
                #interest handling
                for i in interests:
                    if isinstance(i, dict) and "name" in i:
                        user_categories.append(i["name"].lower())
                    elif isinstance(i, str):
                        user_categories.append(i.lower())

            print("Final user preference categories:", user_categories)

            if user_categories:
                top = [c for c, _ in Counter(user_categories).most_common(2)]
                personalized = [
                    e for e in upcoming
                    if str(e.get("category", "")).lower() in top
                    
                ]
            else:
                personalized = []

            final_list = personalized if personalized else upcoming

            titles = ", ".join([
                f'{e["title"]} ({to_local_date(e["event_date"])})'
                for e in final_list[:5]
            ])

            reply = f"I recommend these upcoming events: {titles}"
            print("Reply:", reply)
            return jsonify({"reply": reply, "events": final_list[:5]})
        """
        if intent == "recommend_events":
            today = datetime.today().date()
            upcoming = [e for e in events if to_local_date(e.get("event_date")) >= today]
            print("Upcoming events:", upcoming)

            if not upcoming:
                reply = "There are no upcoming events at the moment."
                print("Reply:", reply)
                return jsonify({"reply": reply, "events": []})

            # Personalization
            user_categories = []
            if user_id:
                regs = fetch_user_registered_events(user_id)
                interests = fetch_user_interests(user_id)
                user_categories += [r.get("category", "").lower() for r in regs]
                user_categories += [i.get("name", "").lower() for i in interests]

            if user_categories:
                top = [c for c, _ in Counter(user_categories).most_common(2)]
                personalized = [e for e in upcoming if e.get("category", "").lower() in top]
            else:
                personalized = []

            final_list = personalized if personalized else upcoming
            titles = ", ".join([f'{e["title"]} ({to_local_date(e["event_date"])})' for e in final_list[:5]])
            reply = f"I recommend these upcoming events: {titles}"
            print("Reply:", reply)
            return jsonify({"reply": reply, "events": final_list[:5]})
            """

        # --- 6. Help ---
        if intent == "help":
            reply = "I can tell you what events are happening today/tomorrow, show events by category (e.g., 'computer class this month'), list your registered events, and recommend upcoming events."
            print("Reply:", reply)
            return jsonify({"reply": reply})

        # --- 7. Fallback for unknown queries ---
        today = datetime.today().date()
        upcoming = [
            e for e in events 
            if to_local_date(e.get("event_date")) >= today][:5]
        titles = ", ".join([f'{e.get("title")} ({to_local_date(e.get("event_date"))})' for e in upcoming])
        reply = f"Sorry, I didn't understand that. Here are some upcoming events: {titles}"
        print("Reply:", reply)
        return jsonify({"reply": reply, "events": upcoming})

    except requests.HTTPError as e:
        print("HTTPError:", e)
        return jsonify({"reply": "Sorry, the AI service couldn't reach the backend API."}), 500
    except Exception as e:
        print("Unexpected error in /chat:", e)
        return jsonify({"reply": "Unexpected error in AI service."}), 500

# if __name__ == "__main__":
#     app.run(
#         host="0.0.0.0",
#         port=6000, 
#         debug=False,
#         use_reloader=False
#     )

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5050,   # use 5050 instead of 6000 because 6000 is unsafe port
        debug=False,
        use_reloader=False
    )
