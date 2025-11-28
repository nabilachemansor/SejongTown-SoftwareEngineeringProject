from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from collections import Counter
from nlp_utils import detect_intent, parse_date_keyword, extract_category_or_keyword
from datetime import datetime

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
    resp = requests.get(f"{BACKEND_BASE}/user-interests/{student_id}")
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

    intent = detect_intent(message)
    try:
        if intent == "events_on_date":
            drange = parse_date_keyword(message)
            events = fetch_all_events()
            matched = []
            if drange:
                start, end = drange
                start_dt = datetime.fromisoformat(start).date()
                end_dt = datetime.fromisoformat(end).date()
                for e in events:
                    try:
                        d = datetime.fromisoformat(e.get("event_date")).date()
                    except:
                        # if stored differently, try parse
                        try:
                            d = datetime.strptime(e.get("event_date")[:10], "%Y-%m-%d").date()
                        except:
                            continue
                    if start_dt <= d <= end_dt:
                        matched.append(e)
            else:
                # fallback: search keywords
                kws = extract_category_or_keyword(message)
                for e in events:
                    if any(k in (e.get("title","")+e.get("description","")+ (e.get("category") or "")).lower() for k in kws):
                        matched.append(e)
            # apply category filter IF user mentioned a category
            kws = extract_category_or_keyword(message)

            if kws:
                kw_lower = [k.lower() for k in kws]
                matched = [
                    e for e in matched
                    if e.get("category","").lower() in kw_lower
                ]
                
            if not matched:
                return jsonify({"reply":"I couldn't find events for that date/category. Do you want to see upcoming events?", "events":[]})

            # Prepare simple reply
            titles = ", ".join([f'{e["title"]} ({e["event_date"]})' for e in matched[:5]])
            return jsonify({"reply": f"I found these events: {titles}", "events": matched[:5]})

        if intent == "events_by_category_or_keyword":
            events = fetch_all_events()
            kws = extract_category_or_keyword(message)
            matched = []
            for e in events:
                text = (e.get("title","") + " " + e.get("description","") + " " + (e.get("category") or "")).lower()
                if any(k in text for k in kws):
                    matched.append(e)
            if not matched:
                return jsonify({"reply": "No events matched that category/keyword. Would you like me to show upcoming events?", "events":[]})
            titles = ", ".join([f'{e["title"]} ({e["event_date"]})' for e in matched[:5]])
            return jsonify({"reply": f"Here are matching events: {titles}", "events": matched[:6]})

        if intent == "my_registered_events":
            if not user_id:
                return jsonify({"reply":"I need your student_id to fetch your registered events. Please log in first."})
            regs = fetch_user_registered_events(user_id)
            if not regs:
                return jsonify({"reply":"You don't seem to have any registered events."})
            titles = ", ".join([f'{e["title"]} ({e["event_date"]})' for e in regs[:6]])
            return jsonify({"reply": f"You're registered for: {titles}", "events": regs[:6]})


        if intent == "recommend_events":

            events = fetch_all_events()
            today = datetime.today().date()

            # filter per month
            this_month_events = []
            for e in events:
                try:
                    d = datetime.fromisoformat(e.get("event_date")).date()
                    if d.month == today.month and d.year == today.year:
                        this_month_events.append(e)
                except:
                    continue

            if not this_month_events:
                return jsonify({"reply": "There are no events this month.", "events": []})

            # recommend from attent events and interests
            user_categories = []

            if user_id:
                regs = fetch_user_registered_events(user_id)
                interests = fetch_user_interests(user_id)

                user_categories += [r.get("category","").lower() for r in regs]
                user_categories += [i.get("name","").lower() for i in interests]

            if user_categories:
                top = [c for c,_ in Counter(user_categories).most_common(2)]
                personalized = [
                    e for e in this_month_events
                    if e.get("category","").lower() in top
                ]
            else:
                personalized = []

            final_list = personalized if personalized else this_month_events
            titles = ", ".join([f'{e["title"]} ({e["event_date"]})' for e in final_list[:5]])

            return jsonify({
                "reply": f"I recommend these events for this month: {titles}",
                "events": final_list[:5]
            })
            

        if intent == "help":
            return jsonify({"reply":"I can tell you what events are happening today/tomorrow, show events by category (e.g., 'computer class this month'), list your registered events, and recommend events for you."})

        # fallback: kalau x paham user kecek ape
        # quick keyword fallback to recommend upcoming events
        events = fetch_all_events()
        upcoming = events[:5]
        titles = ", ".join([f'{e.get("title")} ({e.get("event_date")})' for e in upcoming])
        return jsonify({"reply": f"Sorry, I didn't understand that. Here are some upcoming events: {titles}", "events": upcoming})
    except requests.HTTPError as e:
        return jsonify({"reply":"Sorry, the AI service couldn't reach the backend API."}), 500
    except Exception as e:
        return jsonify({"reply":"Unexpected error in AI service."}), 500

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=6000, 
        debug=False,
        use_reloader=False
    )