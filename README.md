# SejongTown-SoftwareEngineeringProject

# frontend/scripts.js -> make changes in chatbot part, but still donno what it will looks like, so just change it anywhere u want sksksk

# backend/interests.js -> added so that recommended event based on registered events and user interests, not sure if its correct or not tho...

# backend/server.js -> add import interests and app.use for interests

# to test ai locally -> uncomment dummy data lam app.py -> cd ai -> pip install -r requirements.txt -> python app.py (make sure it show port is running) -> open new shell, cd ai, python test.app

!! node_modules will not clone together because the file is too big, so make sure your package-lock.json and package.json is same with mine one (very very long one), then  in your terminal, type "npm install" (no need in backend folder, just inside SejongTown-SoftwareEngineeringProject is okay). After that, npm will read your package.json and package-lock.json. It will rebuild the node_modules folder exactly as I have one.

Before run the code:
1. Must make sure you already have node_modules folder!!
2. Connect backend/database: Type "node backend\server.js" or "node server.js" in terminal 1
3. Connect AI: Type "python app.py" in terminal 2
4. If database didnt have any events, the main page will be empty, so need to create event first and save in the database, then only the main page will have event shown up.