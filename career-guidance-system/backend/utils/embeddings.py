import json
from pathlib import Path

import numpy as np

try:
    import faiss
except Exception:  # pragma: no cover
    faiss = None

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover
    SentenceTransformer = None


class EmbeddingStore:
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.database = json.loads(self.data_path.read_text(encoding="utf-8"))
        self.model = None
        self.index = None
        self.documents = []
        self._bootstrap()

    def _bootstrap(self):
        roles = self.database.get("roles", [])
        self.documents = [
            {
                "role": role["title"],
                "text": " ".join([role["title"], role["category"], *role["skills"], *role["trends"]]),
                "payload": role,
            }
            for role in roles
        ]

        if SentenceTransformer is None or faiss is None or not self.documents:
            return

        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        vectors = self.model.encode([item["text"] for item in self.documents], normalize_embeddings=True)
        self.index = faiss.IndexFlatIP(vectors.shape[1])
        self.index.add(np.array(vectors, dtype="float32"))

    def semantic_search(self, query: str, top_k: int = 3):
        if not query.strip():
            return [item["payload"] for item in self.documents[:top_k]]

        if self.index is None or self.model is None:
            lowered = query.lower()
            scored = []
            for item in self.documents:
                text = item["text"].lower()
                score = sum(1 for token in lowered.split() if token in text)
                scored.append((score, item["payload"]))
            scored.sort(key=lambda item: item[0], reverse=True)
            return [payload for _, payload in scored[:top_k]]

        vector = self.model.encode([query], normalize_embeddings=True)
        scores, indices = self.index.search(np.array(vector, dtype="float32"), top_k)
        return [self.documents[idx]["payload"] for idx in indices[0] if idx >= 0]
