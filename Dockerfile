FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md ./

RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir build wheel setuptools && \
  pip install --no-cache-dir .

COPY main.py ./
COPY modules/ ./modules/
COPY static/ ./static/
COPY templates/ ./templates/

RUN useradd --create-home --shell /bin/bash app && \
  chown -R app:app /app
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
