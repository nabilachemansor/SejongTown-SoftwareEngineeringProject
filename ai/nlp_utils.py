from dateutil import parser as dateparser
from datetime import datetime, timedelta
import re
from collections import Counter

def normalize_text(text: str):
    return text.strip().lower()

def detect_intent(text: str):
    """
    Return one of:
      - 'events_on_date'  (user asks events today / tomorrow / specific date)
      - 'events_by_category_or_keyword' (e.g., 'computer class this month', 'club events this week')
      - 'my_registered_events' (what I signed up for / my events)
      - 'recommend_events' (recommend me events)
      - 'help' or 'unknown'
    """
    t = normalize_text(text)
    """
    if any(w in t for w in [
        "my interest","my interests",
        "what is my interest",
        "what am i interested at",
        "show my interest"
    ]):
    
        return "my_interests"
        """

    if any(w in t for w in ["recommend", "suggest", "any events i should"]):
        return "recommend_events"
    if any(w in t for w in ["my events", "what i registered", "registered", "i joined", "i signed up"]):
        return "my_registered_events"
    # date words
    if any(w in t for w in ["today", "tomorrow", "this week", "this month", "next week", "next month"]):
        return "events_on_date"
    # month/day tokens or 'month' keyword
    if re.search(r"\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}/\d{1,2})\b", t):
        return "events_on_date"
    if any(w in t for w in ["class", "club", "academic", "sports", "technology", "music", "cultural", "food", "social", "workshop"]):
        return "events_by_category_or_keyword"
    #if any(w in t for w in ["recommend", "suggest", "any events i should"]):
        #return "recommend_events"
    if any(w in t for w in ["help", "what can you do", "how to"]):
        return "help"
    return "unknown"

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
        end = today + timedelta(days=(6 - today.weekday()))
        return start.isoformat(), end.isoformat()

    if "next week" in t:
        start = today + timedelta(days=7 - today.weekday())
        end = start + timedelta(days=6)
        return start.isoformat(), end.isoformat()

    if "this month" in t:
        start = today.replace(day=1)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end = start.replace(month=start.month + 1, day=1) - timedelta(days=1)
        return start.isoformat(), end.isoformat()

    if "next month" in t:
        if today.month == 12:
            start = today.replace(year=today.year + 1, month=1, day=1)
        else:
            start = today.replace(month=today.month + 1, day=1)

        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end = start.replace(month=start.month + 1, day=1) - timedelta(days=1)

        return start.isoformat(), end.isoformat()

    # ✅ MONTH NAME HANDLING (THIS FIXES DECEMBER BUG)
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12
    }

    for name, month_num in months.items():
        if name in t:
            year = today.year
            start = today.replace(year=year, month=month_num, day=1)

            if month_num == 12:
                end = start.replace(year=year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end = start.replace(month=month_num + 1, day=1) - timedelta(days=1)

            return start.isoformat(), end.isoformat()

    # numeric date: 2025-12-01
    m = re.search(r"(\d{4}-\d{1,2}-\d{1,2})", text)
    if m:
        try:
            d = dateparser.parse(m.group(1)).date()
            return d.isoformat(), d.isoformat()
        except:
            pass

    # numeric slash date: 12/01
    m2 = re.search(r"(\d{1,2}/\d{1,2}(?:/\d{2,4})?)", text)
    if m2:
        try:
            d = dateparser.parse(m2.group(1), dayfirst=False).date()
            return d.isoformat(), d.isoformat()
        except:
            pass
        
    return None 


def extract_category_or_keyword(text: str):
    # look for known categories first
    cats = ["academic", "social", "sports", "cultural", "technology", "arts", "music", "food", "workshop", "club", "class"]
    t = normalize_text(text)
    found = []
    for c in cats:
        if c in t:
            found.append(c)
    # fallback: extract nouns / keywords using simple regex
    if not found:
        # get words longer than 3 chars
        candidates = re.findall(r'\b[a-zA-Z]{4,}\b', t)
        # remove stopwords
        stop = {"what","which","have","there","events","event","this","next","month","week","today","tomorrow","i","can","me"}
        candidates = [w for w in candidates if w not in stop]
        found = candidates[:2]
    return found