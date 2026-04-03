from io import BytesIO

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover
    PdfReader = None


class ResumeParser:
    KEYWORDS = [
        "python",
        "react",
        "sql",
        "machine learning",
        "leadership",
        "communication",
        "analytics",
        "product",
        "portfolio",
    ]

    def parse(self, file_storage):
        filename = file_storage.filename or "resume"
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"
        raw_bytes = file_storage.read()
        file_storage.stream.seek(0)

        if extension == "pdf" and PdfReader is not None:
            text = self._parse_pdf(raw_bytes)
        else:
            text = raw_bytes.decode("utf-8", errors="ignore")

        lowered = text.lower()
        detected_skills = [keyword for keyword in self.KEYWORDS if keyword in lowered]
        highlights = [line.strip() for line in text.splitlines() if line.strip()][:8]

        return {
            "filename": filename,
            "detected_skills": detected_skills,
            "highlights": highlights,
            "plain_text": text[:5000],
        }

    def _parse_pdf(self, raw_bytes: bytes):
        reader = PdfReader(BytesIO(raw_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
