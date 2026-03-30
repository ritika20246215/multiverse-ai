from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "synthetic_user_behavior.csv"
MODEL_PATH = BASE_DIR / "model.pkl"
METRICS_PATH = BASE_DIR / "metrics.json"


def score_row(study_hours, sleep_hours, exercise, screen_time, consistency, procrastination, goal_clarity):
    score = 0

    score += study_hours * 1.7
    score += max(0, 8 - abs(sleep_hours - 7.5)) * 1.1
    score += exercise * 2.2
    score -= screen_time * 0.95
    score += consistency * 1.6
    score -= procrastination * 1.7
    score += goal_clarity * 1.5

    if score >= 22:
        return "High"
    if score >= 11:
        return "Average"
    return "Negative"


def build_dataset(rows: int = 900) -> pd.DataFrame:
    rng = np.random.default_rng(42)

    study_hours = np.clip(rng.normal(4.2, 2.0, rows), 0, 10)
    sleep_hours = np.clip(rng.normal(7.0, 1.3, rows), 3, 10)
    exercise = rng.integers(0, 2, rows)
    screen_time = np.clip(rng.normal(5.0, 2.3, rows), 0.5, 12)
    consistency = rng.integers(1, 11, rows)
    procrastination = rng.integers(1, 11, rows)
    goal_clarity = rng.integers(1, 11, rows)

    labels = [
        score_row(
            study_hours[i],
            sleep_hours[i],
            int(exercise[i]),
            screen_time[i],
            int(consistency[i]),
            int(procrastination[i]),
            int(goal_clarity[i]),
        )
        for i in range(rows)
    ]

    dataset = pd.DataFrame(
        {
            "study_hours": study_hours.round(2),
            "sleep_hours": sleep_hours.round(2),
            "exercise": exercise,
            "screen_time": screen_time.round(2),
            "consistency": consistency,
            "procrastination": procrastination,
            "goal_clarity": goal_clarity,
            "target": labels,
        }
    )

    return dataset.sample(frac=1, random_state=42).reset_index(drop=True)


def train_model():
    dataset = build_dataset()
    dataset.to_csv(DATA_PATH, index=False)

    feature_columns = [
        "study_hours",
        "sleep_hours",
        "exercise",
        "screen_time",
        "consistency",
        "procrastination",
        "goal_clarity",
    ]

    X = dataset[feature_columns]
    y = dataset["target"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=2,
        random_state=42,
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    report = classification_report(y_test, predictions, output_dict=True)

    payload = {
        "model": model,
        "feature_columns": feature_columns,
        "labels": sorted(y.unique().tolist()),
    }
    joblib.dump(payload, MODEL_PATH)

    metrics = {
        "rows": len(dataset),
        "accuracy": round(float(accuracy), 4),
        "class_distribution": dataset["target"].value_counts().to_dict(),
        "classification_report": report,
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(f"Dataset saved to {DATA_PATH.name}")
    print(f"Model saved to {MODEL_PATH.name}")
    print(f"Accuracy: {accuracy:.4f}")


if __name__ == "__main__":
    train_model()
