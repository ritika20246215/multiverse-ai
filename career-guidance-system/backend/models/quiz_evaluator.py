import json
from pathlib import Path

try:
    from transformers import pipeline
except Exception:  # pragma: no cover
    pipeline = None


class QuizEvaluator:
    def __init__(self):
        data_path = Path(__file__).resolve().parents[1] / "data" / "career_database.json"
        database = json.loads(data_path.read_text(encoding="utf-8"))
        self.evaluation_bank = database["evaluation_bank"]
        self.classifier = None
        if pipeline is not None:
            try:
                self.classifier = pipeline(
                    "text-classification",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                )
            except Exception:
                self.classifier = None

    def evaluate(self, quiz_answers, quiz_type="technical"):
        references = self.evaluation_bank.get(quiz_type, [])
        total_score = 0
        weak_areas = []
        feedback = []

        for item in references:
            answer = quiz_answers.get(item["question"], "")
            score = self._score_answer(answer, item["reference"])
            total_score += score
            if score < 65:
                weak_areas.append(item["question"])
            feedback.append(
                {
                    "question": item["question"],
                    "score": score,
                    "feedback": self._feedback_for_score(score),
                }
            )

        final_score = round(total_score / max(1, len(references)))
        return {
            "score": final_score,
            "weak_areas": weak_areas,
            "strengths": [item["question"] for item in feedback if item["score"] >= 75],
            "feedback": feedback,
        }

    def _score_answer(self, answer, reference):
        if not answer.strip():
            return 20

        answer_tokens = set(answer.lower().split())
        reference_tokens = set(reference.lower().split())
        overlap_score = len(answer_tokens & reference_tokens) / max(1, len(reference_tokens))
        base_score = 35 + overlap_score * 55

        if self.classifier is not None:
            sentiment = self.classifier(answer[:512])[0]
            if sentiment["label"] == "POSITIVE":
                base_score += 5

        return min(100, round(base_score))

    def _feedback_for_score(self, score):
        if score >= 80:
            return "Clear and convincing response with strong structure."
        if score >= 65:
            return "Solid direction, but it needs more specificity and examples."
        return "Needs stronger reasoning, clearer steps, and more concrete evidence."
