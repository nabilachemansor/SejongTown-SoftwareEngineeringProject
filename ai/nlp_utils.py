from dateutil import parser as dateparser
from datetime import datetime, timedelta
import re
import random

#Text normalization, remove xtra spaces and converts everything to lower case
def normalize_text(text: str):
    return text.strip().lower()

#Intent detection
def detect_intent(text: str):

    t = normalize_text(text)

    #Basic conversational intents
    greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]
    confirmations = ["yes", "yeah", "yup", "sure", "correct"]
    negations = ["no", "nah", "nope"]
    gratitude = ["thanks", "thank you", "thx"]
    smalltalk = ["how are you", "how's it going", "how you doing"]

    if any(g in t for g in greetings):
        return "greeting"
    if any(c in t for c in confirmations):
        return "confirmation"
    if any(n in t for n in negations):
        return "negation"
    if any(g in t for g in gratitude):
        return "gratitude"
    if any(s in t for s in smalltalk):
        return "smalltalk"

    #event related 
    if any(w in t for w in ["recommend", "suggest", "any events i should"]):
        return "recommend_events"
    if any(w in t for w in ["my events", "what i registered", "registered", "i joined", "i signed up"]):
        return "my_registered_events"
    if any(w in t for w in ["today", "tomorrow", "this week", "this month", "next week", "next month"]):
        return "events_on_date"
    if re.search(r"\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}/\d{1,2})\b", t):
        return "events_on_date"
    if any(w in t for w in ["class", "club", "academic", "sports", "technology", "music", "cultural", "food", "social", "workshop", "arts"]):
        return "events_by_category_or_keyword"

    #help
    if any(w in t for w in ["help", "what can you do", "how to"]):
        return "help"

    #fallback
    return "unknown"


# Date parsing
def parse_date_keyword(text: str):
    t = normalize_text(text)
    today = datetime.now().date()

    if "today" in t:
        return today.isoformat(), today.isoformat()
    if "tomorrow" in t:
        tomorrow = today + timedelta(days=1)
        return tomorrow.isoformat(), tomorrow.isoformat()
    if "this week" in t:
        start = today
        end = start + timedelta(days=(6 - today.weekday()))
        return start.isoformat(), end.isoformat()
    if "next week" in t:
        start = today + timedelta(days=(7 - today.weekday()))
        end = start + timedelta(days=6)
        return start.isoformat(), end.isoformat()
    if "this month" in t:
        start = datetime(today.year, today.month, 1).date()
        if today.month == 12:
            end = datetime(today.year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end = datetime(today.year, today.month + 1, 1).date() - timedelta(days=1)
        return start.isoformat(), end.isoformat()
    if "next month" in t:
        if today.month == 12:
            start = datetime(today.year + 1, 1, 1).date()
            end = datetime(today.year + 1, 2, 1).date() - timedelta(days=1)
        else:
            start = datetime(today.year, today.month + 1, 1).date()
            if start.month == 12:
                end = datetime(start.year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end = datetime(start.year, start.month + 1, 1).date() - timedelta(days=1)
        return start.isoformat(), end.isoformat()

    #Month name handling
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12
    }
    for name, month_num in months.items():
        if name in t:
            year = today.year
            if month_num < today.month:
                year += 1
            start = datetime(year, month_num, 1).date()
            if month_num == 12:
                end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end = datetime(year, month_num + 1, 1).date() - timedelta(days=1)
            return start.isoformat(), end.isoformat()

    #Numeric date YYYY-MM-DD
    m = re.search(r"(\d{4}-\d{1,2}-\d{1,2})", t)
    if m:
        try:
            d = dateparser.parse(m.group(1)).date()
            return d.isoformat(), d.isoformat()
        except:
            pass

    #Numeric slash date MM/DD or MM/DD/YYYY
    m2 = re.search(r"(\d{1,2}/\d{1,2}(?:/\d{2,4})?)", t)
    if m2:
        try:
            d = dateparser.parse(m2.group(1), dayfirst=False).date()
            return d.isoformat(), d.isoformat()
        except:
            pass

    return None

# Category / keyword extraction
def extract_category_or_keyword(text: str):
    cats = ["academic", "social", "sports", "cultural", "technology", "arts", "music", "food", "workshop", "club", "class"]
    t = normalize_text(text)
    found = [c for c in cats if c in t]
    if not found:
        # fallback: extract words longer than 3 chars
        candidates = re.findall(r'\b[a-zA-Z]{4,}\b', t)
        stop = {"what","which","have","there","events","event","this","next","month","week","today","tomorrow","i","can","me"}
        candidates = [w for w in candidates if w not in stop]
        found = candidates[:2]
    return found

# Natural bot responses
def get_bot_response(intent: str, text: str = ""):
    responses = {
        "greeting": [
            "Hello! How can I help you today?",
            "Hi there! Looking for some events?",
            "Hey! What events are you interested in?"
        ],
        "confirmation": [
            "Got it!",
            "Great!",
            "Understood."
        ],
        "negation": [
            "No worries.",
            "Alright, let me know if you change your mind.",
            "Okay."
        ],
        "gratitude": [
            "You’re welcome!",
            "No problem!",
            "Glad I could help!"
        ],
        "smalltalk": [
            "I’m doing great, thank you! How about you?",
            "I’m fine! Ready to help you find events.",
            "All good here! Looking for events today?"
        ],
        "recommend_events": [
            "I can recommend some events for you! What type of events are you interested in?",
            "Sure, I have some suggestions. Do you prefer club, sports, or academic events?"
        ],
        "my_registered_events": [
            "Let me check your registered events.",
            "Here are the events you signed up for."
        ],
        "events_on_date": [
            "Looking up events on that date...",
            "Here are the events happening then."
        ],
        "events_by_category_or_keyword": [
            "Searching for events in that category...",
            "Here are some events that match your keywords."
        ],
        "help": [
            "I can help you find events, suggest events, or tell you your registered events.",
            "You can ask me things like 'events today', 'recommend events', or 'my registered events'."
        ],
        "unknown": [
            "I’m sorry, I didn’t understand that. Could you rephrase?",
            "Hmm, I’m not sure what you mean. Could you ask about events?",
            "I don’t understand. You can ask me for events or suggestions."
        ]
    }

    if intent in responses:
        return random.choice(responses[intent])
    return "I’m not sure how to respond to that."
