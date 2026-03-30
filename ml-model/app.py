from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"

app = Flask(__name__)


def load_bundle():
    if not MODEL_PATH.exists():
        raise FileNotFoundError("model.pkl is missing. Run train_model.py first.")
    return joblib.load(MODEL_PATH)


@app.get("/health")
def health_check():
    return jsonify({"status": "ok"})


@app.post("/predict")
def predict():
    try:
        payload = request.get_json(force=True)
        bundle = load_bundle()
        features = pd.DataFrame(
            [
                {
                    "study_hours": payload["study_hours"],
                    "sleep_hours": payload["sleep_hours"],
                    "exercise": payload["exercise"],
                    "screen_time": payload["screen_time"],
                    "consistency": payload["consistency"],
                    "procrastination": payload["procrastination"],
                    "goal_clarity": payload["goal_clarity"],
                }
            ]
        )

        model = bundle["model"]
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        classes = model.classes_

        return jsonify(
            {
                "prediction": prediction,
                "probabilities": {
                    classes[index]: round(float(probability), 4)
                    for index, probability in enumerate(probabilities)
                },
            }
        )
    except FileNotFoundError as error:
        return jsonify({"detail": str(error)}), 500
    except KeyError as error:
        return jsonify({"detail": f"Missing field: {error.args[0]}"}), 400
    except Exception as error:
        return jsonify({"detail": str(error)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
