FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Copy all source files before installing the package
COPY pyproject.toml README.md ./
COPY main.py ./
COPY modules/ ./modules/
COPY static/ ./static/
COPY templates/ ./templates/

RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir build wheel setuptools && \
  pip install --no-cache-dir .

RUN useradd --create-home --shell /bin/bash app && \
  chown -R app:app /app
USER app

EXPOSE 8080

ENV PORT=8080

CMD uvicorn main:app --host 0.0.0.0 --port $PORT
