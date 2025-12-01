import requests

url = "http://127.0.0.1:6000/chat"
payload = {
    "message": "event in month december",
    "student_id": "20231234"
}

res = requests.post(url, json=payload)

print("status code:", res.status_code)
print("response:", res.json())


"""
chatbot x faham:

event in december -> response: {'events': [], 'reply': "I couldn't find events for that date/category. Do you want to see upcoming events?"}
suggest event for next month -> response: {'events': [], 'reply': "I couldn't find events for that date/category. Do you want to see upcoming events?"}

"""