# 🎵 Melodizer



**Melodizer** is a machine-learning powered music recommendation system. It uses Spotify audio features (like danceability, energy, tempo, and valence) to find tracks that are sonically similar to your favorite songs.

🌍 **Live Demo:** [https://melodizer.onrender.com](https://melodizer.onrender.com)

## ✨ Features
- **Smart Recommendations:** Uses a K-Nearest Neighbors (KNN) algorithm with cosine similarity across 9 distinct audio features to find the perfect match.
- **Genre Prediction:** Uses machine learning to predict the genre of custom audio profiles.
- **Fast Search:** Quick autocomplete track search.
- **Modern UI:** Built with React, Vite, and a responsive glassmorphism aesthetic.

## 🛠️ Tech Stack
- **Frontend:** React 19, Vite, Vanilla CSS
- **Backend:** Python, FastAPI, Pandas, Uvicorn
- **Machine Learning:** Scikit-Learn (KNN, StandardScaler)
- **Deployment:** Render (Single Web Service)

## 🚀 Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone the repository
```bash
git clone https://github.com/kartikeyash2012-beep/Melodizer.git
cd Melodizer
```

### 2. Set up the Backend
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Build the machine learning model (requires music.csv)
python build_pickle.py --data music.csv --out-dir pickles
```

### 3. Set up the Frontend
```bash
# Install Node dependencies
cd frontend
npm install

# Run the frontend dev server
npm run dev
```

*(Note: In development, the React app expects the FastAPI server to be running on `http://localhost:8000`)*

### 4. Run the API Server
In a new terminal window from the root of the project:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## 📦 Deployment (Render)

Melodizer is configured to deploy as a single Free Web Service on Render. 
The backend serves both the FastAPI endpoints and the statically built React frontend.

**Manual Render Setup (Free Tier):**
1. Create a New **Web Service** in Render.
2. Select your repository.
3. Use the following Build Command:
   `pip install -r backend/requirements.txt && npm ci --prefix frontend && npm run build --prefix frontend && python build_pickle.py --data music.csv --out-dir pickles`
4. Use the following Start Command:
   `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Add an Environment Variable: `PYTHON_VERSION = 3.11`
