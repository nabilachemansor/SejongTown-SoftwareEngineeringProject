from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from collections import Counter
from nlp_utils import detect_intent, parse_date_keyword, extract_category_or_keyword
from datetime import datetime, timedelta

# Timezone-safe date fix
def to_local_date(utc_str, tz_offset=9):
    if not utc_str:
        return None
    if utc_str.endswith("Z"):
        utc_str = utc_str[:-1]
    dt_utc = datetime.strptime(utc_str[:19], "%Y-%m-%dT%H:%M:%S")
    dt_local = dt_utc + timedelta(hours=tz_offset)
    return dt_local.date()

# Flask setup
app = Flask(__name__)
CORS(app)

BACKEND_BASE = "http://localhost:5000/api"

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

# Backend fetchers
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

# CHAT ENDPOINT
@app.route("/chat", methods=["POST"])
def chat():
    payload = request.json or {}
    user_id = payload.get("student_id")
    message = payload.get("message", "")

    # Require login first
    if not user_id:
        return jsonify({"reply": "Please log in first to use the chatbot."}), 401
    if not message:
        return jsonify({"reply": "Please send a question."}), 400

    message_lower = message.strip().lower()
    intent = detect_intent(message)

    print("\n==== NEW CHAT ====")
    print("User:", message)
    print("Intent:", intent)

    try:
        events = fetch_all_events()
        print("Events fetched:", len(events))

        # define today once for this request
        today = datetime.today().date()

        #  BASIC CHATS
        if any(w in message_lower for w in ["hi", "hello", "hey"]):
            return jsonify({"reply": "Hello! How can I help you with events today?"})
        if any(w in message_lower for w in ["thanks", "thank you"]):
            return jsonify({"reply": "You're welcome! 😊"})

        # EVENTS BY DATE / CATEGORY
        if intent in ["events_on_date", "events_by_category_or_keyword"]:
            matched = events[:]

            # Step 1: Try parse_date_keyword (exact date or range)
            drange = parse_date_keyword(message)

            # Step 1a: Month-only fallback if parse_date_keyword returns None
            if not drange:
                import calendar, re
                month_match = re.search(
                    r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\b",
                    message_lower
                )
                if month_match:
                    month_name = month_match.group(1)
                    month_number = {
                        "january": 1, "february": 2, "march": 3, "april": 4,
                        "may": 5, "june": 6, "july": 7, "august": 8,
                        "september": 9, "october": 10, "november": 11, "december": 12
                    }[month_name]
                    year = datetime.today().year
                    start_dt = datetime(year, month_number, 1).date()
                    last_day = calendar.monthrange(year, month_number)[1]
                    end_dt = datetime(year, month_number, last_day).date()
                    drange = (start_dt, end_dt)

            # Step 2: Filter by date if drange exists
            if drange:
                start_dt, end_dt = drange

                # Convert from string if parse_date_keyword returned ISO strings
                if isinstance(start_dt, str):
                    start_dt = datetime.fromisoformat(start_dt).date()
                if isinstance(end_dt, str):
                    end_dt = datetime.fromisoformat(end_dt).date()

                filtered = []
                for e in matched:
                    d = to_local_date(e.get("event_date"))
                    if d is None:
                        continue  # skip invalid dates
                    if start_dt <= d <= end_dt:
                        filtered.append(e)
                matched = filtered

            # Step 3: Filter by category/keyword ONLY when the intent is category-based
            kws = None
            if intent == "events_by_category_or_keyword":
                kws = extract_category_or_keyword(message)

            if kws:
                kws_lower = [k.lower() for k in kws]
                matched = [
                    e for e in matched
                    if e.get("category", "").lower() in kws_lower
                ]

            # Step 4: Prepare reply
            if not matched:
                return jsonify({"reply": "No events found for that request.", "events": []})

            titles = ", ".join([
                f'{e["title"]} ({to_local_date(e["event_date"])})'
                for e in matched[:10]
            ])
            return jsonify({
                "reply": f"I found these events: {titles}",
                "events": matched[:10]
            })

        # MY REGISTERED EVENTS
        if intent == "my_registered_events":
            regs = fetch_user_registered_events(user_id)
            if not regs:
                return jsonify({"reply": "You are not registered for any events."})
            titles = ", ".join([
                f'{e["title"]} ({to_local_date(e["event_date"])})' for e in regs[:5]
            ])
            return jsonify({"reply": f"You're registered for: {titles}", "events": regs[:5]})

        # AI RANKED RECOMMENDATION
        if intent == "recommend_events":
            # Step 1: Date filter FIRST
            upcoming = [
                e for e in events
                if to_local_date(e.get("event_date")) is not None
                and to_local_date(e.get("event_date")) >= today
            ]

            drange = parse_date_keyword(message)
            if drange:
                start, end = drange

                # Convert from ISO strings if needed
                if isinstance(start, str):
                    start_dt = datetime.fromisoformat(start).date()
                else:
                    start_dt = start

                if end:
                    if isinstance(end, str):
                        end_dt = datetime.fromisoformat(end).date()
                    else:
                        end_dt = end
                else:
                    # if no explicit end, default to end of that month
                    next_month = (start_dt.replace(day=28) + timedelta(days=4)).replace(day=1)
                    end_dt = next_month - timedelta(days=1)

                upcoming = [
                    e for e in upcoming
                    if start_dt <= to_local_date(e.get("event_date")) <= end_dt
                ]

            if not upcoming:
                return jsonify({"reply": "There are no events in that period.", "events": []})

            # Step 2: User preferences
            user_categories = []
            regs = fetch_user_registered_events(user_id)
            interests = fetch_user_interests(user_id)

            user_categories += [r.get("category", "").lower() for r in regs if r.get("category")]
            for i in interests:
                if isinstance(i, dict) and "name" in i:
                    user_categories.append(i["name"].lower())
                elif isinstance(i, str):
                    user_categories.append(i.lower())

            print("User preference categories:", user_categories)

            # Step 3: AI Ranking (simple scoring)
            ranked_events = []
            for e in upcoming:
                score = 0
                e_cat = str(e.get("category", "")).lower()
                if e_cat in user_categories:
                    score += 5
                d_local = to_local_date(e.get("event_date"))
                if d_local:
                    days_left = (d_local - today).days
                    if days_left <= 7:
                        score += 1
                ranked_events.append((score, e))

            ranked_events.sort(key=lambda x: x[0], reverse=True)
            final_list = [e for score, e in ranked_events]

            titles = ", ".join([
                f'{e["title"]} ({to_local_date(e["event_date"])})' for e in final_list[:10]
            ])
            return jsonify({
                "reply": f"I recommend these events for you: {titles}",
                "events": final_list[:10]
            })

        # HELP
        if intent == "help":
            return jsonify({
                "reply": "You can ask about today's events, monthly events, event categories, your registered events, or get recommendations."
            })

        # FALLBACK
        upcoming = [
            e for e in events
            if to_local_date(e.get("event_date")) is not None
            and to_local_date(e.get("event_date")) >= today
        ][:5]
        titles = ", ".join([
            f'{e["title"]} ({to_local_date(e["event_date"])})' for e in upcoming
        ])
        return jsonify({
            "reply": f"Sorry, I didn’t understand that. Here are some upcoming events: {titles}",
            "events": upcoming
        })

    except Exception as e:
        print("🔥 ERROR:", e)
        return jsonify({"reply": "Unexpected server error."}), 500

# RUN SERVER
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=False, use_reloader=False)